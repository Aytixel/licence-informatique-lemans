class Scroll {
  #orientation;
  #element;
  #last_position = { x: 0, y: 0 };
  #deceleration = 0.95;
  #hold = false;
  #running = false;

  // orientation: 1 = x, 2 = y, 3 = xy
  constructor(element, orientation = 0) {
    this.#orientation = orientation;
    this.#element = element;
    this.#wheel = this.#wheel.bind(this);
    this.#pointer_start = this.#pointer_start.bind(this);
    this.#pointer_move = this.#pointer_move.bind(this);
    this.#pointer_end = this.#pointer_end.bind(this);

    this.#element.style.overflow = "hidden";

    element.addEventListener(
      "wheel",
      this.#wheel,
      { passive: true },
    );
    element.addEventListener("pointerdown", this.#pointer_start);
  }

  #wheel = (event) => {
    this.#element.style.scrollBehavior = "auto";
    this.#element.style.scrollSnapType = "none";

    this.apply_scroll(event.deltaX, event.deltaY, event.shiftKey);
  };

  #pointer_start = (event) => {
    this.#hold = true;
    this.#last_position.x = event.clientX;
    this.#last_position.y = event.clientY;
    this.#element.style.scrollBehavior = "auto";
    this.#element.style.scrollSnapType = "none";

    this.#element.addEventListener("pointermove", this.#pointer_move, {
      passive: true,
    });

    this.#element.addEventListener("pointerup", this.#pointer_end);
    this.#element.addEventListener("pointercancel", this.#pointer_end);
    this.#element.addEventListener("pointerleave", this.#pointer_end);
    this.#element.addEventListener(
      "lostpointercapture",
      this.#pointer_end,
    );
  };

  #pointer_move = (event) => {
    this.apply_scroll(
      this.#last_position.x - event.clientX,
      this.#last_position.y - event.clientY,
      false,
      false,
    );

    this.#last_position.x = event.clientX;
    this.#last_position.y = event.clientY;
  };

  #pointer_end = () => {
    this.#element.removeEventListener(
      "pointermove",
      this.#pointer_move,
      { passive: true },
    );

    this.#element.removeEventListener("pointerup", this.#pointer_move);
    this.#element.removeEventListener(
      "pointercancel",
      this.#pointer_end,
    );
    this.#element.removeEventListener("pointerleave", this.#pointer_end);
    this.#element.removeEventListener(
      "lostpointercapture",
      this.#pointer_end,
    );

    this.#hold = false;

    this.#reset_scroll_style();
  };

  apply_scroll(x, y, shift = false, is_wheel = true) {
    if (is_wheel) {
      this.#hold = false;
      this.#running = false;
    }

    if (!this.#hold) {
      const x_stop = Math.abs(x) < 1;
      const y_stop = Math.abs(y) < 1;
      x *= this.#deceleration;
      y *= this.#deceleration;

      if (x_stop) x = 0;
      if (y_stop) y = 0;
      if (x_stop && y_stop) this.#running = false;
    }

    if (!this.#running && this.#hold) this.#running = true;

    window.requestAnimationFrame(() => {
      if (this.#orientation == 1) {
        if (is_wheel) this.#element.scrollLeft += y;
        this.#element.scrollLeft += x;
      }
      if (this.#orientation == 2) {
        this.#element.scrollTop += y;
        if (is_wheel) this.#element.scrollTop += x;
      }
      if (this.#orientation == 3) {
        if (is_wheel && shift) {
          this.#element.scrollTop += x;
          this.#element.scrollLeft += y;
        } else {
          this.#element.scrollTop += y;
          this.#element.scrollLeft += x;
        }
      }

      if (this.#running && !this.#hold) {
        this.apply_scroll(x, y, shift, is_wheel);
      }
      if (!is_wheel) this.#reset_scroll_style();
    });
  }

  #reset_scroll_style = debounce(() => {
    if (!this.#hold) {
      this.#element.style.scrollBehavior = "";
      this.#element.style.scrollSnapType = "";
    }
  }, 50);
}
