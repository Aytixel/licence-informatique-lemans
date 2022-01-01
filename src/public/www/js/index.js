// course viewer
const course_viewer_element = document.querySelector(
  ".planning .course-viewer",
);
let is_course_viewer_visible = false;
const set_course_viewer_visibility = (visible) => {
  requestAnimationFrame(() => is_course_viewer_visible = visible);

  course_viewer_element.setAttribute("aria-hidden", !visible);
};

document.querySelectorAll(".planning .course").forEach((course_element) => {
  const display = () => {
    set_course_viewer_visibility(true);

    course_viewer_element.querySelector("h2").textContent =
      course_element.querySelector("h2").textContent;
    course_viewer_element.querySelector(".resources").innerHTML = course_element
      .dataset.resources.replaceAll(",", "<br/>");
    course_viewer_element.querySelector(".comment").innerHTML = course_element
      .dataset.comment.replaceAll(",", "<br/>");
  };

  course_element.addEventListener("click", (e) => {
    e.preventDefault();

    display();
  });

  const on_keydown = (e) => {
    if (e.key == "Enter") {
      e.preventDefault();

      setTimeout(() => course_viewer_element.focus(), 200);

      display();
    }
  };

  course_element.addEventListener("focus", () => {
    course_element.addEventListener("keydown", on_keydown);
  });
  course_element.addEventListener("blur", () => {
    course_element.removeEventListener("keydown", on_keydown);
  });
});

document.querySelector(
  ".planning .course-viewer .close",
).addEventListener("click", () => {
  set_course_viewer_visibility(false);
});

window.addEventListener("keydown", (e) => {
  if (e.key == "Escape") {
    e.preventDefault();

    set_course_viewer_visibility(false);
  }
});

window.addEventListener("click", (e) => {
  if (
    !(e.target.parentNode == course_viewer_element ||
      e.target == course_viewer_element ||
      e.target.parentNode?.classList?.contains("course") ||
      e.target.classList?.contains("course")) &&
    is_course_viewer_visible
  ) {
    set_course_viewer_visibility(false);
  }
});
