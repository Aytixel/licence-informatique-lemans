import { brotli_compress, deflate, gzip } from "./deps.ts";

function compress(
  request: Request,
  data: Uint8Array,
  headers: Record<string, string>,
): Uint8Array {
  const acceptEncoding = request.headers.get("accept-encoding") || "";

  if (/\bgzip\b/.test(acceptEncoding)) {
    headers["vary"] = "Accept-Encoding";
    headers["content-encoding"] = "gzip";

    return gzip(data);
  }
  if (/\bdeflate\b/.test(acceptEncoding)) {
    headers["vary"] = "Accept-Encoding";
    headers["content-encoding"] = "deflate";

    return deflate(data);
  }
  if (/\bbr\b/.test(acceptEncoding)) {
    headers["vary"] = "Accept-Encoding";
    headers["content-encoding"] = "br";

    return brotli_compress(data);
  }

  return data;
}

export { compress };
