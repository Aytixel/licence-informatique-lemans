// cource viewer
const cource_viewer_element = document.querySelector(
  ".planning .cource-viewer",
);
let is_cource_viewer_visible = false;
const set_cource_viewer_visibility = (visible) => {
  requestAnimationFrame(() => is_cource_viewer_visible = visible);

  cource_viewer_element.ariaHidden = !visible;
};

document.querySelectorAll(".planning .cource").forEach((cource_element) => {
  cource_element.addEventListener("click", (e) => {
    e.preventDefault();

    set_cource_viewer_visibility(true);

    cource_viewer_element.querySelector("h2").textContent =
      cource_element.querySelector("h2").textContent;
    cource_viewer_element.querySelector(".resources").innerHTML = cource_element
      .dataset.resources.replaceAll(",", "<br/>");
    cource_viewer_element.querySelector(".comment").innerHTML = cource_element
      .dataset.comment.replaceAll(",", "<br/>");
  });
});

document.querySelector(
  ".planning .cource-viewer .close",
).addEventListener("click", () => {
  set_cource_viewer_visibility(false);
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
