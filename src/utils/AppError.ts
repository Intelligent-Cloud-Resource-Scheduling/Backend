export class AppError extends Error { // How to use?
  status: number;
  code: string;
  details: any;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', details = {}) {
    console.log(message);
    super(message);
    this.status = status;
    this.code = code;
    this.details = details
  }
}