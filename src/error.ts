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

export { Error404, Error500 };
