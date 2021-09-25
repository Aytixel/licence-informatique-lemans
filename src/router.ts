import { DotenvConfig } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import { join, parse } from "https://deno.land/std@0.107.0/path/mod.ts";
import { getJsonSync } from "./utils.ts";

class Router {
  private config: any;
  private publicPath: string;

  constructor(env: DotenvConfig) {
    this.config = getJsonSync("./src/config/router.json");
    this.publicPath = env.PUBLIC_PATH;

    // create sub domain config from default config and sub domain overwrite config
    for (const subDomainName in this.config.subDomain) {
      const tempConfig = Object.assign({}, this.config.defaultConfig);
      const subDomainConfig = this.config.subDomain[subDomainName];

      for (const pathToRedirect in subDomainConfig) {
        tempConfig[pathToRedirect] = subDomainConfig[pathToRedirect];
      }

      this.config.subDomain[subDomainName] = tempConfig;
    }
  }

  route(request: Request) {
    const routerData: any = {
      url: new URL(request.url),
    };
    let subDomainFound = true;

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
      routerData.domainPath = join(
        this.publicPath,
        routerData.subDomain,
      );

      // get whether it should route the response and redirect it or not, and if so where ?
      const parsedPath = parse(routerData.url.pathname);
      let redirect = null;

      for (
        const pathToRedirect in subDomainConfig
      ) {
        if (pathToRedirect.slice(-1) == "/") {
          if (
            RegExp(subDomainConfig[pathToRedirect], "i").test(
              parsedPath.dir,
            )
          ) {
            redirect = pathToRedirect;
            break;
          }
        } else {
          if (
            RegExp(subDomainConfig[pathToRedirect], "i").test(
              routerData.url.pathname,
            )
          ) {
            redirect = pathToRedirect;
            break;
          }
        }
      }

      if (redirect) {
        routerData.filePath = join(
          routerData.domainPath,
          redirect.slice(-1) == "/" ? redirect + parsedPath.base : redirect,
        );
      } else {
        routerData.filePath = join(
          routerData.domainPath,
          routerData.url.pathname,
        );
      }

      routerData.parsedPath = parse(routerData.filePath);
    } else subDomainFound = false;

    return { routerData, subDomainFound };
  }
}

export { Router };
