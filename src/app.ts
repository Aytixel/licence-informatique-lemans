import { NHttp } from "https://deno.land/x/nhttp@1.1.0/mod.ts";

const app = new NHttp();

app.get("/", ({ response }) => {
  return response.send("Hello");
});

app.listen(3000, () => {
  console.log("> Running on port 3000");
});