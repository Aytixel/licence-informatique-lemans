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
const start_date = keep_only_date(add_days(new Date(), -7));
const end_date = keep_only_date(add_days(new Date(), 7));
const load_planning = (planning_data) => {
  if (
    planning_resources_name[planning_data?.level]
      ?.name_list[planning_data?.group]
  ) {
    planning_element.load(planning_data);
    planning_element.focus(keep_only_date(new Date()), true);
    title_element[0].textContent =
      planning_resources_name[planning_data?.level].name;
    title_element[1].textContent = planning_resources_name[planning_data?.level]
      ?.name_list[planning_data?.group];
  }
};
const update_planning = async () => {
  let favorites = localStorage.getItem("favorites");

  if (favorites) {
    favorites = JSON.parse(favorites);

    for (const favorite of favorites) {
      await load_planning(
        await (await fetch(
          `https://api.licence-informatique-lemans.tk/v2/planning.json?level=${favorite.level}&group=${favorite.group}&start=${start_date.toISOString()}&end=${end_date.toISOString()}`,
        )).json(),
      );
    }
  }
};

window.addEventListener("load", async () => {
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

  setInterval(
    () =>
      update_planning().catch((error) =>
        console.error("Failed to update planning data :", error)
      ),
    1000 * 60 * 60,
  );

  update_planning().catch((error) =>
    console.error("Failed to update planning data :", error)
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
