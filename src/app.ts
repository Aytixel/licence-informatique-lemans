import { config } from "./deps.ts";
import { Router, RouterData } from "./router.ts";
import { Mime } from "./mime.ts";
import { stream } from "./stream.ts";
import { compress } from "./compress.ts";
import { Cache } from "./cache.ts";
import { Error404, Error500, NotModified304 } from "./status.ts";
import { Runner } from "./runner.ts";
import { exists } from "./utils.ts";
import { WebSocketServer } from "./websocket.ts";

const env = await config({ safe: true });
const router = new Router(env);
const cache = new Cache();
const runner = new Runner(env);

await runner.runApp();

const webSocketServer = new WebSocketServer(env, runner);
const server = Number(env.ENABLE_SSL)
  ? Deno.listenTls({
    port: Number(env.PORT),
    hostname: env.HOSTNAME,
    certFile: env.SSL_CERT_PATH,
    keyFile: env.SSL_PRIVATE_KEY_PATH,
    alpnProtocols: ["h2", "http/1.1"],
  })
  : Deno.listen({
    port: Number(env.PORT),
    hostname: env.HOSTNAME,
  });

async function readFile(
  request: Request,
  returnDataType: string,
  routerData: RouterData,
  headers: Record<string, string>,
): Promise<{ data: Uint8Array; status: number }> {
  let data = new Uint8Array();
  let status = 200;

  try {
    switch (returnDataType) {
      case "text":
        data = await runner.runWithTextData(
          request,
          routerData,
          headers,
          await Deno.readTextFile(routerData.filePath),
        );
        break;
      case "stream": {
        const streamData = await stream(request, routerData.filePath, headers);

        data = streamData.data;
        status = streamData.status;

        await runner.run(request, routerData, headers);
        break;
      }
      case "binary":
        data = await Deno.readFile(routerData.filePath);

        await runner.run(request, routerData, headers);
    }
  } catch (error) {
    switch (error.name) {
      case "NotFound":
      case "PermissionDenied":
        status = 404;
        break;
      default:
        status = 500;
        console.error(error);
    }
  }

  return { data, status };
}

async function handle(conn: Deno.Conn) {
  for await (const { request, respondWith } of Deno.serveHttp(conn)) {
    if (webSocketServer.upgrade(request, respondWith)) continue;

    try {
      const { routerData, subDomainFound } = router.route(request);

      if (subDomainFound) {
        const headers = {
          "content-type": Mime.getMimeType(routerData.parsedPath.ext),
        };
        const { data, status } = await exists(routerData.filePath)
          ? await readFile(
            request,
            Mime.getReturnDataType(routerData.parsedPath.ext),
            routerData,
            headers,
          )
          : await runner.runWithNothing(
            request,
            routerData,
            headers,
          );

        if (status != 301 && status != 302) {
          const body = compress(
            request,
            data,
            headers,
          );

          if (cache.addCacheHeader(request, body, routerData, headers)) {
            respondWith(new NotModified304()).catch(console.error);
          } else {
            respondWith(new Response(body, { headers, status })).catch(
              console.error,
            );
          }
        } else {
          respondWith(new Response(null, { headers, status })).catch(
            console.error,
          );
        }
      } else respondWith(new Error404()).catch(console.error);
    } catch (error) {
      respondWith(new Error500()).catch(console.error);

      console.error(error);
    }
  }
}

for await (const conn of server) handle(conn).catch(console.error);
