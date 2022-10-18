const study_level_list_element = document.querySelector("#study-level");
const place_list_element = document.querySelector("#place");
const menu_button_element = document.querySelector("#menu-button");
const menu_element = document.querySelector("#menu");

menu_button_element.addEventListener(
  "mousedown",
  (event) => event.preventDefault(),
);
menu_button_element.addEventListener("click", () => {
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
const load_planning = (level, group) => {
  const planning_data = JSON.parse(localStorage.getItem(`${level}:${group}`));

  if (
    planning_resources_name[planning_data?.level]
      ?.name_list[planning_data?.group]
  ) {
    planning_element.load(planning_data);
    title_element[0].textContent =
      planning_resources_name[planning_data?.level].name;
    title_element[1].textContent = planning_resources_name[planning_data?.level]
      ?.name_list[planning_data?.group];
  }
};
const update_stored_planning = (level, group, new_planning_data) => {
  const planning_id = `${level}:${group}`;
  let current_planning_data = JSON.parse(localStorage.getItem(planning_id)) ||
    new_planning_data;

  for (const new_day of new_planning_data.days) {
    const old_data_index = current_planning_data.days.findIndex((day) =>
      !compare_date(day.date, new_day.date)
    );

    if (old_data_index > -1) {
      current_planning_data.days[old_data_index] = new_day;
    } else current_planning_data.days.push(new_day);
    if (compare_date(new_day.date, current_planning_data.start_date) > 0) {
      current_planning_data.start_date = new_day.date;
    }
    if (compare_date(new_day.date, current_planning_data.end_date) < 0) {
      current_planning_data.end_date = new_day.date;
    }
  }

  current_planning_data.days.sort((day_a, day_b) =>
    -compare_date(day_a.date, day_b.date)
  );
  localStorage.setItem(planning_id, JSON.stringify(current_planning_data));
};
const update_planning = async (level, group) => {
  const start_date = keep_only_date(new Date());
  const end_date = keep_only_date(Date.now() + new Date(0).setMonth(4));
  const favorites = JSON.parse(localStorage.getItem("favorites"));
  const update = async (level_, group_) => {
    try {
      const response = await fetch(
        `https://api.licence-informatique-lemans.tk/v2/planning.json?level=${level_}&group=${group_}&start=${start_date.toISOString()}&end=${end_date.toISOString()}`,
      );

      update_stored_planning(
        level_,
        group_,
        await response.json(),
      );
    } catch {
      console.error(
        `Failed to update level : ${level_}, group : ${group_}`,
      );
    }
  };

  load_planning(level, group);

  await Promise.all([
    favorites.map((favorite) => update(favorite.level, favorite.group)),
  ]);
};

window.addEventListener("load", async () => {
  if (!navigator.onLine) {
    title_element[0].textContent = "Pas d'internet";
    title_element[1].textContent = "rip... faut attendre";
  }

  await planning_resources_loaded;

  // generate study level html
  for (const study_level of planning_resources_type["study-level"]) {
    const study_level_summary_element = document.createElement("summary");
    const year_details_element = document.createElement("details");
    const year_list_element = document.createElement("ul");

    study_level_summary_element.textContent =
      planning_resources_name[study_level].name;

    for (const index in planning_resources_name[study_level].name_list) {
      const year_element = document.createElement("planning-button");

      year_element.init(study_level, index);
      year_list_element.append(year_element);
    }

    year_details_element.append(
      study_level_summary_element,
      year_list_element,
    );
    study_level_list_element.append(year_details_element);
  }

  // generate place html
  for (const place of (planning_resources_type["place"])) {
    const place_summary_element = document.createElement("summary");
    const room_details_element = document.createElement("details");
    const room_list_element = document.createElement("ul");

    place_summary_element.textContent = planning_resources_name[place].name;

    for (const index in planning_resources_name[place].name_list) {
      const room_element = document.createElement("planning-button");

      room_element.init(place, index);
      room_list_element.append(room_element);
    }

    room_details_element.append(
      place_summary_element,
      room_list_element,
    );
    place_list_element.append(room_details_element);
  }

  const search_params = new URLSearchParams(location.search);
  const level = search_params.get("level");
  const group = search_params.get("group");

  setInterval(
    () =>
      update_planning(level, group).catch((error) =>
        console.error("Failed to update planning data :", error)
      ),
    1000 * 60 * 60,
  );

  update_planning(level, group).catch((error) =>
    console.error("Failed to update planning data :", error)
  );

  // load the targeted planning
  if (level && group) {
    const start_date = keep_only_date(add_days(new Date(), -7));
    const end_date = keep_only_date(add_days(new Date(), 7));

    try {
      const response = await fetch(
        `https://api.licence-informatique-lemans.tk/v2/planning.json?level=${level}&group=${group}&start=${start_date.toISOString()}&end=${end_date.toISOString()}`,
      );

      update_stored_planning(level, group, await response.json());
    } catch {
      console.error(
        `Failed to load level : ${level}, group : ${group}`,
      );
    }

    load_planning(level, group);
  }

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
