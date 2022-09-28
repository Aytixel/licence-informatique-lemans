import { DotenvConfig, join, resolve } from "./deps.ts";
import { existsSync } from "./utils.ts";
import { RouterData } from "./router.ts";
import { WebSocketConnectionInfo } from "./websocket.ts";

class AppRunner {
  public env: DotenvConfig;
  public connections: WebSocketConnectionInfo[];

  constructor(env: DotenvConfig) {
    this.env = env;
    this.connections = [];
  }

  async init() {}
}

type RespondWith = (data?: Uint8Array | string) => void;

class Runner {
  public app: AppRunner;

  private env: DotenvConfig;
  private runnablePath: string;

  constructor(env: DotenvConfig) {
    this.env = env;
    this.app = new AppRunner(env);
    this.runnablePath = env.RUNNABLE_PATH;
  }

  private getRunnablePath(path: string) {
    for (const extension of ["ts", "tsx", "js", "jsx"]) {
      const runnablePath = resolve(
        join(this.runnablePath, path + "." + extension),
      );

      if (existsSync(runnablePath)) return "file://" + runnablePath;
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

  async run(
    request: Request,
    routerData: RouterData,
    headers: Record<string, string>,
  ) {
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
    routerData: RouterData,
    headers: Record<string, string>,
    data: string,
  ): Promise<Uint8Array> {
    const runnablePath = this.getRunnablePath(routerData.domainFilePath);

    if (runnablePath) {
      return new TextEncoder().encode(
        await (await import(runnablePath)).default(
          this.app,
          request,
          routerData,
          headers,
          data,
        ) || data,
      );
    }

    return new TextEncoder().encode(data);
  }

  runWithNothing(
    request: Request,
    routerData: RouterData,
    headers: Record<string, string>,
  ): Promise<{ data: Uint8Array; status: number }> {
    const runnablePath = this.getRunnablePath(routerData.domainFilePath);

    return new Promise((resolve) => {
      if (runnablePath) {
        import(runnablePath).then((importedRunner) => {
          let hasResolved = false;
          const respondWith = (data: Uint8Array | string) => {
            if (!hasResolved) {
              hasResolved = true;

              resolve({
                data: data === undefined
                  ? new Uint8Array()
                  : typeof data === "string"
                  ? new TextEncoder().encode(data)
                  : data,
                status: 200,
              });
            }
          };

          importedRunner.default(
            this.app,
            request,
            routerData,
            headers,
            respondWith,
          ).catch(() => resolve({ data: new Uint8Array(), status: 404 }));
        }).catch(() => resolve({ data: new Uint8Array(), status: 404 }));
      } else resolve({ data: new Uint8Array(), status: 404 });
    });
  }
}

export { AppRunner, Runner };
export type { RespondWith };
