type Types = Record<string, string>;
type Categories = Record<string, string[]>;

const extensions: Types = {
  "html": "html",
  "htm": "html",
  "xhtml": "xhtml",
  "xml": "xml",
  "pdf": "pdf",
  "css": "css",
  "js": "js",
  "mjs": "js",
  "json": "json",
  "svg": "svg",
  "svgz": "svg",
  "webp": "webp",
  "png": "png",
  "jpeg": "jpg",
  "jpg": "jpg",
  "jpe": "jpg",
  "jfif": "jpg",
  "jif": "jpg",
  "ico": "ico",
  "gif": "gif",
  "tiff": "tiff",
  "tif": "tiff",
  "woff": "woff",
  "woff2": "woff2",
  "eot": "eot",
  "ttf": "ttf",
  "mp4": "mp4",
  "mpeg": "mpeg",
  "avi": "avi",
  "ogv": "ogv",
  "ogx": "ogx",
  "webm": "webm",
  "m4a": "m4a",
  "mp3": "mp3",
  "aac": "aac",
  "oga": "oga",
  "wav": "wav",
  "weba": "weba",
};
const defaultMimeType = "text/plain";
const mimeTypes: Types = {
  "html": "text/html; charset=UTF-8",
  "xhtml": "application/xhtml+xml",
  "xml": "application/xml",
  "pdf": "application/pdf",
  "css": "text/css",
  "js": "application/javascript",
  "json": "application/json",
  "svg": "image/svg+xml",
  "webp": "image/webp",
  "png": "image/png",
  "jpg": "image/jpg",
  "ico": "image/x-ico",
  "gif": "image/gif",
  "tiff": "image/tiff",
  "woff": "application/font-woff woff",
  "woff2": "application/font-woff2",
  "eot": "application/vnd.ms-fontobject",
  "ttf": "font/ttf",
  "mp4": "video/mp4",
  "mpeg": "video/mpeg",
  "avi": "video/x-msvideo",
  "ogv": "video/ogg",
  "ogx": "application/ogg",
  "webm": "video/webm",
  "m4a": "audio/mp4",
  "mp3": "audio/mpeg",
  "aac": "audio/aac",
  "oga": "audio/ogg",
  "wav": "audio/x-wav",
  "weba": "audio/weba",
};
const defaultMimeTypeCategory = "unknown";
const mimeTypeCategories: Categories = {
  "document": ["html", "xhtml"],
  "file": ["xml", "pdf"],
  "style": ["css"],
  "script": ["js"],
  "data": ["json"],
  "image": ["svg", "webp", "png", "jpg", "ico", "gif", "tiff"],
  "font": ["woff", "woff2", "eot", "ttf"],
  "video": ["mp4", "mpeg", "avi", "ogv", "ogx", "webm"],
  "audio": ["m4a", "mp3", "aac", "oga", "wav", "weba"],
};
const defaultReturnDataType = "binary";
const returnDataTypes: Categories = {
  "text": [
    "html",
    "xhtml",
    "xml",
    "css",
    "js",
    "json",
    "svg",
  ],
  "binary": [
    "webp",
    "png",
    "jpg",
    "ico",
    "gif",
    "tiff",
    "woff",
    "woff2",
    "eot",
    "ttf",
  ],
  "stream": [
    "mp4",
    "mpeg",
    "avi",
    "ogv",
    "ogx",
    "webm",
    "m4a",
    "mp3",
    "aac",
    "oga",
    "wav",
    "weba",
  ],
};

class Mime {
  private static extensionToFileType(extension: string): string {
    extension = extension.toLowerCase();

    if (extension.startsWith(".")) extension = extension.substring(1);
    if (extensions[extension]) return extensions[extension];

    return extension;
  }

  static getMimeType(extension: string): string {
    return mimeTypes[Mime.extensionToFileType(extension)] || defaultMimeType;
  }

  static getMimeTypeCategory(extension: string): string {
    const fileType = Mime.extensionToFileType(extension);

    for (const mimeTypeCategory in mimeTypeCategories) {
      if (
        mimeTypeCategories[mimeTypeCategory].find((fileType_: string) =>
          fileType_ == fileType
        )
      ) {
        return mimeTypeCategory;
      }
    }

    return defaultMimeTypeCategory;
  }

  static getReturnDataType(extension: string): string {
    const fileType = Mime.extensionToFileType(extension);

    for (const returnDataType in returnDataTypes) {
      if (
        returnDataTypes[returnDataType].find((fileType_: string) =>
          fileType_ == fileType
        )
      ) {
        return returnDataType;
      }
    }

    return defaultReturnDataType;
  }
}

export { Mime };
