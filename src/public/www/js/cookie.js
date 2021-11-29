const cookie_list = {
  gg_analytics: [
    "Google analytics",
    "Nous utilisons les cookies Google analytics dans le seul but d'avoir des statistiques sur l'utilisation, et les performances, afin d'améliorer le site.",
  ],
};

// persist cookies if a month doesn't have passed
for (const cookie_name in cookie_list) {
  Cookies.set(cookie_name, Cookies.get(cookie_name), {
    secure: true,
    sameSite: "strict",
    expires: 30,
  });
}

class CookiePanelElement extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");

    style.textContent = `
        :host {
            position: fixed !important;
            left: 1vh;
            bottom: 2vh;

            height: 5vh;
            width: 5vh;
        }

        img {
            height: 100%;
            width: 100%;

            cursor: pointer;
        }

        .panel {
            position: absolute;
            bottom: -0.5vh;
            left: -1vh;
            z-index: -1;

            width: 50vmin;

            padding: 1vh;
            padding-bottom: 6vh;
            
            border-top-right-radius: 1.5vh;
            border-bottom-right-radius: 1.5vh;
            border: solid #2e2e2e 0.5vh;
            border-left: none;

            background-color: #d9d9d9;

            transform: scaleX(0);
            transform-origin: left;

            transition: transform 0.2s ease-in-out;
        }

        .panel.show {transform: scaleX(1);}

        ul {list-style: none;}

        summary {
          margin-bottom: 1vh;

          cursor: pointer;
        }

        summary::marker {color: #1c1c1c;}

        input[type="checkbox"] {
            height: 0;
            width: 0;
        }

        label {
            display: inline-block;

            position: relative;

            height: 1vh;
            width: 4vh;

            border-radius: 0.5vh;

            background-color: #1c1c1c;

            transition: transform 0.2s ease-in-out, border 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }

        input[type="checkbox"]:checked + label {
            border-radius: 1vh;
            border: solid #1c1c1c 0.5vh;
            
            background-color: #d9d9d9;

            transform: translate(-0.5vh, 0.5vh);
        }

        input[type="checkbox"]:focus + label {outline: solid;}

        label::before {
            display: block;

            position: absolute;
            top: -0.5vh;
            left: -0.5vh;

            height: 2vh;
            width: 2vh;

            content: "";

            border-radius: 1vh;

            background-color: #2e2e2e;

            transition: transform 0.2s ease-in-out;
        }

        input[type="checkbox"]:checked + label::before {
            transform: translateX(3vh);
        }
    `;

    this.panel = document.createElement("div");
    this.panel_list = document.createElement("ul");
    this.checkbox_list = [];
    this.summary_list = [];
    this.img = document.createElement("img");

    for (const key in cookie_list) {
      const li = document.createElement("li");
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      const checkbox = document.createElement("input");
      const label = document.createElement("label");

      this.checkbox_list.push(checkbox);
      this.summary_list.push(summary);

      label.setAttribute("for", checkbox.id = "cookie_" + key);
      label.tabIndex = 0;
      label.addEventListener("focus", () => checkbox.focus());
      checkbox.type = "checkbox";
      checkbox.checked = !!+Cookies.get(key);
      checkbox.addEventListener("change", () => {
        Cookies.set(key, +checkbox.checked, {
          secure: true,
          sameSite: "strict",
          expires: 30,
        });
      });
      checkbox.addEventListener("focus", () => this.show_());
      checkbox.addEventListener("blur", () => this.hide());
      summary.textContent = cookie_list[key][0] + " : ";
      summary.addEventListener("focus", () => this.show_());
      summary.addEventListener("blur", () => this.hide());

      summary.appendChild(checkbox);
      summary.appendChild(label);
      details.appendChild(summary);
      details.appendChild(document.createTextNode(cookie_list[key][1]));
      li.appendChild(details);
      this.panel_list.appendChild(li);
    }

    this.panel.classList.add("panel");
    this.panel.textContent = "Choisissez les Cookies que vous acceptez :";

    this.panel.appendChild(this.panel_list);
    this.panel.appendChild(
      document.createTextNode(
        "Aucune donnée récoltée grâce aux cookies ne sera publiée ou vendue, de plus toutes les données sont anonymes.",
      ),
    );

    this.img.src = "/resource/img/cookies.png";
    this.img.height = 48;
    this.img.width = 48;
    this.img.alt = "cookie";
    this.img.tabIndex = 0;
    this.img.addEventListener("focus", () => this.show_());
    this.img.addEventListener("blur", () => this.hide());

    shadow.appendChild(style);
    shadow.appendChild(this.img);
    shadow.appendChild(this.panel);
  }

  hide() {
    this.panel.classList.remove("show");
    this.img.blur();

    for (const checkbox of this.checkbox_list) checkbox.blur();
    for (const checkbox of this.checkbox_list) checkbox.blur();
  }

  show() {
    this.img.focus();
  }

  show_() {
    this.panel.classList.add("show");
  }
}

customElements.define("cookie-panel", CookiePanelElement);

const cookie_panel = document.createElement("cookie-panel");

document.body.appendChild(cookie_panel);

if (!localStorage.getItem("cookie_consent")) {
  localStorage.setItem("cookie_consent", true);
  cookie_panel.show();
}
