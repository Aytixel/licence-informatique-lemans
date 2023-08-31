class PlanningFetchEvent extends Event {
  constructor(request) {
    super("planningfetch");

    this.request = request;
  }
}

document.addEventListener("alpine:init", () => {
  Alpine.data("free_room", () => ({
    date_to_time_intl: new Intl.DateTimeFormat("default", {
      timeStyle: "short",
      timeZone: "UTC",
    }),
    list: {},

    async update() {
      if (!navigator.onLine) return; // do nothing if there is no connection

      start_loader();

      try {
        const list = await (await fetch(
          `https://api.licence-informatique-lemans.tk/v2/find-free-room.json`,
        )).json();

        if (!list?.error) this.list = list;
        else {
          console.error(
            `Failed to update free room list :`,
            list.error,
          );
        }
      } catch {
        console.error(`Failed to update free room list`);
      }

      end_loader();
    },
  }));

  Alpine.data("planning_selector", (resources_type) => ({
    levels: [],

    async init() {
      await planning_resources_loaded;

      this.levels = planning_resources_type[resources_type];
    },
    in_favorites(level, group) {
      const favorites = JSON.parse(localStorage.getItem("favorites"));

      return favorites.some((favorite) =>
        favorite.level == level && favorite.group == group
      );
    },
    select_favorite(level, group) {
      let favorites = JSON.parse(localStorage.getItem("favorites"));

      if (this.$el.classList.toggle("selected")) {
        favorites.push({ level, group });

        fetch_favorite_planning(level, group);
      } else {
        favorites = favorites.filter((favorite) =>
          favorite.level != level || favorite.group != group
        );

        localStorage.removeItem(`${level}:${group}`);
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
    },
  }));

  Alpine.store("planning_viewer", () => ({
    data: {},
    start_date: undefined,
    end_date: undefined,

    load() {},
    reset() {},
  }));

  Alpine.data("planning_viewer", () => ({
    data: {},
    show_left_bar: false,
    show_right_bar: false,
    first_load: true,
    scroll_left: 0,
    scroll_width: 0,
    client_width: 0,

    init() {
      this.$store.planning_viewer.load = (data) => this.load(data);
      this.$store.planning_viewer.reset = () => this.reset();

      this.update_indicator_bars();

      new Scroll(this.$refs.container, 1);
      new ScrollSnap(
        this.$refs.container,
        1,
        this.$refs.container,
        "[x-data*='day_viewer']",
      );
    },
    update_scroll_data() {
      this.scroll_left = this.$refs.container.scrollLeft;
      this.scroll_width = this.$refs.container.scrollWidth;
      this.client_width = this.$refs.container.clientWidth;
    },
    hide_indicator_bars: debounce(function () {
      this.show_left_bar = false;
      this.show_right_bar = false;
    }, 1000),
    update_indicator_bars() {
      const scroll_width_offset = this.$refs.container.scrollWidth -
        this.$refs.container.clientWidth;

      this.hide_indicator_bars();

      if (scroll_width_offset) {
        const progress = this.$refs.container.scrollLeft /
          scroll_width_offset;

        if (progress >= 1) {
          this.show_left_bar = true;
          this.show_right_bar = false;
        } else if (progress <= 0) {
          this.show_left_bar = false;
          this.show_right_bar = true;
        } else {
          this.show_left_bar = true;
          this.show_right_bar = true;
        }
      } else {
        this.show_left_bar = false;
        this.show_right_bar = false;
      }
    },
    focus(date, disable_animation = false) {
      if (date instanceof Date) date = date.toISOString();

      const day_element = this.$refs.container.querySelector(
        `[data-date="${date}"]`,
      );

      if (day_element) {
        if (disable_animation) {
          this.$refs.container.style.scrollBehavior = "auto";
        }

        this.$refs.container.scrollLeft =
          day_element.getBoundingClientRect().x -
          (this.$refs.container.clientWidth / 2) +
          (day_element.clientWidth / 2);

        this.update_scroll_data();

        if (disable_animation) this.$refs.container.style.scrollBehavior = "";
      }
    },
    load(data) {
      if (this.data.start_date && this.data.start_date != data.start_date) {
        this.scroll_left -=
          compare_date(this.data.start_date, data.start_date) / 3600 / 24 /
          1000 * this.$refs.container.children[1].clientWidth;
      }

      this.data = data;

      if (this.first_load) {
        this.first_load = false;

        this.$nextTick(() => this.focus(keep_only_date(new Date()), true));
      } else {
        this.$nextTick(() => {
          this.$refs.container.scrollLeft = this.scroll_left;

          this.update_scroll_data();
        });
      }

      this.$store.planning_viewer.data = data;
      this.$store.planning_viewer.start_date = new Date(data.start_date);
      this.$store.planning_viewer.end_date = new Date(data.end_date);

      // remove old
      this.$refs.container.children[1]?.removeAttribute(
        "x-intersect.threshold.10",
      );
      this.$refs.container.children[this.$refs.container.children.length - 1]
        ?.removeAttribute("x-intersect.threshold.10");

      // add new
      this.$nextTick(() => {
        this.$refs.container.children[1]?.setAttribute(
          "x-intersect.threshold.10",
          "window.dispatchEvent(new PlanningFetchEvent(-1))",
        );
        this.$refs.container.children[this.$refs.container.children.length - 1]
          ?.setAttribute(
            "x-intersect.threshold.10",
            "window.dispatchEvent(new PlanningFetchEvent(1))",
          );
      });
    },
    reset() {
      this.data = {};
      this.first_load = true;

      this.update_scroll_data();

      this.$store.planning_viewer.data = {};
      this.$store.planning_viewer.start_date = undefined;
      this.$store.planning_viewer.end_date = undefined;

      this.update_indicator_bars();
    },
    scroll() {
      this.scroll_left = this.$refs.container.scrollLeft;

      this.update_indicator_bars();
    },
    resize() {
      const old_width = this.scroll_width - this.client_width;
      const current_width = this.$refs.container.scrollWidth -
        this.$refs.container.clientWidth;

      this.$refs.container.scrollLeft =
        (this.scroll_left + this.client_width / 2) / old_width *
          current_width - (this.$refs.container.clientWidth / 2);

      this.update_scroll_data();
      this.update_indicator_bars();
    },
  }));

  Alpine.data("day_viewer", (data) => ({
    data,
    day_date_format: new $mol_time_moment(data.date),
    show_top_bar: false,
    show_bottom_bar: false,

    init() {
      this.update_indicator_bars();

      new Scroll(this.$refs.container, 2);
      new ScrollSnap(
        this.$refs.container,
        2,
        this.$refs.container,
        "[x-data*='lesson_viewer']",
      );
    },
    hide_indicator_bars: debounce(function () {
      this.show_top_bar = false;
      this.show_bottom_bar = false;
    }, 1000),
    update_indicator_bars() {
      const scroll_height_offset = this.$refs.container.scrollHeight -
        this.$refs.container.clientHeight;

      this.hide_indicator_bars();

      if (scroll_height_offset) {
        const progress = this.$refs.container.scrollTop /
          scroll_height_offset;

        if (progress >= 1) {
          this.show_top_bar = true;
          this.show_bottom_bar = false;
        } else if (progress <= 0) {
          this.show_top_bar = false;
          this.show_bottom_bar = true;
        } else {
          this.show_top_bar = true;
          this.show_bottom_bar = true;
        }
      } else {
        this.show_top_bar = false;
        this.show_bottom_bar = false;
      }
    },
  }));

  Alpine.data("lesson_viewer", (data) => ({
    data,
    show: false,

    init() {
      let update_background_position_interval;
      const update_background_position = () => {
        window.requestAnimationFrame(() => {
          if (compare_date(this.data.end_date, new Date()) >= 0) {
            this.$el.style.backgroundPositionY = "0%";

            clearInterval(update_background_position_interval);
          } else if (compare_date(this.data.start_date, new Date()) >= 0) {
            const total_time = new Date(this.data.end_date).getTime() -
              new Date(this.data.start_date).getTime();
            const current_time = new Date(this.data.end_date).getTime() -
              new Date();

            this.$el.style.backgroundPositionY =
              (current_time / total_time * 100) +
              "%";
          }
        });
      };

      update_background_position_interval = setInterval(
        update_background_position,
        1000 * 60 * 2,
      );

      update_background_position();
    },
    get_background(title) {
      if (title.match(/exam|qcm|contrôle|partiel|soutenance/i)) {
        //exam
        return "background-image: linear-gradient(180deg, #f9d2d9 0%, #f9d2d9 50%, #f9335f 50%, #f9335f 100%);";
      }
      if (title.match(/cour|cm|conférence/i)) {
        //lecture
        return "background-image: linear-gradient(180deg, #faefce 0%, #faefce 50%, #fcd570 50%, #fcd570 100%);";
      }
      if (title.match(/td|gr[ ]*[a-c]/i)) {
        //tutorial work
        return "background-image: linear-gradient(180deg, #ddf8e8 0%, #ddf8e8 50%, #74eca8 50%, #74eca8 100%);";
      }
      if (title.match(/tp|gr[ ]*[1-6]/i)) {
        //practical work
        return "background-image: linear-gradient(180deg, #dcf9f6 0%, #dcf9f6 50%, #70f0ee 50%, #70f0ee 100%);";
      }

      return "";
    },
  }));
});
