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

class NotModified304 extends Response {
  constructor() {
    super(null, { status: 304 });
  }
}

export { Error404, Error500, NotModified304 };
