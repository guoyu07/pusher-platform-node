import {Readable} from "stream";
import {IncomingMessage} from "http";

export type Headers = {
  [key: string]: string | string[];
};

export class ErrorResponse {
  constructor(
    public readonly statusCode: number,
    public readonly headers: Headers,
    public readonly description: any) {

  }
}

export interface IncomingMessageWithBody extends IncomingMessage {
  body: any;
}

export interface RequestOptions {
  method: string;
  path: string;
  jwt?: string;
  headers?: Headers;
  body?: Readable;
}

export interface AuthenticateOptions {
  userId: string;
  serviceClaims: any;
}

export const hostnameRegex = 
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
