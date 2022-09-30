import { DotenvConfig, join, resolve } from "./deps.ts";
import { existsSync } from "./utils.ts";
import { RouterData } from "./router.ts";
import { WebSocketConnectionInfo } from "./websocket.ts";
import { ResponseData } from "./app.ts";

class AppRunner {
  public env: DotenvConfig;
  public connections: WebSocketConnectionInfo[];

  constructor(env: DotenvConfig) {
    this.env = env;
    this.connections = [];
  }

  async init() {}
}

interface RunnerResponseData {
  data?: Uint8Array;
  status: number;
}

class RunnerResponse {
  private hasResolved = false;
  private headers: Record<string, string>;
  private resolve?: (value: RunnerResponseData) => void;
  promise: Promise<RunnerResponseData> = new Promise((resolve) =>
    this.resolve = resolve
  );

  constructor(headers: Record<string, string>) {
    this.headers = headers;
  }

  respondWith(data?: Uint8Array | string) {
    if (this.resolve !== undefined && !this.hasResolved) {
      this.hasResolved = true;

      this.resolve({
        data: typeof data === "string" ? new TextEncoder().encode(data) : data,
        status: 200,
      } as unknown as RunnerResponseData);
    }
  }

  redirectTo(url: URL | string, status?: number) {
    if (this.resolve !== undefined && !this.hasResolved) {
      this.hasResolved = true;
      this.headers.location = url.toString();

      delete this.headers["content-type"];

      this.resolve({
        data: new Uint8Array(),
        status: status || 302,
      } as unknown as RunnerResponseData);
    }
  }
}

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

  async runWithData(
    request: Request,
    routerData: RouterData,
    headers: Record<string, string>,
    responseData: ResponseData,
  ): Promise<ResponseData> {
    const runnablePath = this.getRunnablePath(routerData.domainFilePath);

    if (runnablePath) {
      const runnerResponse: RunnerResponse = new RunnerResponse(headers);

      await (await import(runnablePath)).default(
        this.app,
        request,
        routerData,
        headers,
        runnerResponse,
        responseData,
      );

      const runnerResponseData = await runnerResponse.promise;

      return {
        data: runnerResponseData.data || responseData.data,
        status: runnerResponseData.status,
      };
    }

    return responseData;
  }

  async runWithTextData(
    request: Request,
    routerData: RouterData,
    headers: Record<string, string>,
    data: string,
  ): Promise<ResponseData> {
    const runnablePath = this.getRunnablePath(routerData.domainFilePath);

    if (runnablePath) {
      const runnerResponse: RunnerResponse = new RunnerResponse(headers);

      await (await import(runnablePath)).default(
        this.app,
        request,
        routerData,
        headers,
        runnerResponse,
        data,
      );

      const runnerResponseData = await runnerResponse.promise;

      return {
        data: runnerResponseData.data || new TextEncoder().encode(data),
        status: runnerResponseData.status,
      };
    }

    return {
      data: new TextEncoder().encode(data),
      status: 200,
    };
  }

  async runWithNothing(
    request: Request,
    routerData: RouterData,
    headers: Record<string, string>,
  ): Promise<ResponseData> {
    const runnablePath = this.getRunnablePath(routerData.domainFilePath);

    if (runnablePath) {
      const runnerResponse: RunnerResponse = new RunnerResponse(headers);

      await (await import(runnablePath)).default(
        this.app,
        request,
        routerData,
        headers,
        runnerResponse,
      );

      const runnerResponseData = await runnerResponse.promise;

      return {
        data: runnerResponseData.data || new Uint8Array(),
        status: runnerResponseData.status,
      };
    }

    return {
      data: new Uint8Array(),
      status: 404,
    };
  }
}

export { AppRunner, Runner, RunnerResponse };
