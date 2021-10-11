import { DotenvConfig } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

export default class {
  private studentUsername: string;
  private studentPassword: string;

  constructor(env: DotenvConfig) {
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
      console.log("gathering data");

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

      /*
      const page2 = (await browser.pages())[1];
      const clientId = new URL(page2.url()).searchParams.get("clientId");

      page2.close();

      await page.evaluate(`
        const resourcesId = {
          "l1": [620, 629, 641, 644, 647, 771],
          "l2": [889, 1070, 1543, 237, 3072],
          "l3": [405, 406, 4525, 5121]
        }

        for (const key in resourcesId) {
          for (const resourceId of resourcesId[key]) {
            fetch("http://planning.univ-lemans.fr/direct/gwtdirectplanning/rss?projectId=1&resources=" + resourceId + "&cliendId=${clientId}&nbDays=7&since=0")
            .then(response => response.text())
            .then(data => {
              console.log(new DOMParser().parseFromString(data, "application/xml"))
            })
          }
        }
      `);
      */
    }, 20000);
  }
}
