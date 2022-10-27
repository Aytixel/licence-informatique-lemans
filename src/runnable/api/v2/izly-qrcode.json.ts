import { RouterData } from "../../../router.ts";
import { RunnerResponse } from "../../../runner.ts";
import App from "../../app.ts";
import {
  CookieJar,
  wrapFetch,
} from "https://deno.land/x/another_cookiejar@v4.1.4/mod.ts";

const decrypt = (code: string, email: string) => {
  const codeSplit = [...code];
  const i = Number(codeSplit.pop());
  const k = Number(codeSplit.pop());

  code = codeSplit.join("");

  return Array.from({ length: i }, () => 0).join("") +
    (parseInt(code.substring(k), Number(code.slice(0, k))) - email.length);
};

const getRequestVerificationToken = async (fetch: any) =>
  (await (await fetch("https://mon-espace.izly.fr/Home/Logon", {
    credentials: "include",
  })).text()).match(
    /"__RequestVerificationToken"[^\/]*value="([a-zA-Z0-9_\-]*)"/m,
  )?.pop();

const login = async (
  fetch: any,
  izly_data: { email: string; code: string },
) => {
  const form_data =
    `__RequestVerificationToken=${await getRequestVerificationToken(
      fetch,
    )}&Username=${encodeURIComponent(izly_data.email)}&Password=${
      encodeURIComponent(decrypt(izly_data.code, izly_data.email))
    }`;

  await fetch(
    "https://mon-espace.izly.fr/Home/Logon",
    {
      credentials: "include",
      method: "post",
      body: form_data,
      redirect: "manual",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    },
  );
};

const getSold = async (fetch: any) => {
  return parseFloat(
    (await (await fetch(
      "https://mon-espace.izly.fr/",
      {
        credentials: "include",
        method: "get",
        redirect: "manual",
      },
    )).text()).match(/balance-text order-2">[\n\r\t \+]*([0-9]*,[0-9]*)</m)
      ?.pop().replace(",", "."),
  );
};

const generateQrcode = async (fetch: any) =>
  await (await fetch("https://mon-espace.izly.fr/Home/CreateQrCodeImg", {
    credentials: "include",
    method: "post",
    body: "nbrOfQrCode=1",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
  })).json();

const logout = async (fetch: any) =>
  await fetch("https://mon-espace.izly.fr/Home/Logout", {
    credentials: "include",
  });

export default async function (
  _app: App,
  request: Request,
  _routerData: RouterData,
  _headers: Record<string, string>,
  runnerResponse: RunnerResponse,
) {
  const cookie_jar = new CookieJar();
  const fetch = wrapFetch({ cookieJar: cookie_jar });

  try {
    await login(fetch, await request.json());

    const qrcode_data = await generateQrcode(fetch);

    qrcode_data.push(await getSold(fetch));

    runnerResponse.respondWith(JSON.stringify(qrcode_data));

    await logout(fetch);
  } catch {
    // in case of it has logged-in but not out
    try {
      await logout(fetch);
    } catch {}

    runnerResponse.respondWith(JSON.stringify([]));
  }
}
