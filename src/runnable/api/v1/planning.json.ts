import { RouterData } from "../../../router.ts";
import { RunnerResponse } from "../../../runner.ts";
import App from "../../app.ts";
import planningResourcesId from "../../planning-resources-id.json" assert {
  type: "json",
};

export default async function (
  app: App,
  _request: Request,
  routerData: RouterData,
  _headers: Record<string, string>,
  runnerResponse: RunnerResponse,
) {
  const parsedData: {
    level?: string;
    group?: number;
    startDate?: Date;
    endDate?: Date;
    courses: number[];
  } = { courses: [] };

  parsedData.level = routerData.searchParams.get("level") || "l1";
  parsedData.group = parseInt(routerData.searchParams.get("group") || "", 10) ||
    0;
  parsedData.startDate = new Date(routerData.searchParams.get("start") + "UTC");
  parsedData.endDate = new Date(routerData.searchParams.get("end") + "UTC");

  if (parsedData.level.match(/l[1-3]/) == null) parsedData.level = "l1";
  if (
    parsedData.group >= (planningResourcesId as any)[parsedData.level].length
  ) {
    parsedData.group = (planningResourcesId as any)[parsedData.level].length -
      1;
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

  const planningDataCursor = app.planningConnection?.v1.collection(
    parsedData.level,
  )
    .find({
      date: { $gte: parsedData.startDate, $lt: parsedData.endDate },
      group: parsedData.group,
    }, {
      projection: {
        _id: 0,
        date: 1,
        group: 1,
        courses: 1,
      },
    });

  for (
    let i = (parsedData.endDate.getTime() - parsedData.startDate.getTime()) /
      86400000;
    i > 0;
    i--
  ) {
    const dayData = await planningDataCursor?.next();

    if (dayData) {
      for (const course of dayData.courses) parsedData.courses?.push(course);
    }
  }

  runnerResponse.respondWith(JSON.stringify(parsedData));
}
