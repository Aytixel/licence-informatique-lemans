import { DotenvConfig } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import { existsSync } from "https://deno.land/std@0.107.0/fs/mod.ts";
import { join, resolve } from "https://deno.land/std@0.110.0/path/mod.ts";

class Runner {
  private runnablePath: string;
  private app: any;

  constructor(env: DotenvConfig) {
    this.runnablePath = env.RUNNABLE_PATH;

    this.runApp(env);
  }

  private getRunnablePath(path: string) {
    for (const extension of ["ts", "js"]) {
      const runnablePath = resolve(
        join(this.runnablePath, path + "." + extension),
      );

      if (existsSync(runnablePath)) return "file://" + runnablePath;
    }

    return null;
  }

  private async runApp(env: DotenvConfig) {
    const runnablePath = this.getRunnablePath("app");

    if (runnablePath) this.app = new (await import(runnablePath)).default(env);
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
