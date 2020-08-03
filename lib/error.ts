import { isError, isString } from './types.ts';

/** Custom database error. */
export class DatabaseError extends Error {
  /** Error name. */
  public name: string = 'DatabaseError';

  /** Error message. */
  public message: string;

  /** Exectuion stack. */
  public stack: string | undefined;

  /** Cause of the error. */
  public cause: any;

  /**
	 * Error initialization.
	 * @param name Error name.
	 * @param message Error message.
	 * @param cause Cause of the error.
	 */
  constructor(message: string, cause?: any) {
    super(message);
    Error.captureStackTrace(this, DatabaseError);

    this.message = message;
    if (cause) this.cause = cause;

    if (isString(cause)) this.message = `${message}: ${cause}`;
    if (isError(cause) && isString(cause.message)) {
      this.message = `${message}: ${cause.message}`;
    }
  }
}

export default DatabaseError;
