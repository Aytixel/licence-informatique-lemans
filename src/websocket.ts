import { DotenvConfig, join, resolve } from "./deps.ts";
import { AppRunner, Runner } from "./runner.ts";
import { existsSync } from "./utils.ts";

type WebSocketConnectionInfo = {
  socket: WebSocket;
  id: number;
  data: unknown;
};

class WebSocketServer {
  private runner: Runner;
  private message_callback?: (
    message: MessageEvent,
    connection: WebSocketConnectionInfo,
    app?: AppRunner,
  ) => void;
  private id = 0;

  constructor(env: DotenvConfig, runner: Runner) {
    this.runner = runner;

    for (const extension of ["ts", "tsx", "js", "jsx"]) {
      const runnablePath = resolve(
        join(env.RUNNABLE_PATH, "./ws." + extension),
      );

      if (existsSync(runnablePath)) {
        import("file://" + runnablePath).then((imports) =>
          this.message_callback = imports.default
        );
      }
    }
  }

  upgrade(
    request: Request,
    respondWith: (r: Response | Promise<Response>) => Promise<void>,
  ): boolean {
    if (
      this.message_callback && request.headers.get("upgrade") != "websocket" ||
      this.message_callback === undefined
    ) return false;

    const { socket, response } = Deno.upgradeWebSocket(request);
    const id = this.id++;
    const connection = {
      socket,
      id,
      connections: this.runner.app.connections,
      data: undefined,
    };

    this.runner.app.connections.push(connection);

    socket.addEventListener(
      "message",
      (message) =>
        this.message_callback &&
        this.message_callback(message, connection, this.runner.app),
    );
    socket.addEventListener("error", console.error);
    socket.addEventListener(
      "close",
      () =>
        this.runner.app.connections.splice(
          this.runner.app.connections.findIndex((connection) =>
            connection.id == id
          ),
          1,
        ),
    );

    respondWith(response);

    return true;
  }
}

export { WebSocketServer };
export type { WebSocketConnectionInfo };
