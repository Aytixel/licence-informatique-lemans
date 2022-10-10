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
        :host {
            display: block;
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

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");

    style.textContent = `
        :host {
            display: block;
        }
    `;

    this.shadowRoot.append(style);
  }

  load(day_data) {
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

          const courses_element = Array.from(this.shadowRoot.children);

          let course_element = courses_element.findLast((course_element) =>
            course_element.tagName.toLowerCase() == "course-viewer" &&
            compare_date(course_element.dataset.end_date, course.start_date) >=
              0
          );

          if (course_element) {
            course_element.after(this.#courses_element[course_id]);
          } else {
            course_element = courses_element.find((course_element) =>
              course_element.tagName.toLowerCase() == "course-viewer" &&
              compare_date(
                  course.end_date,
                  course_element.dataset.start_date,
                ) >= 0
            );

            if (course_element) {
              course_element.before(this.#courses_element[course_id]);
            } else {
              this.shadowRoot.append(this.#courses_element[course_id]);
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
      for (const child of this.shadowRoot.children) {
        child.remove();
      }
    }
  }
}

class CourseViewer extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");

    style.textContent = `
          :host {
              display: block;
          }
      `;

    this.shadowRoot.append(style);
  }

  load(course_data) {
    console.log(course_data);
  }
}

customElements.define("planning-viewer", PlanningViewer);
customElements.define("day-viewer", DayViewer);
customElements.define("course-viewer", CourseViewer);
