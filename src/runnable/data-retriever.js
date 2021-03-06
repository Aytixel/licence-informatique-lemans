import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.29.2/mod.ts";
import { parse } from "https://deno.land/x/xml@2.0.4/mod.ts";
import { getJson } from "../utils.ts";

class DataRetriever {
  constructor(env) {
    this.env = env;
    this.planningDB = null;
    this.studentUsername = env.STUDENT_USERNAME;
    this.studentPassword = env.STUDENT_PASSWORD;

    this.init();
  }

  async connectDB(db) {
    const dbConnection = {
      client: new MongoClient(),
    };

    await dbConnection.client.connect({
      db: db,
      tls: true,
      servers: this.env.MONGO_DB_HOSTS.split(",").map((host) => ({
        host: host,
        port: this.env.MONGO_DB_PORT,
      })),
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
    this.resourcesId = await getJson(
      this.env.RUNNABLE_PATH + "/planning-resources-id.json",
    );

    await this.scrapePlanningData();
  }

  async scrapePlanningData() {
    const getData = async (browser, page) => {
      const waitToClick = async (selector) => {
        try {
          await page.waitForSelector(selector, { visible: true });
          await page.waitForTimeout(1000);
          await page.click(selector);

          console.log(`click on ${selector}`);
        } catch (error) {}
      };

      try {
        console.log("start gathering planning data");

        await page.waitForTimeout(10000);
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
          const clientId = new URL(page2.url()).searchParams.get(
            "cliendId",
          );

          page2.close();
          console.log("start retrieving planning data with the browser");

          const planningData = await page.evaluate(
            async (clientId, resourcesId) => {
              const promises = [];

              for (const key in resourcesId) {
                resourcesId[key].forEach((resourceId, index) => {
                  promises.push(
                    fetch(
                      "http://planning.univ-lemans.fr/direct/gwtdirectplanning/rss?projectId=1&resources=" +
                        resourceId + "&cliendId=" + clientId +
                        "&nbDays=120&since=0",
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
            },
            clientId,
            this.resourcesId,
          );

          console.log("end retrieving planning data with the browser\n");

          for (const key in planningData) {
            try {
              console.log(`start uploading planning data for : ${key}`);

              planningData[key].forEach((data, index) => {
                const newCoursesData = {};
                const addZero = (number) => {
                  if (number < 10) return "0" + number;

                  return number.toString();
                };

                for (let i = 0; i < 121; i++) {
                  const date = new Date(
                    Date.now() + 1000 * 3600 * 24 * i,
                  );

                  newCoursesData[
                    `${date.getUTCFullYear()}/${
                      addZero(
                        date.getUTCMonth() +
                          1,
                      )
                    }/${addZero(date.getUTCDate())}`
                  ] = [];
                }

                // parse and pre-format data
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

                    newCoursesData[dateString].push({
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

                // final data formatting
                for (const dateKeyString in newCoursesData) {
                  const dateKey = new Date(
                    `${dateKeyString} GMT+00:00`,
                  );

                  this.planningDB.db.collection(key).updateOne(
                    { date: dateKey, group: index },
                    {
                      $set: {
                        date: dateKey,
                        group: index,
                        courses: newCoursesData[dateKeyString],
                      },
                    },
                    { upsert: true },
                  );
                }
              });

              console.log(`end uploading planning data for : ${key}\n`);
            } catch (error) {
              console.error(
                `counldn't upload planning data for : ${key}\n${error}\n`,
              );
            }
          }
        }
      } catch (error) {
        console.error(error);
      }

      console.log("end gathering planning data\n");
    };
    const update = async () => {
      const browser = await puppeteer.launch({
        headless: true,
        "args": ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      const page = (await browser.pages())[0];

      await page.goto("http://planning.univ-lemans.fr/direct/myplanning.jsp");

      if (new URL(page.url()).pathname == "/cas/login") {
        await page.type("#username", this.studentUsername);
        await page.type("#password", this.studentPassword);
        await page.click("#fm1 > div:nth-child(3) > div > div > button");

        page.on("load", () => {
          getData(browser, page).catch(console.error).finally(() =>
            browser.close()
          );
        });
      } else {
        getData(browser, page).catch(console.error).finally(() =>
          browser.close()
        );
      }
    };

    update();

    setInterval(update, 1000 * 60 * 60 * 2);
  }
}

new DataRetriever(config({ safe: true }));
