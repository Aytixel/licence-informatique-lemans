class PlanningFetchEvent extends Event {
  constructor(request) {
    super("planningfetch");

    this.request = request;
  }
}

class PlanningViewer extends HTMLElement {
  data;
  __days_element = new Map();
  start_date;
  end_date;
  __left_bar = document.createElement("div");
  __container = document.createElement("div");
  __right_bar = document.createElement("div");
  __first_load = true;
  __scroll_left;
  __scroll_width;
  __client_width;
  __intersection_observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && Math.sign(entry.boundingClientRect.x)) {
          this.dispatchEvent(
            new PlanningFetchEvent(Math.sign(entry.boundingClientRect.x)),
          );
        }
      }
    },
    { threshold: 0.1 },
  );

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");

    style.textContent = `
    * {
      position: relative;
      z-index: 0;
      margin: 0;
      padding: 0;
    }
    
    :host {
      display: flex;

      height: 100%;

      white-space: nowrap;
    }

    .container {
      height: 100%;
      width: 100%;
    }

    .left-bar, .right-bar {
      position: absolute;
      top: 50%;
      z-index: 1;

      height: 20%;
      width: 0.2em;

      opacity: 0.5;

      border-radius: 0.2em;

      translate: 0.2em -50%;

      background-color: var(--color-dark-0);

      transition: 0.3s ease-in-out opacity;
    }

    .right-bar {
      right: 0;

      translate: -0.2em -50%;
    }
    `;

    this.__left_bar.classList.add("left-bar");
    this.__right_bar.classList.add("right-bar");

    const slot = document.createElement("slot");

    this.__container.classList.add("container");
    this.__container.append(slot);

    this.shadowRoot.append(
      style,
      this.__left_bar,
      this.__container,
      this.__right_bar,
    );

    this.__scroll_left = this.__container.scrollLeft;
    this.__scroll_width = this.__container.scrollWidth;
    this.__client_width = this.__container.clientWidth;

    this.update_indicator_bars();

    this.__container.addEventListener("scroll", () => {
      this.__scroll_left = this.__container.scrollLeft;

      this.update_indicator_bars();
    }, {
      passive: true,
    });

    new Scroll(this.__container, 1);
    new ScrollSnap(this.__container, 1, this, "planning-viewer > day-viewer");

    window.addEventListener("resize", () => {
      this.__resize_scroll();
      this.update_indicator_bars();
    }, {
      passive: true,
    });
  }

  reset() {
    this.data = undefined;
    this.__days_element.clear();
    this.start_date = undefined;
    this.end_date = undefined;
    this.__first_load = true;
    this.__intersection_observer.disconnect();
    this.innerHTML = "";
    this.__scroll_left = this.__container.scrollLeft;
    this.__scroll_width = this.__container.scrollWidth;
    this.__client_width = this.__container.clientWidth;

    this.update_indicator_bars();
  }

  __resize_scroll() {
    const old_width = this.__scroll_width - this.__client_width;
    const current_width = this.__container.scrollWidth -
      this.__container.clientWidth;

    this.__container.scrollLeft =
      (this.__scroll_left + this.__client_width / 2) / old_width *
        current_width - (this.__container.clientWidth / 2);

    this.__scroll_left = this.__container.scrollLeft;
    this.__scroll_width = this.__container.scrollWidth;
    this.__client_width = this.__container.clientWidth;
  }

  __update_indicator_bars = debounce(() => {
    this.__left_bar.style.opacity = 0;
    this.__right_bar.style.opacity = 0;
  }, 1000);

  update_indicator_bars = () => {
    const scroll_width_offset = this.__container.scrollWidth -
      this.__container.clientWidth;

    this.__update_indicator_bars();

    requestAnimationFrame(() => {
      if (scroll_width_offset) {
        const progress = this.__container.scrollLeft / scroll_width_offset;

        this.__left_bar.style.opacity = 0.5;
        this.__right_bar.style.opacity = 0.5;

        if (progress >= 1) {
          this.__left_bar.style.display = "block";
          this.__right_bar.style.display = "none";
        } else if (progress <= 0) {
          this.__left_bar.style.display = "none";
          this.__right_bar.style.display = "block";
        } else {
          this.__left_bar.style.display = "block";
          this.__right_bar.style.display = "block";
        }
      } else {
        this.__left_bar.style.display = "none";
        this.__right_bar.style.display = "none";
      }
    });
  };

  focus(date, disable_animation = false) {
    if (date instanceof Date) date = date.toISOString();

    const day_element = this.__days_element.get(date);

    if (day_element) {
      if (disable_animation) this.__container.style.scrollBehavior = "auto";

      this.__container.scrollLeft = day_element.getBoundingClientRect().x -
        (this.__container.clientWidth / 2) +
        (day_element.clientWidth / 2);
      this.__scroll_left = this.__container.scrollLeft;
      this.__scroll_width = this.__container.scrollWidth;
      this.__client_width = this.__container.clientWidth;

      if (disable_animation) this.__container.style.scrollBehavior = "";
    }
  }

  load(planning_data) {
    this.data = planning_data;

    let start_date = new Date(planning_data?.start_date);
    let end_date = new Date(planning_data?.end_date);

    this.__intersection_observer.disconnect();
    this.__scroll_left = this.__container.scrollLeft;
    this.__scroll_width = this.__container.scrollWidth;
    this.__client_width = this.__container.clientWidth;

    if (
      planning_resources_name[planning_data?.level]
        ?.name_list[planning_data?.group] &&
      start_date.toJSON() && end_date.toJSON() &&
      compare_date(start_date, end_date) > 0 && planning_data?.days?.length &&
      planning_data.days.every((day) =>
        new $mol_time_moment(day.date).toJSON().length
      )
    ) {
      start_date = keep_only_date(start_date);
      end_date = keep_only_date(end_date);

      if (!this.start_date) this.start_date = start_date;
      if (!this.end_date) this.end_date = end_date;

      planning_data.days.sort((day_a, day_b) =>
        compare_date(day_a.date, day_b.date)
      );

      const data_indexes = new Map(
        planning_data.days.map((day, index) => {
          return [day.date, index];
        }),
      );

      for (const date of this.__days_element.keys()) {
        if (data_indexes.has(date)) {
          this.__days_element.get(date).load(
            planning_data.days[data_indexes.get(date)],
          );

          data_indexes.delete(date);
        } else {
          // remove days if needed
          this.__days_element.get(date).delete();
          this.__days_element.delete(date);

          if (compare_date(date, start_date) > 0) {
            this.__scroll_left += this.__container.scrollWidth -
              this.__scroll_width;
          }

          this.__scroll_width = this.__container.scrollWidth;
        }
      }

      for (const date of data_indexes.keys()) {
        const day_element = document.createElement("day-viewer");

        day_element.dataset.date = date;
        day_element.load(planning_data.days[data_indexes.get(date)]);

        this.__days_element.set(date, day_element);

        const next_day_element = this.__days_element.get(
          add_days(date, 1).toISOString(),
        );

        if (next_day_element) {
          next_day_element.before(day_element);

          if (compare_date(this.start_date, date) < 0) {
            this.__scroll_left += this.__container.scrollWidth -
              this.__scroll_width;
          }

          this.__scroll_width = this.__container.scrollWidth;
          continue;
        }

        this.append(day_element);
        this.__scroll_width = this.__container.scrollWidth;
      }

      this.start_date = start_date;
      this.end_date = end_date;

      if (this.__first_load) {
        this.__first_load = false;

        this.focus(keep_only_date(new Date()), true);
      } else {
        this.__container.scrollLeft = this.__scroll_left;
        this.__scroll_left = this.__container.scrollLeft;
        this.__scroll_width = this.__container.scrollWidth;
        this.__client_width = this.__container.clientWidth;
      }

      this.__intersection_observer.observe(this.children[0]);
      this.__intersection_observer.observe(
        this.children[this.children.length - 1],
      );
    }

    this.update_indicator_bars();
  }
}

class DayViewer extends HTMLElement {
  __lessons_element = {};
  __date_element = document.createElement("h2");
  __day_element = document.createElement("h3");
  __top_bar = document.createElement("div");
  __container = document.createElement("div");
  __bottom_bar = document.createElement("div");

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    const time_element = document.createElement("time");

    time_element.append(this.__date_element);
    time_element.append(this.__day_element);

    style.textContent = `
    * {
      position: relative;
      z-index: 0;
      margin: 0;
      padding: 0;
    }
    
    :host {
      display: inline-block;

      flex-shrink: 0;

      height: 100%;
      width: 95vmin;

      padding: 0 2.5vmin !important;
    }

    time {
      position: absolute;
      top: 0;
      
      width: 95vmin;
    }

    h2 {
      padding: 1em;
      padding-bottom: 0;

      text-align: center;
    }

    h3 {
      padding-bottom: 0.2em;

      text-align: center;

      font-size: 1em;
    }

    .container {
      position: absolute;
      top: 5.1em;

      height: calc(100% - 5em - 2.5vmin);
      width: 95vmin;

      border-radius: 0.5em;
    }

    .top-bar, .bottom-bar {
      position: absolute;
      top: 5.1em;
      left: 50%;
      z-index: 1;

      height: 0.2em;
      width: 80%;

      opacity: 0.5;

      border-radius: 0.2em;

      translate: -50% 0.2em;

      background-color: var(--color-dark-0);

      transition: 0.3s ease-in-out opacity;
    }

    .bottom-bar {
      top: auto;
      bottom: 0;

      translate: -50% -0.8em;
    }
    `;

    this.__top_bar.classList.add("top-bar");
    this.__bottom_bar.classList.add("bottom-bar");

    const slot = document.createElement("slot");

    this.__container.classList.add("container");
    this.__container.append(slot);

    this.shadowRoot.append(
      style,
      time_element,
      this.__top_bar,
      this.__container,
      this.__bottom_bar,
    );
    this.update_indicator_bars();

    this.__container.addEventListener("scroll", this.update_indicator_bars, {
      passive: true,
    });

    new Scroll(this.__container, 2);
    new ScrollSnap(this.__container, 2, this, "day-viewer > lesson-viewer");

    window.addEventListener("resize", this.update_indicator_bars, {
      passive: true,
    });
  }

  delete() {
    window.removeEventListener("resize", this.update_indicator_bars, {
      passive: true,
    });

    this.remove();
  }

  __update_indicator_bars = debounce(() => {
    this.__top_bar.style.opacity = 0;
    this.__bottom_bar.style.opacity = 0;
  }, 1000);

  update_indicator_bars = () => {
    const scroll_height_offset = this.__container.scrollHeight -
      this.__container.clientHeight;

    this.__update_indicator_bars();

    requestAnimationFrame(() => {
      if (scroll_height_offset) {
        const progress = this.__container.scrollTop / scroll_height_offset;

        this.__top_bar.style.opacity = 0.5;
        this.__bottom_bar.style.opacity = 0.5;

        if (progress >= 1) {
          this.__top_bar.style.display = "block";
          this.__bottom_bar.style.display = "none";
        } else if (progress <= 0) {
          this.__top_bar.style.display = "none";
          this.__bottom_bar.style.display = "block";
        } else {
          this.__top_bar.style.display = "block";
          this.__bottom_bar.style.display = "block";
        }
      } else {
        this.__top_bar.style.display = "none";
        this.__bottom_bar.style.display = "none";
      }
    });
  };

  load(day_data) {
    const day_date_format = new $mol_time_moment(day_data.date);

    this.__date_element.textContent = day_date_format.toString("D Mon YYYY");
    this.__day_element.textContent = day_date_format.toString("WD");

    if (
      day_data?.lessons?.length &&
      day_data.lessons.every((lesson) =>
        new $mol_time_moment(lesson.start_date).toJSON().length &&
        new $mol_time_moment(lesson.end_date).toJSON().length
      )
    ) {
      const current_lesson_ids = Object.keys(this.__lessons_element);
      const new_lessons = day_data.lessons.reduce(
        (accumulator, lesson) => {
          accumulator[lesson.start_date + lesson.end_date] = lesson;

          return accumulator;
        },
        {},
      );

      for (const current_lesson_id of current_lesson_ids) {
        if (new_lessons[current_lesson_id]) {
          this.__lessons_element[current_lesson_id].load(
            new_lessons[current_lesson_id],
          );

          delete new_lessons[current_lesson_id];
        } else {
          this.__lessons_element[current_lesson_id]?.remove();

          delete this.__lessons_element[current_lesson_id];
        }
      }

      for (const new_lesson_id in new_lessons) {
        const new_lesson_element = document.createElement("lesson-viewer");

        new_lesson_element.dataset.start_date =
          new_lessons[new_lesson_id].start_date;
        new_lesson_element.dataset.end_date =
          new_lessons[new_lesson_id].end_date;
        new_lesson_element.load(new_lessons[new_lesson_id]);

        const lessons_element = [...this.children];
        let lesson_element = lessons_element.findLast((lesson_element) =>
          compare_date(
            new_lessons[new_lesson_id].end_date,
            lesson_element.dataset.start_date,
          ) <= 0
        );

        if (lesson_element) lesson_element.after(new_lesson_element);
        else {
          let lesson_element = lessons_element.find((lesson_element) =>
            compare_date(
              new_lessons[new_lesson_id].start_date,
              lesson_element.dataset.end_date,
            ) >= 0
          );

          if (lesson_element) lesson_element.before(new_lesson_element);
          else this.appendChild(new_lesson_element);
        }

        this.__lessons_element[new_lesson_id] = new_lesson_element;
      }
    } else {
      this.__lessons_element = {};
      this.innerHTML = "";
    }

    this.update_indicator_bars();
  }
}

class LessonViewer extends HTMLElement {
  __container = document.createElement("div");
  __title_element = document.createElement("h3");
  __description_element = document.createElement("p");
  __start_date_element = document.createElement("time");
  __end_date_element = document.createElement("time");
  __rooms_element = document.createElement("span");
  data = null;
  __show_state = false;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");

    style.textContent = `
    * {
      position: relative;
      z-index: 0;
      margin: 0;
      padding: 0;
    }
      
    :host {
      display: block;

      margin: 1.5em 0 !important;

      width: 100%;

      box-sizing: border-box;

      padding: 0.5em !important;

      border-radius: 0.5em;

      color: var(--color-dark-1);

      background: linear-gradient(180deg, var(--color-light-1) 0%, var(--color-light-1) 50%, var(--color-accent-1) 50%, var(--color-accent-1) 100%);
      background-size: 100% 201%;
      background-position-y: 100%;

      cursor: pointer;
    }

    h3 {
      width: 100%;

      overflow: hidden;

      text-overflow: ellipsis;
      white-space: nowrap;
    }

    div.show h3 {
      white-space: normal;
    }

    p {
      display: none;

      margin-top: 1em;
    }

    div.show p {
      display: block;
    }

    .bottom-bar {
      display: inline-block;

      margin-top: 1em;

      width: 100%;
    }

    .rooms {
      display: inline-block;

      float: right;
      
      width: 45%;

      overflow: hidden;

      text-align: right;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    div.show .rooms {
      white-space: normal;
    }
    `;

    this.__rooms_element.classList.add("rooms");

    const bottom_bar = document.createElement("span");

    bottom_bar.classList.add("bottom-bar");
    bottom_bar.append(
      this.__start_date_element,
      " - ",
      this.__end_date_element,
      this.__rooms_element,
    );

    this.__container.append(
      this.__title_element,
      this.__description_element,
      bottom_bar,
    );
    this.shadowRoot.append(
      style,
      this.__container,
    );

    this.addEventListener("pointerdown", () => {
      this.show();

      setTimeout(
        () => this.scrollIntoView({ inline: "center", behavior: "smooth" }),
        50,
      );
    });
    this.addEventListener("focusout", () => {
      this.hide();
    });

    window.requestAnimationFrame(() => {
      this.tabIndex = 0;

      let update_background_position_interval;
      const update_background_position = () => {
        window.requestAnimationFrame(() => {
          if (
            compare_date(
              this.dataset.end_date,
              new Date(),
            ) >= 0
          ) {
            this.style.backgroundPositionY = "0%";

            clearInterval(update_background_position_interval);
          } else if (
            compare_date(
              this.dataset.start_date,
              new Date(),
            ) >= 0
          ) {
            const total_time = new Date(this.dataset.end_date).getTime() -
              new Date(this.dataset.start_date).getTime();
            const current_time = new Date(this.dataset.end_date).getTime() -
              new Date();

            this.style.backgroundPositionY = (current_time / total_time * 100) +
              "%";
          }
        });
      };

      update_background_position_interval = setInterval(
        update_background_position,
        1000 * 60 * 2,
      );

      update_background_position();
    });
  }

  show() {
    if (this.data && !this.__show_state) {
      this.__container.classList.add("show");
      this.__rooms_element.innerHTML = this.__rooms_element.innerHTML
        .replaceAll(
          ", ",
          "<br>",
        );
      this.__show_state = true;
    }
  }

  hide() {
    if (this.data && this.__show_state) {
      this.__container.classList.remove("show");
      this.__rooms_element.innerHTML = this.__rooms_element.innerHTML
        .replaceAll(
          "<br>",
          ", ",
        );
      this.__show_state = false;
    }
  }

  load(lesson_data) {
    if (
      typeof lesson_data?.title === "string" &&
      lesson_data?.description?.length &&
      lesson_data.description.every((part) => typeof part === "string") &&
      lesson_data?.rooms?.length &&
      lesson_data.rooms.every((part) => typeof part === "string") &&
      new $mol_time_moment(lesson_data.start_date).toJSON().length &&
      new $mol_time_moment(lesson_data.end_date).toJSON().length
    ) {
      if (lesson_data.title.match(/exam|qcm|contrôle|partiel|soutenance/i)) {
        //exam
        this.style.backgroundImage =
          "linear-gradient(180deg, #f9d2d9 0%, #f9d2d9 50%, #f9335f 50%, #f9335f 100%)";
      } else if (lesson_data.title.match(/cour|cm|conférence/i)) {
        //lecture
        this.style.backgroundImage =
          "linear-gradient(180deg, #faefce 0%, #faefce 50%, #fcd570 50%, #fcd570 100%)";
      } else if (lesson_data.title.match(/td|gr[ ]*[a-c]/i)) {
        //tutorial work
        this.style.backgroundImage =
          "linear-gradient(180deg, #ddf8e8 0%, #ddf8e8 50%, #74eca8 50%, #74eca8 100%)";
      } else if (lesson_data.title.match(/tp|gr[ ]*[1-6]/i)) {
        //practical work
        this.style.backgroundImage =
          "linear-gradient(180deg, #dcf9f6 0%, #dcf9f6 50%, #70f0ee 50%, #70f0ee 100%)";
      }

      this.__title_element.textContent = lesson_data.title;

      const p = document.createElement("p");

      lesson_data.description.forEach((value, index, array) => {
        p.append(document.createTextNode(value));

        if (index < array.length - 1) {
          p.append(document.createElement("br"));
        }
      });

      this.__description_element.replaceWith(p);
      this.__start_date_element.textContent = new $mol_time_moment(
        lesson_data.start_date,
      ).toString("hh:mm");
      this.__start_date_element.dateTime = lesson_data.start_date;
      this.__end_date_element.textContent = new $mol_time_moment(
        lesson_data.end_date,
      ).toString("hh:mm");
      this.__end_date_element.dateTime = lesson_data.end_date;
      this.__rooms_element.textContent = lesson_data.rooms.join(", ");
      this.data = lesson_data;
    } else {
      this.__title_element.textContent = "";
      this.__start_date_element.textContent = "";
      this.__start_date_element.dateTime = "";
      this.__end_date_element.textContent = "";
      this.__end_date_element.dateTime = "";
      this.__rooms_element.textContent = "";
      this.data = null;
    }
  }
}

customElements.define("planning-viewer", PlanningViewer);
customElements.define("day-viewer", DayViewer);
customElements.define("lesson-viewer", LessonViewer);

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
});
