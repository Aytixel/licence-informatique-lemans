import { DotenvConfig, join, parse, ParsedPath } from "./deps.ts";
import { createSubDomainConfig, getJsonSync } from "./utils.ts";

interface SubDomainConfig {
  all?: string;
  file?: string;
  path?: string;
}

interface RouterConfig {
  defaultSubDomain: string;
  defaultConfig: Record<string, Record<string, SubDomainConfig>>;
  subDomain: Record<string, Record<string, SubDomainConfig>>;
}

interface RouterData {
  url: URL;
  searchParams: URLSearchParams;
  subDomain: string;
  domainFilePath: string;
  filePath: string;
  parsedPath: ParsedPath;
}

class Router {
  private config: RouterConfig;
  private publicPath: string;

  constructor(env: DotenvConfig) {
    this.config = createSubDomainConfig(
      getJsonSync("./src/config/router.json"),
    );
    this.publicPath = env.PUBLIC_PATH;
  }

  route(request: Request) {
    const url = new URL(request.url);
    const routerData: RouterData = {
      url,
      searchParams: new URLSearchParams(
        url.search.substring(1),
      ),
      subDomain: url.hostname.split(".").slice(0, -2).join(
        ".",
      ),
      domainFilePath: "",
      filePath: "",
      parsedPath: parse(""),
    };
    let subDomainFound = true;

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
        const regExpPassed = [0, 0, 0]; // 0 = not have to be test, 1 = tested false, 2 = tested true

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

export type { RouterData };
export { Router };
