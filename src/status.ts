class Ok200 extends Response {
  constructor(body?: BodyInit) {
    super(body, { status: 200 });
  }
}

class NotModified304 extends Response {
  constructor() {
    super(null, { status: 304 });
  }
}

class Error404 extends Response {
  constructor() {
    super(null, { status: 404 });
  }
}

class Error500 extends Response {
  constructor() {
    super(null, { status: 500 });
  }
}

export { Error404, Error500, NotModified304, Ok200 };
