import { inject } from "../../../utils.ts";

export default async function (
  app: any,
  request: Request,
  routerData: any,
  data: string,
  headers: any,
) {
  const startDate: any = new Date();
  const dayInMs = 1000 * 3600 * 24;
  const fifteenMinutesInMs = 1000 * 60 * 15;

  startDate.setUTCMilliseconds(0);
  startDate.setUTCSeconds(0);
  startDate.setUTCMinutes(0);
  startDate.setUTCHours(0);

  const endDate = new Date(startDate.getTime() + dayInMs * 7);
  let level = routerData.searchParams.get("level") || "l1";
  let group = parseInt(routerData.searchParams.get("group"), 10) || 0;

  if (level.match(/l[1-3]/) == null) level = "l1";
  if (group >= app.resourcesId[level].length) {
    group = app.resourcesId[level].length - 1;
  }

  data = data.replace(
    new RegExp(
      `(<select[a-zA-Z0-9 \n\r\t="\/]+name="level"[a-zA-Z0-9 \n\r\t<>="\/]+)<option value="${level}">`,
      "gm",
    ),
    `$1<option value="${level}" selected>`,
  );
  data = data.replace(
    new RegExp(
      `(<select[a-zA-Z0-9 \n\r\t="\/]+name="group"[a-zA-Z0-9 \n\r\t<>="\/]+)<option value="${group}">`,
      "gm",
    ),
    `$1<option value="${group}" selected>`,
  );

  const htmlFormatedPlanningDate = [];

  for (let i = 0; i < 7; i++) {
    let dateString = new Date(startDate.getTime() + dayInMs * i)
      .toLocaleDateString(
        "fr-FR",
        {
          weekday: "long",
          year: "numeric",
          month: "numeric",
          day: "numeric",
        },
      );

    htmlFormatedPlanningDate.push(
      `<div class="date">${
        dateString.replace(/./, dateString[0].toUpperCase())
      }</div>`,
    );
  }

  data = inject(
    data,
    "date-grid",
    htmlFormatedPlanningDate.join(""),
  );

  const planningDataCursor = app.planningDB.db.collection(level).find({
    date: { $gte: startDate, $lt: endDate },
    group: group,
  }, {
    projection: {
      _id: 0,
      date: 1,
      group: 1,
      courses: 1,
    },
    batchSize: 7,
  });
  const htmlFormatedPlanningData: any = [];

  for (let i = 0; i < 7; i++) {
    const dayData = await planningDataCursor.next();

    htmlFormatedPlanningData.push(dayData.courses.map((course: any) => {
      const startHour: any = new Date(dayData.date);

      startHour.setUTCHours(8);

      const dayPosition = Math.floor(
        (dayData.date - startDate) / dayInMs,
      );
      const hourStartPosition = Math.floor(
        (course.startDate - startHour) / fifteenMinutesInMs,
      );
      const hourEndPosition = Math.floor(
        (course.endDate - startHour) / fifteenMinutesInMs,
      );
      let courseType = "";

      if (course.title.match(/exam|qcm|contrôle|partiel|soutenance/i)) {
        courseType = "exam";
      } else if (course.title.match(/cour|cm|conférence/i)) {
        courseType = "class";
      } else if (course.title.match(/td|gr[ ]*[a-c]/i)) courseType = "directed";
      else if (course.title.match(/tp|gr[ ]*[1-6]/i)) courseType = "practical";

      return `<div class="course ${courseType}" style="grid-column: ${
        dayPosition +
        1
      }; grid-row: ${
        hourStartPosition +
        1
      } / ${
        hourEndPosition +
        1
      };" data-resources="${course.resources}" data-comment="${course.comment}" tabindex="1"><h2>${course.title}</h2>
        <div class="time">${course.startDate.getUTCHours()}:${course.startDate.getUTCMinutes()} - ${course.endDate.getUTCHours()}:${course.endDate.getUTCMinutes()}</div></div>`;
    }));
  }

  return inject(
    data,
    "hour-grid",
    htmlFormatedPlanningData.flat().join(""),
  );
}
