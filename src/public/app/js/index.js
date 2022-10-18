const search_params = new URLSearchParams(location.search);
let level = search_params.get("level");
let group = search_params.get("group");

const study_level_list_element = document.querySelector("#study-level");
const place_list_element = document.querySelector("#place");
const menu_button_element = document.querySelector("#menu-button");
const menu_element = document.querySelector("#menu");

menu_button_element.addEventListener(
  "mousedown",
  (event) => event.preventDefault(),
);
menu_button_element.addEventListener("click", (event) => {
  event.preventDefault();

  menu_element.showModal();
});
menu_element.addEventListener("click", (event) => {
  const bounding_rect = menu_element.getBoundingClientRect();

  if (
    event.clientX < bounding_rect.left || event.clientX > bounding_rect.right ||
    event.clientY < bounding_rect.top || event.clientY > bounding_rect.bottom
  ) {
    menu_element.close();
  }
});

const planning_element = document.querySelector("planning-viewer");
const title_element = document.querySelectorAll("h1, h2");

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
  if (!(typeof level === "string" && typeof group === "string")) return;

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

      planning_button_element.init(key, index, switch_planning);
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
