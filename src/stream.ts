import { ResponseData } from "./app.ts";
import { readRange } from "./deps.ts";

async function stream(
  request: Request,
  pathname: string,
  headers: Record<string, string>,
): Promise<ResponseData> {
  const file = await Deno.open(pathname, { read: true });
  const fileSize = (await file.stat()).size;
  const range = request.headers.get("range");

  headers["accept-ranges"] = "bytes";

  if (range) {
    const splitedRange = range.replace(/bytes=/, "").split("-");
    const start = parseInt(splitedRange[0]);
    const end = splitedRange[1] ? parseInt(splitedRange[1]) : fileSize - 1;

    headers["content-range"] = `bytes ${start}-${end}/${fileSize}`;

    const data = await readRange(file, { start, end });

    file.close();

    return { data: data, status: 206 };
  }

  headers["content-length"] = fileSize.toString(10);

  return { data: new Uint8Array(), status: 200 };
}

export { stream };
