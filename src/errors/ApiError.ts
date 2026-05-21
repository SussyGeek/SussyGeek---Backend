export class ApiError extends Error {
  statusCode: number;
  details: any;
  constructor(statusCode: number, message: string, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}