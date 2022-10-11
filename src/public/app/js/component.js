class PlanningViewer extends HTMLElement {
  #days_element = {};
  #start_date;
  #end_date;
  #left_bar = document.createElement("div");
  #container = document.createElement("div");
  #right_bar = document.createElement("div");

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

      overflow-y: hidden;
      overflow-x: auto;

      white-space: nowrap;
    }

    .container {
      height: 100%;
      width: 100%;

      overflow: auto;
    }

    .left-bar, .right-bar {
      position: absolute;
      top: 50%;
      z-index: 1;

      height: 20%;
      width: 0.2em;

      opacity: 0.3;

      border-radius: 0.2em;

      translate: 0.2em -50%;

      background-color: var(--color-dark-0);
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
    this.update_indicator_bars();
    this.#container.addEventListener("scroll", this.update_indicator_bars, {
      passive: true,
    });

    window.addEventListener("resize", this.update_indicator_bars, {
      passive: true,
    });
  }

  update_indicator_bars = () => {
    const scroll_width_offset = this.#container.scrollWidth -
      this.#container.clientWidth;

    if (scroll_width_offset) {
      const progress = this.#container.scrollLeft / scroll_width_offset;

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
  };

  load(planning_data) {
    let start_date = new Date(planning_data?.start_date);
    let end_date = new Date(planning_data?.end_date);

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

          if (compare_date(this.#start_date, day_date) < 0) {
            this.#days_element[this.#start_date.toISOString()].before(
              this.#days_element[day_date],
            );
          } else {
            this.append(this.#days_element[day_date]);
          }
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
          // remove days if needed
          this.#days_element[date_key].remove();

          delete this.#days_element[date_key];
        }
      }

      this.#start_date = start_date;
      this.#end_date = end_date;
    }

    this.update_indicator_bars();
  }
}

class DayViewer extends HTMLElement {
  #lessons_element = {};
  #date_element = document.createElement("h2");
  #top_bar = document.createElement("div");
  #container = document.createElement("div");
  #bottom_bar = document.createElement("div");

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    const time_element = document.createElement("time");

    time_element.append(this.#date_element);

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
      text-align: center;
      padding: 1em;
    }

    .container {
      height: calc(100% - 5em - 2.5vmin);

      overflow-y: auto;
    }

    .top-bar, .bottom-bar {
      position: absolute;
      left: 50%;
      z-index: 1;

      height: 0.2em;
      width: 80%;

      opacity: 0.3;

      border-radius: 0.2em;

      translate: -50% 0.2em;

      background-color: var(--color-dark-0);
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

    window.addEventListener("resize", this.update_indicator_bars, {
      passive: true,
    });
  }

  update_indicator_bars = () => {
    const scroll_height_offset = this.#container.scrollHeight -
      this.#container.clientHeight;

    if (scroll_height_offset) {
      const progress = this.#container.scrollTop / scroll_height_offset;

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
  };

  load(day_data, date) {
    this.#date_element.textContent = new Intl.DateTimeFormat("default", {
      dateStyle: "long",
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

    this.addEventListener("focusin", () => {
      this.show();
      this.scrollIntoView(
        window.innerWidth < window.innerHeight ? { inline: "center" } : null,
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

customElements.define("planning-viewer", PlanningViewer);
customElements.define("day-viewer", DayViewer);
customElements.define("lesson-viewer", LessonViewer);
