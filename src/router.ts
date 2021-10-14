import { DotenvConfig } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import { join, parse } from "https://deno.land/std@0.107.0/path/mod.ts";
import { createSubDomainConfig, getJsonSync } from "./utils.ts";

class Router {
  private config: any;
  private publicPath: string;

  constructor(env: DotenvConfig) {
    this.config = createSubDomainConfig(
      getJsonSync("./src/config/router.json"),
    );
    this.publicPath = env.PUBLIC_PATH;
  }

  route(request: Request) {
    const routerData: any = {
      url: new URL(request.url),
    };
    let subDomainFound = true;

    routerData.searchParams = new URLSearchParams(
      routerData.url.search.substring(1),
    );
    routerData.subDomain = routerData.url.hostname.split(".").slice(0, -2).join(
      ".",
    );

    if (routerData.subDomain == "") {
      routerData.subDomain = this.config.defaultSubDomain;
    }

    const subDomainConfig = this.config
      .subDomain[
        routerData.subDomain
      ];

    if (subDomainConfig) {
      // get whether it should route the response and redirect it or not, and if so where ?
      const parsedPath = parse(routerData.url.pathname);
      let redirectionPathToApply = null;

      for (
        const redirectionPath in subDomainConfig
      ) {
        const subDomainConfigRegExp = subDomainConfig[redirectionPath];
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
              parsedPath.dir,
            )
            ? 2
            : 1;
        }
        if (typeof subDomainConfigRegExp.file === "string") {
          regExpPassed[2] = RegExp(subDomainConfigRegExp.file, "i").test(
              parsedPath.base,
            )
            ? 2
            : 1;
        }

        if (regExpPassed.filter((x) => x).every((x) => x == 2)) {
          redirectionPathToApply = redirectionPath;
          break;
        }
      }

      routerData.domainFilePath = join(
        routerData.subDomain,
        redirectionPathToApply
          ? (redirectionPathToApply.slice(-1) == "/"
            ? redirectionPathToApply + parsedPath.base
            : redirectionPathToApply)
          : routerData.url.pathname,
      );
      routerData.filePath = join(
        this.publicPath,
        routerData.domainFilePath,
      );
      routerData.parsedPath = parse(routerData.filePath);
    } else subDomainFound = false;

    return { routerData, subDomainFound };
  }
}

export { Router };
