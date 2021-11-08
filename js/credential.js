"use strict";

export class Credential {
  #accessToken;
  #refreshToken;

  constructor(accessToken, refreshToken) {
    this.#accessToken = accessToken;
    this.#refreshToken = refreshToken;
  }

  get accessToken() {
    return this.#accessToken;
  }

  get refreshToken() {
    return this.#refreshToken;
  }
}
