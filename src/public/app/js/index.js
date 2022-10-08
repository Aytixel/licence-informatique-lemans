import planning_resources_name from "https://api.licence-informatique-lemans.tk/v2/planning-resources-name.json" assert {
  type: "json",
};
import planning_resources_type from "https://api.licence-informatique-lemans.tk/v2/planning-resources-type.json" assert {
  type: "json",
};

if (window.indexedDB) {
  const planning_database = window.indexedDB.open("planning", 2);
  const keep_only_date = (date) =>
    new Date(date.getTime() - (date.getTime() % (1000 * 60 * 60 * 24)));
  const start_date = keep_only_date(
    new Date(Date.now() - new Date(0).setDate(8)),
  );
  const end_date = keep_only_date(
    new Date(Date.now() + new Date(0).setDate(8)),
  );
  const update_planning = async () => {
    let favorites = localStorage.getItem("favorites");

    if (favorites) {
      favorites = JSON.parse(favorites);

      for (const favorite of favorites) {
        console.log(
          await (await fetch(
            `https://api.licence-informatique-lemans.tk/v2/planning.json?level=${favorite.level}&group=${favorite.group}&start=${start_date.toISOString()}&end=${end_date.toISOString()}`,
          )).json(),
        );
      }
    }
  };

  window.addEventListener("load", async () => {
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
} else alert("Votre navigateur n'est pas supporté, tester avec un autre.");
