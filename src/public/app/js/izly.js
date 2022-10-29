const izly_element = document.getElementById("izly");
const izly_form_element = document.getElementById("izly-connection-form");
const izly_email_element = document.getElementById("izly-email");
const izly_qrcode_element = document.getElementById("izly-qrcode");
const izly_balance_element = document.getElementById("izly-balance");
const izly_switch_account_button_element = document.getElementById(
  "izly-change-account",
);

const encrypt = (code, email) => {
  const i = [...code.toString()].reduce((accumulator, x) => {
    return {
      x: accumulator.x + (!+x && !accumulator.c),
      c: accumulator.c + +x,
    };
  }, { x: 0, c: 0 }).x;
  const j = 8 + Math.round(Math.random() * 28);

  return j + (+code + email.length).toString(j) + j.toString().length + i;
};
const update_izly = async () => {
  const izly_data = JSON.parse(localStorage.getItem("izly"));

  if (izly_data) {
    izly_email_element.textContent = izly_data.email;

    const update_izly_offline = () => {
      izly_qrcode_element.src = localStorage.getItem("izly-qrcode") || "";
      izly_balance_element.textContent = `Solde : ${
        localStorage.getItem("izly-balance")?.toString().replace(".", ",") ||
        ""
      } €`;
    };

    if (navigator.onLine) {
      try {
        const qrcode_response = await (await fetch(
          "https://api.licence-informatique-lemans.tk/v2/izly-qrcode.json",
          { method: "post", body: JSON.stringify(izly_data) },
        )).json();

        localStorage.setItem("izly-qrcode", qrcode_response[0].Src);
        localStorage.setItem("izly-balance", qrcode_response[1]);

        izly_qrcode_element.src = qrcode_response[0].Src;
        izly_balance_element.textContent = `Solde : ${
          qrcode_response[1].toString().replace(".", ",")
        } €`;
      } catch {
        update_izly_offline();
      }
    } else update_izly_offline();

    izly_element.classList.add("connected");
  } else izly_element.classList.remove("connected");
};

update_izly();

izly_switch_account_button_element.addEventListener("click", () => {
  localStorage.removeItem("izly");

  update_izly();
});

document.getElementById("menu-button").addEventListener("pointerup", () => {
  izly_element.children[0].open = izly_element.classList.contains("connected");
});

izly_form_element.addEventListener("submit", (event) => {
  event.preventDefault();

  const form_data = new FormData(izly_form_element);
  const data = {
    email: form_data.get("email"),
    code: encrypt(form_data.get("code"), form_data.get("email")),
  };

  izly_form_element.children[0].value = "";
  izly_form_element.children[1].value = "";

  localStorage.setItem("izly", JSON.stringify(data));

  update_izly();
});
