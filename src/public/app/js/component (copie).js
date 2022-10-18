class PlanningViewer extends HTMLElement {
  #days_element = {};
  #start_date;
  #end_date;
  #left_bar = document.createElement("div");
  #container = document.createElement("div");
  #right_bar = document.createElement("div");
  #first_load = true;
  #scroll_left;
  #scroll_width;
  #client_width;

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

    this.#left_bar.classList.add("left-bar");
    this.#right_bar.classList.add("right-bar");

    const slot = document.createElement("slot");

    this.#container.classList.add("container");
    this.#container.append(slot);

    this.shadowRoot.append(
      style,
      this.#left_bar,
      this.#container,
      this.#right_bar,
    );

    this.#scroll_left = this.#container.scrollLeft;
    this.#scroll_width = this.#container.scrollWidth;
    this.#client_width = this.#container.clientWidth;

    this.update_indicator_bars();

    this.#container.addEventListener("scroll", () => {
      this.#scroll_left = this.#container.scrollLeft;

      this.update_indicator_bars();
    }, {
      passive: true,
    });

    new Scroll(this.#container, 1);
    new ScrollSnap(this.#container, 1, this, "planning-viewer > day-viewer");

    window.addEventListener("resize", () => {
      this.#resize_scroll();
      this.update_indicator_bars();
    }, {
      passive: true,
    });
  }

  #resize_scroll() {
    const old_width = this.#scroll_width - this.#client_width;
    const current_width = this.#container.scrollWidth -
      this.#container.clientWidth;

    if (old_width && current_width) {
      this.#scroll_left = (this.#scroll_left + this.#client_width / 2) /
          old_width * current_width - this.#container.clientWidth / 2;
    }

    this.#container.scrollLeft = this.#scroll_left;
    this.#scroll_width = this.#container.scrollWidth;
    this.#client_width = this.#container.clientWidth;
  }

  #update_indicator_bars = debounce(() => {
    this.#left_bar.style.opacity = 0;
    this.#right_bar.style.opacity = 0;
  }, 1000);

  update_indicator_bars = () => {
    const scroll_width_offset = this.#container.scrollWidth -
      this.#container.clientWidth;

    this.#update_indicator_bars();

    requestAnimationFrame(() => {
      if (scroll_width_offset) {
        const progress = this.#container.scrollLeft / scroll_width_offset;

        this.#left_bar.style.opacity = 0.5;
        this.#right_bar.style.opacity = 0.5;

        if (progress >= 1) {
          this.#left_bar.style.display = "block";
          this.#right_bar.style.display = "none";
        } else if (progress <= 0) {
          this.#left_bar.style.display = "none";
          this.#right_bar.style.display = "block";
        } else {
          this.#left_bar.style.display = "block";
          this.#right_bar.style.display = "block";
        }
      } else {
        this.#left_bar.style.display = "none";
        this.#right_bar.style.display = "none";
      }
    });
  };

  focus(date, disable_animation = false) {
    if (date instanceof Date) date = date.toISOString();
    if (this.#days_element[date]) {
      if (disable_animation) this.#container.style.scrollBehavior = "auto";

      this.#container.scrollLeft =
        this.#days_element[date].getBoundingClientRect().x -
        (this.#container.clientWidth / 2) +
        (this.#days_element[date].clientWidth / 2);

      if (disable_animation) this.#container.style.scrollBehavior = "";
    }
  }

  load(planning_data) {
    let start_date = new Date(planning_data?.start_date);
    let end_date = new Date(planning_data?.end_date);

    this.#scroll_left = this.#container.scrollLeft;
    this.#scroll_width = this.#container.scrollWidth;
    this.#client_width = this.#container.clientWidth;

    if (
      planning_resources_name[planning_data?.level]
        ?.name_list[planning_data?.group] &&
      start_date.toJSON() && end_date.toJSON() &&
      compare_date(start_date, end_date) > 0 && planning_data?.days?.length &&
      planning_data.days.every((day) => new Date(day.date).toJSON())
    ) {
      start_date = keep_only_date(start_date);
      end_date = keep_only_date(end_date);

      if (!this.#start_date) this.#start_date = start_date;
      if (!this.#end_date) this.#end_date = end_date;

      const days_date = [];
      let date = new Date(start_date);

      // create the list of day
      while (compare_date(date, end_date)) {
        days_date.push(date.toISOString());
        date = add_days(date, 1);
      }

      // add new days if needed
      for (const day_date of days_date) {
        if (!this.#days_element[day_date]) {
          this.#days_element[day_date] = document.createElement("day-viewer");
          this.#days_element[day_date].dataset.date = day_date;

          const scroll_width_diff = this.#container.scrollWidth -
            this.#scroll_width;

          if (compare_date(this.#start_date, day_date) < 0) {
            this.#days_element[this.#start_date.toISOString()].before(
              this.#days_element[day_date],
            );

            this.#scroll_left += scroll_width_diff;
            console.log(this.#scroll_left);
          } else this.append(this.#days_element[day_date]);

          this.#scroll_width += scroll_width_diff;
        }
      }

      for (const date_key in this.#days_element) {
        if (days_date.includes(date_key)) {
          // update days data
          this.#days_element[date_key].load(
            planning_data.days.find((x) => x.date == date_key),
            date_key,
          );
        } else {
          const removed_date = this.#days_element[date_key].dataset.date;

          // remove days if needed
          this.#days_element[date_key].remove();

          delete this.#days_element[date_key];

          const scroll_width_diff = this.#container.scrollWidth -
            this.#scroll_width;

          if (
            compare_date(
              removed_date,
              start_date,
            ) > 0
          ) {
            this.#scroll_left -= scroll_width_diff;
          }

          this.#scroll_width += scroll_width_diff;
        }
      }

      this.#start_date = start_date;
      this.#end_date = end_date;
    }

    this.update_indicator_bars();

    this.#scroll_left = Math.max(
      Math.min(
        this.#scroll_left,
        this.#container.scrollWidth - this.#container.clientWidth,
      ),
      0,
    );
    this.#container.scrollLeft = this.#scroll_left;
    this.#scroll_width = this.#container.scrollWidth;
    this.#client_width = this.#container.clientWidth;

    if (this.#first_load) {
      this.#first_load = false;

      this.focus(keep_only_date(new Date()), true);
    }
  }
}

class DayViewer extends HTMLElement {
  #lessons_element = {};
  #date_element = document.createElement("h2");
  #day_element = document.createElement("h3");
  #top_bar = document.createElement("div");
  #container = document.createElement("div");
  #bottom_bar = document.createElement("div");

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    const time_element = document.createElement("time");

    time_element.append(this.#date_element);
    time_element.append(this.#day_element);

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
      height: calc(100% - 5em - 2.5vmin);

      border-radius: 0.5em;
    }

    .top-bar, .bottom-bar {
      position: absolute;
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
      translate: -50% -0.4em;
    }
    `;

    this.#top_bar.classList.add("top-bar");
    this.#bottom_bar.classList.add("bottom-bar");

    const slot = document.createElement("slot");

    this.#container.classList.add("container");
    this.#container.append(slot);

    this.shadowRoot.append(
      style,
      time_element,
      this.#top_bar,
      this.#container,
      this.#bottom_bar,
    );
    this.update_indicator_bars();

    this.#container.addEventListener("scroll", this.update_indicator_bars, {
      passive: true,
    });

    new Scroll(this.#container, 2);
    new ScrollSnap(this.#container, 2, this, "day-viewer > lesson-viewer");

    window.addEventListener("resize", this.update_indicator_bars, {
      passive: true,
    });
  }

  #update_indicator_bars = debounce(() => {
    this.#top_bar.style.opacity = 0;
    this.#bottom_bar.style.opacity = 0;
  }, 1000);

  update_indicator_bars = () => {
    const scroll_height_offset = this.#container.scrollHeight -
      this.#container.clientHeight;

    this.#update_indicator_bars();

    requestAnimationFrame(() => {
      if (scroll_height_offset) {
        const progress = this.#container.scrollTop / scroll_height_offset;

        this.#top_bar.style.opacity = 0.5;
        this.#bottom_bar.style.opacity = 0.5;

        if (progress >= 1) {
          this.#top_bar.style.display = "block";
          this.#bottom_bar.style.display = "none";
        } else if (progress <= 0) {
          this.#top_bar.style.display = "none";
          this.#bottom_bar.style.display = "block";
        } else {
          this.#top_bar.style.display = "block";
          this.#bottom_bar.style.display = "block";
        }
      } else {
        this.#top_bar.style.display = "none";
        this.#bottom_bar.style.display = "none";
      }
    });
  };

  load(day_data, date) {
    this.#date_element.textContent = new Intl.DateTimeFormat("default", {
      dateStyle: "long",
    })
      .format(new Date(date));
    this.#day_element.textContent = new Intl.DateTimeFormat("default", {
      weekday: "long",
    })
      .format(new Date(date));

    if (
      day_data?.lessons?.length &&
      day_data.lessons.every((lesson) =>
        new Date(lesson.start_date).toJSON() &&
        new Date(lesson.end_date).toJSON()
      )
    ) {
      const new_lesson_id = [];

      for (const lesson of day_data.lessons) {
        const lesson_id = lesson.start_date + lesson.end_date;

        new_lesson_id.push(lesson_id);

        // add new lessons if needed
        if (!this.#lessons_element[lesson_id]) {
          this.#lessons_element[lesson_id] = document.createElement(
            "lesson-viewer",
          );
          this.#lessons_element[lesson_id].dataset.start_date =
            lesson.start_date;
          this.#lessons_element[lesson_id].dataset.end_date = lesson.end_date;

          const lessons_element = Array.from(this.children);

          let lesson_element = lessons_element.findLast((lesson_element) =>
            compare_date(lesson_element.dataset.end_date, lesson.start_date) >=
              0
          );

          if (lesson_element) {
            lesson_element.after(this.#lessons_element[lesson_id]);
          } else {
            lesson_element = lessons_element.find((lesson_element) =>
              compare_date(
                lesson.end_date,
                lesson_element.dataset.start_date,
              ) >= 0
            );

            if (lesson_element) {
              lesson_element.before(this.#lessons_element[lesson_id]);
            } else {
              this.appendChild(this.#lessons_element[lesson_id]);
            }
          }
        }

        // update cources data
        this.#lessons_element[lesson_id].load(lesson);
      }

      for (const lesson_id_key in this.#lessons_element) {
        if (!new_lesson_id.includes(lesson_id_key)) {
          // remove lessons if needed
          this.#lessons_element[lesson_id_key].remove();

          delete this.#lessons_element[lesson_id_key];
        }
      }
    } else {
      for (const child of Array.from(this.children)) {
        child.remove();
      }
    }

    this.update_indicator_bars();
  }
}

class LessonViewer extends HTMLElement {
  #container = document.createElement("div");
  #title_element = document.createElement("h3");
  #description_element = document.createElement("p");
  #start_date_element = document.createElement("time");
  #end_date_element = document.createElement("time");
  #rooms_element = document.createElement("span");
  data = null;
  #show_state = false;

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

    this.#rooms_element.classList.add("rooms");

    const bottom_bar = document.createElement("span");

    bottom_bar.classList.add("bottom-bar");
    bottom_bar.append(
      this.#start_date_element,
      " - ",
      this.#end_date_element,
      this.#rooms_element,
    );

    this.#container.append(
      this.#title_element,
      this.#description_element,
      bottom_bar,
    );
    this.shadowRoot.append(
      style,
      this.#container,
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
    if (this.data && !this.#show_state) {
      this.#container.classList.add("show");
      this.#rooms_element.innerHTML = this.#rooms_element.innerHTML
        .replaceAll(
          ", ",
          "<br>",
        );
      this.#show_state = true;
    }
  }

  hide() {
    if (this.data && this.#show_state) {
      this.#container.classList.remove("show");
      this.#rooms_element.innerHTML = this.#rooms_element.innerHTML
        .replaceAll(
          "<br>",
          ", ",
        );
      this.#show_state = false;
    }
  }

  load(lesson_data) {
    if (
      typeof lesson_data?.title === "string" &&
      lesson_data?.description?.length &&
      lesson_data.description.every((part) => typeof part === "string") &&
      lesson_data?.rooms?.length &&
      lesson_data.rooms.every((part) => typeof part === "string") &&
      new Date(lesson_data.start_date).toJSON() &&
      new Date(lesson_data.end_date).toJSON()
    ) {
      const date_to_time_intl = new Intl.DateTimeFormat("default", {
        timeStyle: "short",
      });

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

      this.#title_element.textContent = lesson_data.title;
      this.#description_element.textContent = lesson_data.description.join(
        "\n",
      );
      this.#description_element.innerHTML = this.#description_element.innerHTML
        .replaceAll(
          "\n",
          "<br>",
        );
      this.#start_date_element.textContent = date_to_time_intl.format(
        new Date(lesson_data.start_date),
      );
      this.#start_date_element.dateTime = lesson_data.start_date;
      this.#end_date_element.textContent = date_to_time_intl.format(
        new Date(lesson_data.end_date),
      );
      this.#end_date_element.dateTime = lesson_data.end_date;
      this.#rooms_element.textContent = lesson_data.rooms.join(", ");
      this.data = lesson_data;
    } else {
      this.#title_element.textContent = "";
      this.#start_date_element.textContent = "";
      this.#start_date_element.dateTime = "";
      this.#end_date_element.textContent = "";
      this.#end_date_element.dateTime = "";
      this.#rooms_element.textContent = "";
      this.data = null;
    }
  }
}

class PlanningButton extends HTMLElement {
  #level;
  #group;
  #svg_element;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");

    style.textContent = `
    :host {
      display: block;

      height: 1.5em;

      cursor: pointer;
    }

    svg {
      margin-right: 0.5em;

      height: 1em;

      fill: transparent;
      stroke: var(--color-accent-0);
      stroke-width: 3.5em;

      transition: 0.2s ease-in-out fill, 0.2s ease-in-out stroke;x
    }

    svg.selected {
      fill: var(--color-accent-0);
    }

    svg:hover, svg:focus {
      stroke: var(--color-accent-1);
    }

    svg.selected:hover, svg.selected:focus {
      fill: var(--color-accent-1);
    }
    `;

    const slot = document.createElement("slot");

    this.style.display = "";
    this.shadowRoot.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -10 584 567"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>`;
    this.shadowRoot.append(style, slot);
    this.#svg_element = this.shadowRoot.firstChild;

    this.#svg_element.addEventListener(
      "click",
      () => {
        let favorites = JSON.parse(localStorage.getItem("favorites"));

        if (this.#svg_element.classList.toggle("selected")) {
          favorites.push({ level: this.#level, group: this.#group });
        } else {
          favorites = favorites.filter((favorite) =>
            favorite.level != this.#level || favorite.group != this.#group
          );
        }

        localStorage.setItem("favorites", JSON.stringify(favorites));
      },
    );

    this.addEventListener("click", (event) => {
      if (
        !event.composedPath().some((element) => element == this.#svg_element)
      ) {
        location.href = location.origin + location.pathname +
          `?level=${this.#level}&group=${this.#group}`;
      }
    });
  }

  init(level, group) {
    const favorites = JSON.parse(localStorage.getItem("favorites"));

    if (
      favorites.some((favorite) =>
        favorite.level == level && favorite.group == group
      )
    ) {
      this.#svg_element.classList.add("selected");
    }

    this.#level = level;
    this.#group = group;
    this.style.display = "";
    this.textContent = planning_resources_name[level].name_list[group];
  }
}

customElements.define("planning-viewer", PlanningViewer);
customElements.define("day-viewer", DayViewer);
customElements.define("lesson-viewer", LessonViewer);
customElements.define("planning-button", PlanningButton);
