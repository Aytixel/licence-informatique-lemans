// cource viewer
const cource_viewer_element = document.querySelector(
  ".planning .cource-viewer",
);
let is_cource_viewer_visible = false;
const set_cource_viewer_visibility = (visible) => {
  requestAnimationFrame(() => is_cource_viewer_visible = visible);

  cource_viewer_element.setAttribute("aria-hidden", !visible);
};

document.querySelectorAll(".planning .cource").forEach((cource_element) => {
  const display = () => {
    set_cource_viewer_visibility(true);

    cource_viewer_element.querySelector("h2").textContent =
      cource_element.querySelector("h2").textContent;
    cource_viewer_element.querySelector(".resources").innerHTML = cource_element
      .dataset.resources.replaceAll(",", "<br/>");
    cource_viewer_element.querySelector(".comment").innerHTML = cource_element
      .dataset.comment.replaceAll(",", "<br/>");
  };

  cource_element.addEventListener("click", (e) => {
    e.preventDefault();

    display();
  });

  const on_keydown = (e) => {
    if (e.key == "Enter") {
      e.preventDefault();

      setTimeout(() => cource_viewer_element.focus(), 200);

      display();
    }
  };

  cource_element.addEventListener("focus", (e) => {
    cource_element.addEventListener("keydown", on_keydown);
  });
  cource_element.addEventListener("blur", (e) => {
    cource_element.removeEventListener("keydown", on_keydown);
  });
});

document.querySelector(
  ".planning .cource-viewer .close",
).addEventListener("click", () => {
  set_cource_viewer_visibility(false);
});

window.addEventListener("keydown", (e) => {
  if (e.key == "Escape") {
    e.preventDefault();

    set_cource_viewer_visibility(false);
  }
});

window.addEventListener("click", (e) => {
  if (
    !(e.target.parentNode == cource_viewer_element ||
      e.target == cource_viewer_element ||
      e.target.parentNode?.classList?.contains("cource") ||
      e.target.classList?.contains("cource")) &&
    is_cource_viewer_visible
  ) {
    set_cource_viewer_visibility(false);
  }
});
