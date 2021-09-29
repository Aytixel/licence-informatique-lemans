import etag from "https://cdn.skypack.dev/etag";
import { createSubDomainConfig, getJsonSync } from "./utils.ts";

class Cache {
  private config: any;

  constructor() {
    this.config = createSubDomainConfig(getJsonSync("./src/config/cache.json"));
  }

  addCacheHeader(
    request: Request,
    data: Uint8Array,
    routerData: any,
    headers: any,
  ) {
    const subDomainConfig = this.config
      .subDomain[
        routerData.subDomain
      ];

    for (
      const cacheConfig in subDomainConfig
    ) {
      const subDomainConfigRegExp = subDomainConfig[cacheConfig];
      const regExpPassed = [0, 0, 0]; // 0 = not have to be test, 1 = have to be test, 2 = tested true

      if (typeof subDomainConfigRegExp.all === "string") {
        regExpPassed[0] = RegExp(subDomainConfigRegExp.all, "i").test(
            routerData.url.pathname,
          )
          ? 2
          : 1;
      }
      if (typeof subDomainConfigRegExp.path === "string") {
        regExpPassed[1] = RegExp(subDomainConfigRegExp.path, "i").test(
            routerData.parsedPath.dir,
          )
          ? 2
          : 1;
      }
      if (typeof subDomainConfigRegExp.file === "string") {
        regExpPassed[2] = RegExp(subDomainConfigRegExp.file, "i").test(
            routerData.parsedPath.base,
          )
          ? 2
          : 1;
      }

      if (regExpPassed.filter((x) => x).every((x) => x == 2)) {
        headers["cache-control"] = cacheConfig;

        if (
          cacheConfig.includes("no-cache") ||
          request.headers.has("if-none-match")
        ) {
          const tempEtag = etag(new TextDecoder().decode(data));

          if (cacheConfig.includes("no-cache")) {
            headers["etag"] = tempEtag;
          }

          return request.headers.get("if-none-match") ==
            tempEtag;
        }

        return false;
      }
    }
  }
}

export { Cache };
