export default async function (
  app: any,
  request: Request,
  routerData: any,
  data: string,
  headers: any,
) {
  const match: any = data.matchAll(
    new RegExp(
      `<loc>https://licence-informatique-lemans.tk/</loc>[ \n\r\t]+<lastmod>([0-9T\\-:+]\{25\})</lastmod>`,
      "gm",
    ),
  ).next();
  const newDate = new Date(match.value[1]);
  const date = new Date();

  newDate.setUTCHours(date.getUTCHours());
  newDate.setUTCDate(date.getUTCDate());
  newDate.setUTCMonth(date.getUTCMonth());
  newDate.setUTCFullYear(date.getUTCFullYear());

  return data.replace(
    new RegExp(
      `(<loc>https://licence-informatique-lemans.tk/</loc>[ \n\r\t]+<lastmod>)[0-9T\\-:+]\{25\}(</lastmod>)`,
      "gm",
    ),
    `$1${newDate.toISOString().slice(0, -5)}+00:00$2`,
  );
}
