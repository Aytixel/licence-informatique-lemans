import planning_resources_name from "https://api.licence-informatique-lemans.tk/v2/planning-resources-name.json" assert {
  type: "json",
};

class PlanningViewer extends HTMLElement {
  #title_;
  #day_container;
  #days_element = {};

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.#title_ = document.createElement("h1");
    this.#day_container = document.createElement("div");
    this.#day_container.id = "day-container";

    const style = document.createElement("style");

    style.textContent = `
        :host {
            display: block;
        }
    `;

    this.shadowRoot.append(style, this.#title_, this.#day_container);
  }

  load(planning_data) {
    let start_date = new Date(planning_data?.start_date);
    let end_date = new Date(planning_data?.end_date);

    if (
      planning_resources_name[planning_data?.level]
        .name_list[planning_data?.group] &&
      start_date.toJSON() && end_date.toJSON() &&
      compare_date(start_date, end_date) > 0 && planning_data?.days?.length
    ) {
      start_date = keep_only_date(start_date);
      end_date = keep_only_date(end_date);

      this.#title_.textContent = `${
        planning_resources_name[planning_data?.level].name
      } : ${
        planning_resources_name[planning_data?.level]
          .name_list[planning_data?.group]
      }`;

      const days_date = [];
      let date = new Date(start_date);

      while (compare_date(date, end_date)) {
        days_date.push(date.toISOString());
        date = add_days(date, 1);
      }

      console.log(days_date, planning_data);

      for (const day in planning_data.days) {
        if (this.#days_element[day.date]) {
        } else {
          this.#days_element[day.date];
        }
      }
    }
  }
}

class DayViewer extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    const wrapper = document.createElement("div");
    const style = document.createElement("style");

    style.textContent = `
        :host {
            display: block;
        }
    `;

    this.shadowRoot.append(style, wrapper);
  }

  load(day_data) {
    console.log(day_data);
  }
}

customElements.define("planning-viewer", PlanningViewer);
customElements.define("day-viewer", DayViewer);
