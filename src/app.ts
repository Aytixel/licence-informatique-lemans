import { config } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import { exists } from "https://deno.land/std@0.107.0/fs/mod.ts";
import { Router } from "./router.ts";
import Mime from "./mime.ts";
import stream from "./stream.ts";
import compress from "./compress.ts";
import { Error404, Error500 } from "./error.ts";

const env = config({ safe: true });
const server = Deno.listen({
  port: Number(env.PORT),
  hostname: env.HOSTNAME,
});

async function readFile(
  request: Request,
  returnDataType: string,
  pathname: string,
  headers: any,
): Promise<{ data: any; status: number }> {
  let data: any = new Uint8Array();
  let status = 200;

  try {
    switch (returnDataType) {
      case "text":
        data = new TextEncoder().encode(await Deno.readTextFile(pathname));
        break;
      case "stream":
        let streamData = await stream(request, pathname, headers);

        data = streamData.data;
        status = streamData.status;
        break;
      case "binary":
        data = await Deno.readFile(pathname);
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
  const router = new Router(env);

  for await (const { request, respondWith } of Deno.serveHttp(conn)) {
    try {
      const { routerData, subDomainFound } = router.route(request);
      const headers = {
        "content-type": Mime.getMimeType(routerData.parsedPath.ext),
      };

      if (subDomainFound && await exists(routerData.filePath)) {
        const { data, status } = await readFile(
          request,
          Mime.getReturnDataType(routerData.parsedPath.ext),
          routerData.filePath,
          headers,
        );
        const body = compress(
          request,
          data,
          headers,
        );
        const response = new Response(body, { headers, status });

        respondWith(response).catch(console.error);
      } else respondWith(new Error404()).catch(console.error);
    } catch (error) {
      respondWith(new Error500()).catch(console.error);

      console.error(error);
    }
  }
}

for await (const conn of server) handle(conn);
