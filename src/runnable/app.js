import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.27.0/mod.ts";
import { parse } from "https://deno.land/x/xml@v1.0.3/mod.ts";

export default class {
  constructor(env) {
    this.env = env;
    this.planningDB = null;
    this.studentUsername = env.STUDENT_USERNAME;
    this.studentPassword = env.STUDENT_PASSWORD;
  }

  async connectDB(db) {
    const dbConnection = {
      client: new MongoClient(),
    };

    await dbConnection.client.connect({
      db: db,
      tls: true,
      servers: [
        {
          host: this.env.MONGO_DB_HOST,
          port: this.env.MONGO_DB_PORT,
        },
      ],
      credential: {
        username: this.env.MONGO_DB_USERNAME,
        password: this.env.MONGO_DB_PASSWORD,
        db: db,
        mechanism: "SCRAM-SHA-1",
      },
    });

    dbConnection.db = dbConnection.client.database(db);

    return dbConnection;
  }

  async init() {
    this.planningDB = await this.connectDB("planning");

    await this.scrapePlanningData();
  }

  async scrapePlanningData() {
    const browser = await puppeteer.launch({ headless: false });
    const page = (await browser.pages())[0];
    const waitToClick = async (selector) => {
      await page.waitForSelector(selector);
      await page.click(selector);
    };
    const update = async () => {
      await page.goto("http://planning.univ-lemans.fr/direct/myplanning.jsp");

      if (new URL(page.url()).pathname == "/cas/login") {
        await page.type("#username", this.studentUsername);
        await page.type("#password", this.studentPassword);
        await page.click("#fm1 > div:nth-child(3) > div > div > button");
        await page.waitForNavigation();
      }

      setTimeout(async () => {
        try {
          await waitToClick(
            "#x-auto-35 > tbody > tr:nth-child(2) > td.x-btn-mc > em > button",
          );
          await waitToClick(
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
                        resourceId + "&cliendId=" + clientId +
                        "&nbDays=15&since=0",
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
              planningData[key].forEach((data, index) => {
                const newCourcesData = {};

                parse(data).rss.channel.item.forEach(
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
                    const startOfComment = parsedCourseData.lastIndexOf(
                      "Comment",
                    );

                    if (newCourcesData[dateString] === undefined) {
                      newCourcesData[dateString] = [];
                    }

                    newCourcesData[dateString].push({
                      title: courseData.title.replace(/ +/g, " "),
                      startDate: new Date(
                        `${dateString} ${parsedDate[1]} GMT+00:00`,
                      ),
                      endDate: new Date(
                        `${dateString} ${parsedDate[2]} GMT+00:00`,
                      ),
                      resources: parsedCourseData.slice(
                        2,
                        startOfComment,
                      ),
                      comment: parsedCourseData.slice(
                        startOfComment + 1,
                      ),
                    });
                  },
                );

                for (const dateKey in newCourcesData) {
                  this.planningDB.db.collection(key).updateOne(
                    { date: dateKey, group: index },
                    {
                      $set: {
                        date: dateKey,
                        group: index,
                        cources: newCourcesData[dateKey],
                      },
                    },
                    { upsert: true },
                  );
                }
              });
            }
          }
        } catch (error) {
          console.error(error);
        }
      }, 20000);
    };

    setInterval(update, 1000 * 60 * 60 * 2);
  }
}
