import extend = require("extend");
import {IncomingMessage} from "http";
import {IncomingMessageWithBody} from "./common";
import * as jwt from "jsonwebtoken";

import Authenticator, { TokenWithExpiry, AuthenticationResponse } from "./authenticator";
import BaseClient from "./base_client";
import {AuthenticateOptions, RequestOptions, hostnameRegex} from "./common";

export interface Options {
  cluster: string;
  appId: string;
  appKey: string;
  client?: BaseClient;
}

export default class App {
  private client: BaseClient;
  private appId: string;
  private appKeyId: string;
  private appKeySecret: string;

  private authenticator: Authenticator;

  constructor(options: Options) {
    this.appId = options.appId;
    
    let keyParts = options.appKey.match(/^([^:]+):(.+)$/);
    if (!keyParts) {
      throw new Error("Invalid app key");
    }
    this.appKeyId = keyParts[1];
    this.appKeySecret = keyParts[2];

    const { cluster, client } = options;

    if (!hostnameRegex.test(cluster)) {
      throw new Error(`Cluster must be a valid hostname. Getting: ${cluster}`);
    }

    this.client = client || new BaseClient({
      host: cluster,
    });

    this.authenticator = new Authenticator(
      this.appId, this.appKeyId, this.appKeySecret
    );
  }

  request(options: RequestOptions): Promise<IncomingMessage> {
    options = this.scopeRequestOptions("apps", options);
    if (options.jwt == null) {
      options = extend(options, { jwt: this.generateSuperuserJWT() });
    }
    return this.client.request(options);
  }

  authenticate(request: IncomingMessageWithBody, options: AuthenticateOptions): AuthenticationResponse {
    return this.authenticator.authenticate(request, options);
  }

  generateAccessToken(options: AuthenticateOptions): TokenWithExpiry {
    return this.authenticator.generateAccessToken(options);
  }

  generateSuperuserJWT() {
    let now = Math.floor(Date.now() / 1000);
    var claims = {
      app: this.appId,
      iss: this.appKeyId,
      su: true,
      iat: now - 30,   // some leeway for the server
      exp: now + 60*5, // 5 minutes should be enough for a single request
    };
    return jwt.sign(claims, this.appKeySecret);
  }

  private scopeRequestOptions(prefix: string, options: RequestOptions): RequestOptions {
    let path = `/${prefix}/${this.appId}/${options.path}`
      .replace(/\/+/g, "/")
      .replace(/\/+$/, "");
    return extend(
      options,
      { path: path }
    );
  }
}
