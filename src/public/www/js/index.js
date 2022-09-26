function throttle(callback, delay) {
  let last, timer;

  return function () {
    let context = this, now = +new Date(), args = arguments;

    if (last && now < last + delay) {
      clearTimeout(timer);

      timer = setTimeout(function () {
        last = now;

        callback.apply(context, args);
      }, delay);
    } else {
      last = now;

      callback.apply(context, args);
    }
  };
}

const header_banner = document.querySelector("#header-banner");

window.addEventListener("deviceorientation", (e) => {
  header_banner.style.translate = `${e.gamma / 180 * -2}% calc(-50% + ${
    e.beta / 180 * -2
  }%)`;
});

window.addEventListener(
  "mousemove",
  throttle((e) => {
    header_banner.style.translate = `${
      e.clientX / window.innerWidth * -2
    }% calc(-50% + ${e.clientY / window.innerHeight * -2}%)`;
  }, 50),
);
