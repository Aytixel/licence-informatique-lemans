import { decompress } from "https://deno.land/x/brotli@v0.1.4/mod.ts";
import { deflate, gzip } from "https://deno.land/x/denoflate@1.2.1/mod.ts";

function compress(
  request: Request,
  data: Uint8Array,
  headers: any,
): Uint8Array {
  const acceptEncoding = request.headers.get("accept-encoding") || "";

  if (/\bgzip\b/.test(acceptEncoding)) {
    headers["vary"] = "Accept-Encoding";
    headers["content-encoding"] = "gzip";

    return gzip(data, undefined);
  }
  if (/\bdeflate\b/.test(acceptEncoding)) {
    headers["vary"] = "Accept-Encoding";
    headers["content-encoding"] = "deflate";

    return deflate(data, undefined);
  }
  if (/\bbr\b/.test(acceptEncoding)) {
    headers["vary"] = "Accept-Encoding";
    headers["content-encoding"] = "br";

    return decompress(data);
  }

  return data;
}

export { compress };
