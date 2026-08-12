//password is incorrect error handle korar jnno extend use kora
// stack debugging e help kore

class ApiErrorHandler extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string | undefined, stack?: "") {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default ApiErrorHandler;
