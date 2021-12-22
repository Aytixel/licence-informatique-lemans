export default async function (
  app: any,
  request: Request,
  routerData: any,
  data: string,
  headers: any,
) {
  let parsedData = JSON.parse(data);

  parsedData.level = routerData.searchParams.get("level") || "l1";
  parsedData.group = parseInt(routerData.searchParams.get("group"), 10) || 0;
  parsedData.startDate = new Date(routerData.searchParams.get("start") + "UTC");
  parsedData.endDate = new Date(routerData.searchParams.get("end") + "UTC");

  if (parsedData.level.match(/l[1-3]/) == null) parsedData.level = "l1";
  if (parsedData.group >= app.resourcesId[parsedData.level].length) {
    parsedData.group = app.resourcesId[parsedData.level].length - 1;
  }
  if (isNaN(parsedData.startDate.getTime())) parsedData.startDate = new Date();
  if (isNaN(parsedData.endDate.getTime())) parsedData.endDate = new Date();

  parsedData.startDate.setUTCMilliseconds(0);
  parsedData.startDate.setUTCSeconds(0);
  parsedData.startDate.setUTCMinutes(0);
  parsedData.startDate.setUTCHours(0);
  parsedData.endDate.setUTCMilliseconds(0);
  parsedData.endDate.setUTCSeconds(0);
  parsedData.endDate.setUTCMinutes(0);
  parsedData.endDate.setUTCHours(0);

  const planningDataCursor = app.planningDB.db.collection(parsedData.level)
    .find({
      date: { $gte: parsedData.startDate, $lt: parsedData.endDate },
      group: parsedData.group,
    }, {
      noCursorTimeout: false,
      projection: {
        _id: 0,
        date: 1,
        group: 1,
        courses: 1,
      },
      batchSize: 7,
    });

  for (
    let i = (parsedData.endDate.getTime() - parsedData.startDate.getTime()) /
      86400000;
    i > 0;
    i--
  ) {
    const dayData = await planningDataCursor.next();

    if (dayData) {
      for (const course of dayData.courses) parsedData.courses.push(course);
    }
  }

  return JSON.stringify(parsedData, null, 2);
}
