import planning_resources_name from "https://api.licence-informatique-lemans.tk/v2/planning-resources-name.json" assert {
  type: "json",
};

class PlanningViewer extends HTMLElement {
  #days_element = {};
  #start_date;
  #end_date;

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
    `;

    this.shadowRoot.append(style);
  }

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
            this.shadowRoot.append(this.#days_element[day_date]);
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
  }
}

class DayViewer extends HTMLElement {
  #courses_element = {};
  #date_element = document.createElement("h2");
  #container = document.createElement("div");

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

    div {
      height: calc(100% - 5em - 2.5vmin);

      overflow-y: auto;
    }
    `;

    this.shadowRoot.append(style, time_element, this.#container);
  }

  load(day_data, date) {
    this.#date_element.textContent = new Intl.DateTimeFormat("default", {
      dateStyle: "long",
    })
      .format(new Date(date));

    if (
      day_data?.courses?.length &&
      day_data.courses.every((course) =>
        new Date(course.start_date).toJSON() &&
        new Date(course.end_date).toJSON()
      )
    ) {
      const new_course_id = [];

      for (const course of day_data.courses) {
        const course_id = course.start_date + course.end_date;

        new_course_id.push(course_id);

        // add new courses if needed
        if (!this.#courses_element[course_id]) {
          this.#courses_element[course_id] = document.createElement(
            "course-viewer",
          );
          this.#courses_element[course_id].dataset.start_date =
            course.start_date;
          this.#courses_element[course_id].dataset.end_date = course.end_date;

          const courses_element = Array.from(this.#container.children);

          let course_element = courses_element.findLast((course_element) =>
            compare_date(course_element.dataset.end_date, course.start_date) >=
              0
          );

          if (course_element) {
            course_element.after(this.#courses_element[course_id]);
          } else {
            course_element = courses_element.find((course_element) =>
              compare_date(
                course.end_date,
                course_element.dataset.start_date,
              ) >= 0
            );

            if (course_element) {
              course_element.before(this.#courses_element[course_id]);
            } else {
              this.#container.append(this.#courses_element[course_id]);
            }
          }
        }

        // update cources data
        this.#courses_element[course_id].load(course);
      }

      for (const course_id_key in this.#courses_element) {
        if (!new_course_id.includes(course_id_key)) {
          // remove courses if needed
          this.#courses_element[course_id_key].remove();

          delete this.#courses_element[course_id_key];
        }
      }
    } else {
      for (const child of [...this.#container.children]) {
        child.remove();
      }
    }
  }
}

class CourseViewer extends HTMLElement {
  #title_element = document.createElement("h3");
  #start_time_element = document.createElement("time");
  #end_time_element = document.createElement("time");
  #rooms_element = document.createElement("span");
  data = null;

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

      margin-top: 2em !important;

      width: 100%;

      box-sizing: border-box;

      padding: 0.5em !important;

      border-radius: 0.5em;

      color: var(--color-dark-1);

      background-color: var(--color-light-1);
    }

    h3 {
      margin-bottom: 1em;
      
      width: 100%;

      overflow: hidden;

      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      display: inline-block;

      float: right;
      
      width: 45%;

      overflow: hidden;

      text-align: right;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    `;

    this.shadowRoot.append(
      style,
      this.#title_element,
      this.#start_time_element,
      " - ",
      this.#end_time_element,
      this.#rooms_element,
    );
  }

  load(course_data) {
    if (
      typeof course_data?.title === "string" &&
      course_data?.description?.length &&
      course_data.description.every((part) => typeof part === "string") &&
      course_data?.rooms?.length &&
      course_data.rooms.every((part) => typeof part === "string") &&
      new Date(course_data.start_date).toJSON() &&
      new Date(course_data.end_date).toJSON()
    ) {
      const date_to_time_intl = new Intl.DateTimeFormat("default", {
        timeStyle: "short",
      });

      this.#title_element.textContent = course_data.title;
      this.#start_time_element.textContent = date_to_time_intl.format(
        new Date(course_data.start_date),
      );
      this.#start_time_element.dateTime = course_data.start_date;
      this.#end_time_element.textContent = date_to_time_intl.format(
        new Date(course_data.end_date),
      );
      this.#end_time_element.dateTime = course_data.end_date;
      this.#rooms_element.textContent = course_data.rooms.join(", ");
      this.data = course_data;
    } else {
      this.#title_element.textContent = "";
      this.#start_time_element.textContent = "";
      this.#start_time_element.dateTime = "";
      this.#end_time_element.textContent = "";
      this.#end_time_element.dateTime = "";
      this.#rooms_element.textContent = "";
      this.data = null;
    }
  }
}

customElements.define("planning-viewer", PlanningViewer);
customElements.define("day-viewer", DayViewer);
customElements.define("course-viewer", CourseViewer);
