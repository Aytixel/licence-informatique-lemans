import { RouterData } from "../../../router.ts";
import { RunnerResponse } from "../../../runner.ts";
import App from "../../app.ts";
import planningResourcesPlaceList from "../../planning-ressources-place-list.json" assert {
  type: "json",
};

const keepOnlyDate = (date: Date) =>
  new Date(date.getTime() - (date.getTime() % (1000 * 60 * 60 * 24)));
const compareDate = (date1: Date, date2: Date) =>
  date2.getTime() - date1.getTime();
const getAggregatePipeline = (date: Date) => [
  {
    "$match": {
      "date": keepOnlyDate(date),
    },
  },
  {
    "$set": {
      "empty": {
        "$not": {
          "$size": "$lessons",
        },
      },
    },
  },
  {
    "$unwind": {
      "path": "$lessons",
      "preserveNullAndEmptyArrays": true,
    },
  },
  {
    "$set": {
      "now": {
        "$and": [
          {
            "$lt": [
              "$lessons.start_date",
              date,
            ],
          },
          {
            "$gt": [
              "$lessons.end_date",
              date,
            ],
          },
        ],
      },
    },
  },
  {
    "$group": {
      "_id": "$_id",
      "group": {
        "$min": "$group",
      },
      "lessons_start_date": {
        "$push": "$lessons.start_date",
      },
      "empty": {
        "$min": "$empty",
      },
      "now": {
        "$max": "$now",
      },
    },
  },
  {
    "$sort": {
      "group": 1,
    },
  },
];

export default async function (
  app: App,
  _request: Request,
  _routerData: RouterData,
  _headers: Record<string, string>,
  runnerResponse: RunnerResponse,
) {
  const planningDatabase = await app.planningConnection?.v2;

  if (planningDatabase) {
    const freeRoomList: Record<string, number | string>[] = [];
    const date = new Date();

    for (const place of planningResourcesPlaceList) {
      const roomUsageList: any = await planningDatabase.collection(place)
        .aggregate(getAggregatePipeline(date)).toArray();

      for (const roomUsage of roomUsageList) {
        if (roomUsage.empty) {
          freeRoomList.push({ place, group: roomUsage.group });
        } else if (!roomUsage.now) {
          const nextLessonStartDate = roomUsage.lessons_start_date.find((
            start_date: Date,
          ) => compareDate(start_date, date) < 0);

          if (nextLessonStartDate) {
            freeRoomList.push({
              place,
              group: roomUsage.group,
              time: nextLessonStartDate.getTime() - date.getTime(),
            });
          } else freeRoomList.push({ place, group: roomUsage.group });
        }
      }
    }

    runnerResponse.respondWith(JSON.stringify(freeRoomList));
  } else {
    runnerResponse.respondWith(
      JSON.stringify({ errors: ["db_not_connected"] }),
    );
  }
}
