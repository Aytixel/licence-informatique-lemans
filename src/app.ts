import { config } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import { exists } from "https://deno.land/std@0.107.0/fs/mod.ts";
import { Router } from "./router.ts";
import { Mime } from "./mime.ts";
import { stream } from "./stream.ts";
import { compress } from "./compress.ts";
import { Cache } from "./cache.ts";
import { Error404, Error500, NotModified304 } from "./status.ts";
import { Runner } from "./runner.ts";

const env = config({ safe: true });
const router = new Router(env);
const cache = new Cache();
const runner = new Runner(env);
const server = Deno.listenTls({
  port: Number(env.PORT),
  hostname: env.HOSTNAME,
  certFile: env.SSL_CERT_PATH,
  keyFile: env.SSL_PRIVATE_KEY_PATH,
  alpnProtocols: ["h2", "http/1.1"],
});

async function readFile(
  request: Request,
  returnDataType: string,
  routerData: any,
  headers: any,
): Promise<{ data: any; status: number }> {
  let data: any = new Uint8Array();
  let status = 200;

  try {
    switch (returnDataType) {
      case "text":
        data = new TextEncoder().encode(
          await runner.runWithTextData(
            request,
            routerData,
            await Deno.readTextFile(routerData.filePath),
            headers,
          ),
        );
        break;
      case "stream":
        let streamData = await stream(request, routerData.filePath, headers);

        data = streamData.data;
        status = streamData.status;

        await runner.run(request, routerData, headers);
        break;
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
    try {
      const { routerData, subDomainFound } = router.route(request);

      if (subDomainFound && await exists(routerData.filePath)) {
        const headers = {
          "content-type": Mime.getMimeType(routerData.parsedPath.ext),
        };
        const { data, status } = await readFile(
          request,
          Mime.getReturnDataType(routerData.parsedPath.ext),
          routerData,
          headers,
        );
        const body = compress(
          request,
          data,
          headers,
        );

        if (cache.addCacheHeader(request, data, routerData, headers)) {
          respondWith(new NotModified304()).catch(console.error);
        } else {
          const response = new Response(body, { headers, status });

          respondWith(response).catch(console.error);
        }
      } else respondWith(new Error404()).catch(console.error);
    } catch (error) {
      respondWith(new Error500()).catch(console.error);

      console.error(error);
    }
  }
}

await runner.runApp();

for await (const conn of server) handle(conn).catch(console.error);
