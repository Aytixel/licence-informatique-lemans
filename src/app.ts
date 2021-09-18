import { config } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import { join, parse } from "https://deno.land/std@0.107.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.107.0/fs/mod.ts";
import Mime from "./mime.ts";
import { Error404, Error500 } from "./error.ts";

const env = config({ safe: true });
const server = Deno.listen({
  port: Number(env.PORT),
  hostname: env.HOSTNAME,
});
const body = new TextEncoder().encode("Hello World");

async function readFile(
  returnDataType: string,
  pathname: string,
): Promise<Uint8Array> {
  let binary = new Uint8Array();

  switch (returnDataType) {
    case "text":
      binary = new TextEncoder().encode(await Deno.readTextFile(pathname));
      break;
    case "stream":
    case "binary":
      binary = await Deno.readFile(pathname);
  }

  return binary;
}

async function handle(conn: Deno.Conn) {
  for await (const { request, respondWith } of Deno.serveHttp(conn)) {
    try {
      const url = new URL(request.url);
      const parsedPath = parse(url.pathname);
      const filePath = join(env.PUBLIC_PATH, url.pathname);
      const headers = { "content-type": Mime.getMimeType(parsedPath.ext) };

      if (await exists(filePath)) {
        const body = await readFile(
          Mime.getReturnDataType(parsedPath.ext),
          filePath,
        );
        const response = new Response(body, { headers });

        respondWith(response);
      } else respondWith(new Error404());
    } catch (error) {
      respondWith(new Error500());
      console.error(error);
    }
  }
}

for await (const conn of server) handle(conn);
