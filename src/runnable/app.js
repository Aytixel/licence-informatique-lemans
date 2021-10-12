import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import { parse } from "https://deno.land/x/xml/mod.ts";

export default class {
  constructor(env) {
    this.studentUsername = env.STUDENT_USERNAME;
    this.studentPassword = env.STUDENT_PASSWORD;

    this.run();
  }

  async run() {
    const browser = await puppeteer.launch({ headless: false });
    const page = (await browser.pages())[0];

    await page.goto("http://planning.univ-lemans.fr/direct/myplanning.jsp");

    if (new URL(page.url()).pathname == "/cas/login") {
      await page.type("#username", this.studentUsername);
      await page.type("#password", this.studentPassword);
      await page.click("#fm1 > div:nth-child(3) > div > div > button");
      await page.waitForNavigation();
    }

    setTimeout(async () => {
      await page.waitForSelector(
        "#x-auto-35 > tbody > tr:nth-child(2) > td.x-btn-mc > em > button",
      );
      await page.click(
        "#x-auto-35 > tbody > tr:nth-child(2) > td.x-btn-mc > em > button",
      );
      await page.waitForSelector(
        "div[role='alertdialog'] tbody > tr:nth-child(2) > td.x-btn-mc > em > button",
      );
      await page.click(
        "div[role='alertdialog'] tbody > tr:nth-child(2) > td.x-btn-mc > em > button",
      );

      const page2 = await (await browser.waitForTarget(
        (target) =>
          target.url().startsWith(
            "http://planning.univ-lemans.fr/direct/gwtdirectplanning/rss",
          ),
      )).page();

      if (page2) {
        const clientId = new URL(page2.url()).searchParams.get("cliendId");

        page2.close();

        const planningData = await page.evaluate(async (clientId) => {
          const resourcesId = {
            "l1": [620, 629, 641, 644, 647, 771],
            "l2": [889, 1070, 1543, 237, 3072],
            "l3": [405, 406, 4525, 5121],
          };
          const promises = [];

          for (const key in resourcesId) {
            resourcesId[key].forEach((resourceId, index) => {
              promises.push(
                fetch(
                  "http://planning.univ-lemans.fr/direct/gwtdirectplanning/rss?projectId=1&resources=" +
                    resourceId + "&cliendId=" + clientId + "&nbDays=15&since=0",
                ).then((response) => response.text()).then((data) =>
                  new Promise((resolve) => {
                    resourcesId[key][index] = data;
                    resolve();
                  })
                ),
              );
            });
          }

          await Promise.all(promises);

          return resourcesId;
        }, clientId);

        for (const key in planningData) {
          planningData[key].forEach((data, index) =>
            planningData[key][index] = parse(data).rss.channel.item.map(
              (courseData) => {
                const parsedCourseData = courseData.description.replace(
                  /<.>/g,
                  "",
                )
                  .replace(
                    /<\/.>/g,
                    "<br/>",
                  ).replace(/<br \/>/g, "<br/>").split("<br/>").filter((
                    x,
                    index,
                    array,
                  ) => x && index != array.length - 1);
                const parsedDate = parsedCourseData[0].match(
                  /\d\d\/\d\d\/\d{4,6}|\d\d:\d\d/g,
                );
                const dateString = parsedDate[0]
                  .split(
                    "/",
                  ).reverse().join("/");
                const startOfComment = parsedCourseData.lastIndexOf("Comment");

                return {
                  title: courseData.title.replace(/ +/g, " "),
                  date: new Date(`${dateString}  00:00 GMT+00:00`),
                  startDate: new Date(
                    `${dateString}  ${parsedDate[1]} GMT+00:00`,
                  ),
                  endDate: new Date(
                    `${dateString}  ${parsedDate[2]} GMT+00:00`,
                  ),
                  resources: parsedCourseData.slice(
                    2,
                    startOfComment,
                  ),
                  comment: parsedCourseData.slice(
                    startOfComment + 1,
                  ),
                };
              },
            )
          );
        }

        console.log(planningData);
      }
    }, 5000);
  }
}
