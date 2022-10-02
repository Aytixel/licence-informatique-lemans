import { RouterData } from "../../../router.ts";
import { RunnerResponse } from "../../../runner.ts";
import App from "../../app.ts";
import planningResourcesCount from "../../planning-resources-count.json" assert {
  type: "json",
};

const keepOnlyDate = (date: Date) =>
  new Date(date.getTime() - (date.getTime() % (1000 * 60 * 60 * 24)));

interface Course {
  title: string;
  start_date: Date;
  end_date: Date;
  description: string[];
  rooms: string[];
}

interface Day {
  date: Date;
  courses: Course[];
}

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
    start_date?: Date;
    end_date?: Date;
    days: Day[];
  } = { days: [] };
  const errors = [];

  parsedData.level = routerData.searchParams.get("level") || "";
  parsedData.group = parseInt(routerData.searchParams.get("group") || "", 10);
  parsedData.start_date = keepOnlyDate(
    new Date(routerData.searchParams.get("start") || ""),
  );
  parsedData.end_date = keepOnlyDate(
    new Date(routerData.searchParams.get("end") || ""),
  );

  if (parsedData.level.match(/^(l[123]|m[12]|room_ic2)$/) === null) {
    runnerResponse.respondWith(JSON.stringify({ errors: ["level"] }));

    return;
  }
  if (
    isNaN(parsedData.group) ||
    parsedData.group >= (planningResourcesCount as any)[parsedData.level]
  ) {
    errors.push("group");
  }
  if (isNaN(parsedData.start_date.getTime())) {
    if (routerData.searchParams.get("start")) errors.push("start_date");
    else parsedData.start_date = keepOnlyDate(new Date());
  }
  if (isNaN(parsedData.end_date.getTime())) {
    if (routerData.searchParams.get("end")) errors.push("end_date");
    else {
      parsedData.end_date = new Date(
        parsedData.start_date.getTime() + (1000 * 60 * 60 * 24),
      );
    }
  }

  // return errors if some
  if (errors.length) {
    runnerResponse.respondWith(JSON.stringify({ errors }));

    return;
  }

  const planningDataCursor = app.planningConnection?.v2.collection(
    parsedData.level,
  )
    .find({
      date: { $gte: parsedData.start_date, $lt: parsedData.end_date },
      group: parsedData.group,
    }, {
      projection: {
        _id: 0,
        date: 1,
        group: 1,
        courses: 1,
      },
      sort: {
        date: 1,
      },
    });

  if (planningDataCursor) {
    for await (const day of planningDataCursor) {
      delete day.group;

      parsedData.days.push(day as Day);
    }

    runnerResponse.respondWith(JSON.stringify(parsedData));
  } else {
    runnerResponse.respondWith(
      JSON.stringify({ errors: ["db_not_connected"] }),
    );
  }
}
