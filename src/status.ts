class NotModified304 extends Response {
  constructor(body?: BodyInit, init?: ResponseInit) {
    if (init === undefined) init = {};

    init.status = 304;

    super(body, init);
  }
}

class Error404 extends Response {
  constructor(body?: BodyInit, init?: ResponseInit) {
    if (init === undefined) init = {};

    init.status = 404;

    super(body, init);
  }
}

class Error500 extends Response {
  constructor(body?: BodyInit, init?: ResponseInit) {
    if (init === undefined) init = {};

    init.status = 500;

    super(body, init);
  }
}

export { Error404, Error500, NotModified304 };
