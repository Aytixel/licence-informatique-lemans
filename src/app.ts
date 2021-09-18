const env = Deno.env;
const server = Deno.listen({
  port: Number(env.get("PORT")) || 80,
  hostname: env.get("HOSTNAME") || "localhost",
});
const body = new TextEncoder().encode("Hello World");

async function handle(conn: Deno.Conn) {
  for await (const { respondWith } of Deno.serveHttp(conn)) {
    respondWith(new Response(body));
  }
}

for await (const conn of server) handle(conn);
