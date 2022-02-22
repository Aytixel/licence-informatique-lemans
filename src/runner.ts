import { DotenvConfig } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { join, resolve } from "https://deno.land/std@0.126.0/path/mod.ts";

class Runner {
  private runnablePath: string;
  private app: any;
  private env: DotenvConfig;

  constructor(env: DotenvConfig) {
    this.env = env;
    this.runnablePath = env.RUNNABLE_PATH;
  }

  private getRunnablePath(path: string) {
    for (const extension of ["ts", "js"]) {
      const runnablePath = resolve(
        join(this.runnablePath, path + "." + extension),
      );

      try {
        Deno.close(Deno.openSync(runnablePath).rid);

        return "file://" + runnablePath;
      } catch (_) {}
    }

    return null;
  }

  async runApp() {
    const runnablePath = this.getRunnablePath("app");

    if (runnablePath) {
      this.app = new (await import(runnablePath)).default(this.env);

      await this.app.init();
    }
  }

  async run(request: Request, routerData: any, headers: any) {
    const runnablePath = this.getRunnablePath(routerData.domainFilePath);

    if (runnablePath) {
      (await import(runnablePath)).default(
        this.app,
        request,
        routerData,
        headers,
      );
    }
  }

  async runWithTextData(
    request: Request,
    routerData: any,
    data: string,
    headers: any,
  ): Promise<string> {
    const runnablePath = this.getRunnablePath(routerData.domainFilePath);

    if (runnablePath) {
      return await (await import(runnablePath)).default(
        this.app,
        request,
        routerData,
        data,
        headers,
      ) || data;
    }

    return data;
  }
}

export { Runner };
