const search_params = new URLSearchParams(location.search);
let level = search_params.get("level");
let group = search_params.get("group");

const study_level_list_element = document.getElementById("study-level");
const place_list_element = document.getElementById("place");
const room_list_element = document.getElementById("room");
const menu_button_element = document.getElementById("menu-button");
const menu_element = document.getElementById("menu");

const update_free_room_list = async () => {
  try {
    const response = await fetch(
      `https://api.licence-informatique-lemans.tk/v2/find-free-room.json`,
    );
    const free_room_list = await response.json();

    if (!free_room_list?.error) {
      const date_to_time_intl = new Intl.DateTimeFormat("default", {
        timeStyle: "short",
        timeZone: "UTC",
      });

      for (const place in free_room_list) {
        const summary_element = document.createElement("summary");
        const details_element = document.createElement("details");
        const list_element = document.createElement("ul");

        summary_element.textContent = planning_resources_name[place].name;

        for (const free_room of free_room_list[place]) {
          const room_name_element = document.createElement("div");

          room_name_element.textContent =
            planning_resources_name[place].name_list[free_room.room];
          list_element.append(room_name_element);

          if (free_room.time_left) {
            const time_left_element = document.createElement("div");

            time_left_element.textContent = `temps restant : ${
              date_to_time_intl.format(new Date(free_room.time_left))
            }`;
            time_left_element.classList.add("time-left");
            list_element.append(time_left_element);
          }
        }

        details_element.append(
          summary_element,
          list_element,
        );
        room_list_element.append(details_element);
      }
    } else {
      console.error(`Failed to update free room list :`, free_room_list.error);
    }
  } catch {
    console.error(`Failed to update free room list`);
  }
};

menu_button_element.addEventListener(
  "mousedown",
  (event) => event.preventDefault(),
);
menu_button_element.addEventListener(
  "touchdown",
  (event) => event.preventDefault(),
);
menu_button_element.addEventListener("pointerup", (event) => {
  event.preventDefault();

  menu_element.showModal();

  update_free_room_list();
});
menu_element.addEventListener("pointerup", (event) => {
  const bounding_rect = menu_element.getBoundingClientRect();

  if (
    event.clientX < bounding_rect.left || event.clientX > bounding_rect.right ||
    event.clientY < bounding_rect.top || event.clientY > bounding_rect.bottom
  ) {
    menu_element.close();

    room_list_element.innerHTML = "";
  }
});

const planning_element = document.getElementsByTagName("planning-viewer")[0];
const title_element = [
  ...document.getElementsByTagName("h1"),
  ...document.getElementsByTagName("h2"),
];

const in_favorites = () => {
  const favorites = JSON.parse(localStorage.getItem("favorites"));

  return favorites.some((favorite) =>
    favorite.level == level && favorite.group == group
  );
};

const load_planning = debounce((planning_data) => {
  if (
    planning_resources_name[planning_data?.level]
      ?.name_list[planning_data?.group]
  ) {
    planning_element.load(planning_data);
    title_element[0].textContent =
      planning_resources_name[planning_data?.level].name;
    title_element[1].textContent = planning_resources_name[planning_data?.level]
      ?.name_list[planning_data?.group];

    document.title = `${planning_resources_name[planning_data?.level].name} ${
      planning_resources_name[planning_data?.level]
        ?.name_list[planning_data?.group]
    }`;
  } else planning_element.reset();
}, 150);

const add_empty_days = (planning_data) => {
  const end_date = new Date(planning_data.end_date);
  let date = new Date(planning_data.start_date);

  while (compare_date(date, end_date)) {
    if (
      planning_data.days.findIndex((day) => !compare_date(day.date, date)) < 0
    ) {
      planning_data.days.push({
        date: date.toISOString(),
        lessons: [],
      });
    }

    date = add_days(date, 1);
  }

  return planning_data;
};

const merge_new_planning = (current_planning_data, new_planning_data) => {
  // update start and end date of the planning
  if (
    compare_date(
      new_planning_data.start_date,
      current_planning_data.start_date,
    ) > 0
  ) {
    current_planning_data.start_date = new_planning_data.start_date;
  }
  if (
    compare_date(new_planning_data.end_date, current_planning_data.end_date) < 0
  ) {
    current_planning_data.end_date = new_planning_data.end_date;
  }

  for (const new_day of new_planning_data.days) {
    const old_data_index = current_planning_data.days.findIndex((day) =>
      !compare_date(day.date, new_day.date)
    );

    // update old day data
    if (old_data_index > -1) {
      current_planning_data.days[old_data_index] = new_day;
    } else current_planning_data.days.push(new_day);
  }

  current_planning_data.days.sort((day_a, day_b) =>
    -compare_date(day_a.date, day_b.date)
  );
};

const fecth_planning = async (level, group, start_date, end_date) => {
  try {
    const response = await fetch(
      `https://api.licence-informatique-lemans.tk/v2/planning.json?level=${level}&group=${group}&start=${start_date.toISOString()}&end=${end_date.toISOString()}`,
    );

    return add_empty_days(await response.json());
  } catch {
    console.error(`Failed to update level : ${level}, group : ${group}`);

    return null;
  }
};

const update_favorites_planning = async (initial = false) => {
  const favorites = JSON.parse(localStorage.getItem("favorites"));
  const favorites_planning_data = await Promise.all(
    initial
      ? [fecth_planning(
        level,
        group,
        keep_only_date(add_days(new Date(), -7)),
        keep_only_date(Date.now() + new Date(0).setMonth(4)),
      )]
      : favorites.map((favorite) =>
        fecth_planning(
          favorite.level,
          favorite.group,
          keep_only_date(add_days(new Date(), -7)),
          keep_only_date(Date.now() + new Date(0).setMonth(4)),
        )
      ),
  );

  for (const new_planning_data of favorites_planning_data) {
    if (new_planning_data) {
      const planning_id =
        `${new_planning_data.level}:${new_planning_data.group}`;
      const planning_data = JSON.parse(localStorage.getItem(planning_id)) ||
        { days: [], ...new_planning_data };

      merge_new_planning(planning_data, new_planning_data);

      localStorage.setItem(
        planning_id,
        JSON.stringify(planning_data),
      );
    }
  }
};

const update_planning = async (initial = false) => {
  if (!(typeof level === "string" && typeof group === "string")) {
    update_favorites_planning();

    return;
  }

  let planning_data;

  if (in_favorites()) {
    await update_favorites_planning(initial);

    planning_data = JSON.parse(localStorage.getItem(`${level}:${group}`));
  } else {
    planning_data = await fecth_planning(
      level,
      group,
      initial
        ? keep_only_date(add_days(new Date(), -7))
        : planning_element.start_date,
      initial
        ? keep_only_date(add_days(new Date(), 7))
        : planning_element.end_date,
    );

    if (!initial) {
      const old_planning_data = { ...planning_element.data };

      merge_new_planning(old_planning_data, planning_data);

      planning_data = old_planning_data;
    }
  }

  load_planning(planning_data);

  if (initial) update_favorites_planning();
};

const fetch_favorite_planning = async (level, group) => {
  localStorage.setItem(
    `${level}:${group}`,
    JSON.stringify(
      await fecth_planning(
        level,
        group,
        keep_only_date(add_days(new Date(), -7)),
        keep_only_date(Date.now() + new Date(0).setMonth(4)),
      ),
    ),
  );
};

const switch_planning = (level_, group_) => {
  if (!navigator.onLine) {
    title_element[0].textContent = "Pas d'internet";
    title_element[1].textContent = "rip... faut attendre";
  }

  level = level_;
  group = group_;

  update_planning(true);
};

window.addEventListener("load", async () => {
  await planning_resources_loaded;

  const generate_planning_buttons = (key) => {
    const summary_element = document.createElement("summary");
    const details_element = document.createElement("details");
    const list_element = document.createElement("ul");

    summary_element.textContent = planning_resources_name[key].name;

    for (const index in planning_resources_name[key].name_list) {
      const planning_button_element = document.createElement("planning-button");

      planning_button_element.init(
        key,
        index,
        switch_planning,
        fetch_favorite_planning,
      );
      list_element.append(planning_button_element);
    }

    details_element.append(
      summary_element,
      list_element,
    );

    return details_element;
  };

  // generate study level html
  for (const study_level of planning_resources_type["study-level"]) {
    study_level_list_element.append(
      generate_planning_buttons(study_level),
    );
  }

  // generate place html
  for (const place of (planning_resources_type["place"])) {
    place_list_element.append(
      generate_planning_buttons(place),
    );
  }

  // listen for planning fetch request
  planning_element.addEventListener("planningfetch", async (event) => {
    const planning_data = { ...planning_element.data };
    let new_planning_data;

    if (event.request > 0) {
      new_planning_data = await fecth_planning(
        level,
        group,
        planning_element.end_date,
        keep_only_date(add_days(planning_element.end_date, 7)),
      );

      merge_new_planning(planning_data, new_planning_data);
    } else {
      new_planning_data = await fecth_planning(
        level,
        group,
        keep_only_date(add_days(planning_element.start_date, -7)),
        planning_element.start_date,
      );

      merge_new_planning(planning_data, new_planning_data);
    }

    if (in_favorites()) {
      localStorage.setItem(`${level}:${group}`, JSON.stringify(planning_data));
    }

    load_planning(planning_data);
  });

  // load the targeted planning
  if (typeof level === "string" && typeof group === "string") {
    switch_planning(level, group);
  } else update_planning();

  setInterval(update_planning, 1000 * 60 * 60);

  window.addEventListener(
    "popstate",
    (event) => {
      if (event.state) switch_planning(event.state.level, event.state.group);
    },
  );

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/sw.js",
      );

      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Service worker registration failed with ${error}`);
    }
  }
});
