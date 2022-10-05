const keep_only_date = (date) =>
  new Date(date.getTime() - (date.getTime() % (1000 * 60 * 60 * 24)));
const end_date = keep_only_date(new Date(Date.now() + new Date(0).setDate(7)));
const update_planning = async () => {
  let favorites = localStorage.getItem("favorites");

  if (favorites) {
    favorites = JSON.parse(favorites);

    for (favorite of favorites) {
      console.log(
        await (await fetch(
          location.origin.replace("app", "api") +
            `/v2/planning.json?level=${favorite.level}&group=${favorite.group}&end=${end_date.toISOString()}`,
        )).json(),
      );
    }
  }
};

window.addEventListener("load", async () => {
  setInterval(update_planning, 1000 * 60 * 60);

  update_planning().catch((error) => {
    console.error("Failed to update planning data :", error);
  });

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
