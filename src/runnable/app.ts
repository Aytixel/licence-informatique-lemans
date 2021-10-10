import { DotenvConfig } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

export default class {
  private studentUsername;
  private studentPassword;

  constructor(env: DotenvConfig) {
    this.studentUsername = env.STUDENT_USERNAME;
    this.studentPassword = env.STUDENT_PASSWORD;

    this.run();
  }

  async run() {
    /*
    const browser = await puppeteer.launch({ headless: false });
    const page = (await browser.pages())[0];

    await page.goto("http://planning.univ-lemans.fr/direct/myplanning.jsp");

    if (new URL(page.url()).pathname == "/cas/login") {
      await page.type("#username", this.studentUsername);
      await page.type("#password", this.studentPassword);
      await page.click("#fm1 > div:nth-child(3) > div > div > button");
    }

    await page.waitForNavigation();
    await page.waitForSelector("#Planning");
    await page.evaluate(`
      for (const element of document.querySelector("#Planning").childNodes) {
        console.log(element.querySelector(".eventText").ariaLabel.split("null").map(x => x.trim()))
      }
    `);

    //Math.floor(elementLeft / (planningWidth / 7) + 0.1)

    console.log("test");
    */

    //await browser.close();

    // fetch rss flux http://planning.univ-lemans.fr/direct/gwtdirectplanning/rss?projectId=1&resources=407&cliendId=1633881513488&nbDays=7&since=0
    /*
    const resourcesId = {
      "l1": [
        620,
        629,
        641,
        644,
        647,
        771,
      ],
      "l2": [
        889,
        1070,
        1543,
        237,
        3072,
      ],
      "l3": [
        405,
        406,
        4525,
        5121,
      ],
    };
    */
  }
}
