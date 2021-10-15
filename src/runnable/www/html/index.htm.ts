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
      `(<select name="level">[a-zA-Z0-9 \n\r\t<>="\/]+)<option value="${level}">`,
      "gm",
    ),
    `$1<option value="${level}" selected>`,
  );
  data = data.replace(
    new RegExp(
      `(<select name="group">[a-zA-Z0-9 \n\r\t<>="\/]+)<option value="${group}">`,
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

  data = data.replace(
    /<div class="date-grid"><\/div>/,
    `<div class="date-grid">${htmlFormatedPlanningDate.join("")}</div>`,
  );

  const planningData = await app.planningDB.db.collection(level).find({
    date: { $gte: startDate, $lt: endDate },
    group: group,
  }, {
    noCursorTimeout: false,
    projection: {
      _id: 0,
      date: 1,
      group: 1,
      cources: 1,
    },
  });
  const htmlFormatedPlanningData = await planningData.map((dayData: any) => {
    return dayData.cources.map((cource: any) => {
      const startHour: any = new Date(dayData.date);

      startHour.setUTCHours(8);

      const dayPosition = Math.floor(
        (dayData.date - startDate) / dayInMs,
      );
      const hourStartPosition = Math.floor(
        (cource.startDate - startHour) / fifteenMinutesInMs,
      );
      const hourEndPosition = Math.floor(
        (cource.endDate - startHour) / fifteenMinutesInMs,
      );
      let courceType = "";

      if (cource.title.match(/cour|cm/i)) courceType = "class";
      else if (cource.title.match(/exam|qcm/i)) courceType = "exam";
      else if (cource.title.match(/td|gr[ ]*[a-c]/i)) courceType = "directed";
      else if (cource.title.match(/tp|gr[ ]*[1-6]/i)) courceType = "practical";

      return `<div class="cource ${courceType}" style="grid-column: ${dayPosition +
        1}; grid-row: ${hourStartPosition +
        1} / ${hourEndPosition +
        1};" data-resources="${cource.resources}" data-comment="${cource.comment}" tabindex="1"><h2>${cource.title}</h2>
        <div class="time">${cource.startDate.getUTCHours()}:${cource.startDate.getUTCMinutes()} - ${cource.endDate.getUTCHours()}:${cource.endDate.getUTCMinutes()}</div></div>`;
    });
  });

  return data.replace(
    /<div class="hour-grid"><\/div>/,
    `<div class="hour-grid">${htmlFormatedPlanningData.flat().join("")}</div>`,
  );
}
