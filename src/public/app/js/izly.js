const izly_element = document.getElementById("izly");
const izly_form_element = document.getElementById("izly-connection-form");
const izly_switch_account_button_element = document.getElementById(
  "izly_change_account",
);

const get_izly = () => JSON.parse(localStorage.getItem("izly"));
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
const decrypt = (code, email) => {
  code = [...code];

  const i = code.pop();
  const k = code.pop();

  code = code.join("");

  return Array.from({ length: i }, () => 0).join("") +
    (parseInt(code.substr(k), code.slice(0, k)) - email.length);
};
const update_izly = async () => {
  const izly_data = get_izly();

  if (izly_data) {
    console.log(izly_data);

    izly_element.classList.add("connected");
  } else izly_element.classList.remove("connected");
};

update_izly();

izly_switch_account_button_element.addEventListener("click", () => {
  localStorage.removeItem("izly");

  update_izly();
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
