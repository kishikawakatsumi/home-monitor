"use strict";

const TOKEN_ENDPOINT = "https://www.googleapis.com/oauth2/v4/token";
const OAUTH_SCOPE = "https://www.googleapis.com/auth/sdm.service";

const selectedEndpoint = "https://nestservices.google.com/partnerconnections/";

const clientId = import.meta.env.SNOWPACK_PUBLIC_CLIENT_ID;
const clientSecret = import.meta.env.SNOWPACK_PUBLIC_CLIENT_SECRET;
const projectId = import.meta.env.SNOWPACK_PUBLIC_PROJECT_ID;

let oauthCode = "";
let accessToken = localStorage["accessToken"];
let refreshToken = localStorage["refreshToken"];

export function signIn() {
  const redirectURI = window.location.origin + "/";
  const oauthEndpoint = selectedEndpoint + projectId + "/auth";

  const form = document.createElement("form");
  form.setAttribute("method", "GET");
  form.setAttribute("action", oauthEndpoint);

  const params = {
    access_type: "offline",
    client_id: clientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: redirectURI,
    response_type: "code",
    scope: OAUTH_SCOPE,
    state: "pass-through value",
  };

  for (let p in params) {
    let input = document.createElement("input");
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
    if (accessToken || !oauthCode) {
      resolve();
      return;
    }

    const redirectURI = window.location.origin + "/";

    const payload = {
      code: oauthCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectURI,
      grant_type: "authorization_code",
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN_ENDPOINT);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = function () {
      if (xhr.status === 200) {
        const parsedResponse = JSON.parse(xhr.responseText);
        updateAccessToken(parsedResponse.access_token);
        updateRefreshToken(parsedResponse.refresh_token);
        // updateSignedIn(true);
        resolve();
      } else {
        updateAccessToken(undefined);
        updateRefreshToken(undefined);
        // updateSignedIn(false);
        resolve();
      }
    };

    xhr.send(JSON.stringify(payload));
  });
}

export function refreshAccess() {
  return new Promise(function (resolve, reject) {
    if (!refreshToken) {
      resolve();
      return;
    }

    const payload = {
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN_ENDPOINT);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onload = function () {
      if (xhr.status === 200) {
        const parsedResponse = JSON.parse(xhr.responseText);
        updateAccessToken(parsedResponse.access_token);
        resolve();
      } else {
        updateAccessToken(undefined);
        updateRefreshToken(undefined);
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
  console.log("updateAccessToken", value);
  accessToken = value;
  localStorage["accessToken"] = accessToken;
}

function updateRefreshToken(value) {
  refreshToken = value;
  localStorage["refreshToken"] = refreshToken;
}

export function getAccessToken() {
  return accessToken;
}

export function getProjectId() {
  return projectId;
}
