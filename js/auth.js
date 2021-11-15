"use strict";

import { Credential } from "./credential";

const CLIENT_ID = import.meta.env.SNOWPACK_PUBLIC_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.SNOWPACK_PUBLIC_CLIENT_SECRET;
export const PROJECT_ID = import.meta.env.SNOWPACK_PUBLIC_PROJECT_ID;

const TOKEN_ENDPOINT = "https://www.googleapis.com/oauth2/v4/token";
const OAUTH_SCOPE = "https://www.googleapis.com/auth/sdm.service";

let oauthCode = "";

export function sharedCredential() {
  const accessToken = localStorage["accessToken"];
  const refreshToken = localStorage["refreshToken"];
  return new Credential(accessToken, refreshToken);
}

export function signIn() {
  const endpoint = `https://nestservices.google.com/partnerconnections/${PROJECT_ID}/auth`;
  const redirectUri = `${window.location.origin}/`;

  const form = document.createElement("form");
  form.setAttribute("method", "GET");
  form.setAttribute("action", endpoint);

  const params = {
    access_type: "offline",
    client_id: CLIENT_ID,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: OAUTH_SCOPE,
    state: "pass-through value",
  };

  for (const p in params) {
    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", p);
    input.setAttribute("value", params[p]);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export function handleAuth() {
  return new Promise(function (resolve, reject) {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    if (!code) {
      resolve();
      return;
    }
    updateOAuthCode(code);

    window.history.pushState("object or string", "Title", "/");
    resolve();
  });
}

export function exchangeCode() {
  return new Promise(function (resolve, reject) {
    if (!oauthCode) {
      resolve();
      return;
    }

    const redirectURI = `${window.location.origin}/`;
    console.log(redirectURI);

    const payload = {
      code: oauthCode,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectURI,
      grant_type: "authorization_code",
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN_ENDPOINT);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = () => {
      if (xhr.status === 200) {
        const parsedResponse = JSON.parse(xhr.responseText);
        updateAccessToken(parsedResponse.access_token);
        updateRefreshToken(parsedResponse.refresh_token);

        resolve();
      } else {
        updateAccessToken(null);
        updateRefreshToken(null);

        resolve();
      }
    };

    xhr.send(JSON.stringify(payload));
  });
}

export function refreshAccess() {
  return new Promise(function (resolve, reject) {
    const credential = sharedCredential();
    if (!credential.refreshToken) {
      resolve();
      return;
    }

    const payload = {
      refresh_token: credential.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN_ENDPOINT);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = () => {
      if (xhr.status === 200) {
        const parsedResponse = JSON.parse(xhr.responseText);
        updateAccessToken(parsedResponse.access_token);
        resolve();
      } else {
        updateAccessToken(null);
        updateRefreshToken(null);
        resolve();
      }
    };

    xhr.send(JSON.stringify(payload));
  });
}

function updateOAuthCode(value) {
  oauthCode = value;
  localStorage["oauthCode"] = oauthCode;
}

function updateAccessToken(value) {
  const accessToken = value;
  localStorage["accessToken"] = accessToken;
}

function updateRefreshToken(value) {
  const refreshToken = value;
  localStorage["refreshToken"] = refreshToken;
}
