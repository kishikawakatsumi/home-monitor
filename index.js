"use strict";

import {
  onListDevices,
  onGenerateStream_WebRTC,
  onStopStream_WebRTC,
} from "./js/api";
import { signIn, handleAuth, exchangeCode, refreshAccess } from "./js/auth";
import { startReceivingMetrics } from "./js/metrics";
import { initializeWebRTC, updateWebRTC, getOfferSDP } from "./js/webrtc";

let isSignedIn = false;
let isSubscribed = false;
let selectedDevice;

init();
// onListDevices();
initializeWebRTC();

document.getElementById("auth-button").addEventListener("click", signIn);
const generateStreamButton = document.getElementById("generate-stream-button");
generateStreamButton.addEventListener("click", () => {
  generateStreamButton.setAttribute("disabled", true);
  onGenerateStream_WebRTC();
});

const stopStreamButton = document.getElementById("stop-stream-button");
stopStreamButton.addEventListener("click", () => {
  stopStreamButton.setAttribute("disabled", true);
  onStopStream_WebRTC();
});

window.addEventListener("beforeunload", (event) => {
  onStopStream_WebRTC();
});

async function init() {
  startReceivingMetrics();
  readStorage();
  await handleAuth();
  await exchangeCode();
  await refreshAccess();
  // initializeDevices(); // Issues a list devices call if logged-in
}

function readStorage() {
  /*
  if (localStorage["clientId"]) {
    updateClientId(localStorage["clientId"]);
  }
  if (localStorage["clientSecret"]) {
    updateClientSecret(localStorage["clientSecret"]);
  }
  if (localStorage["projectId"]) {
    updateProjectId(localStorage["projectId"]);
  }

  if (localStorage["oauthCode"]) {
    updateOAuthCode(localStorage["oauthCode"]);
  }
  if (localStorage["accessToken"]) {
    updateAccessToken(localStorage["accessToken"]);
  }
  if (localStorage["refreshToken"]) {
    updateRefreshToken(localStorage["refreshToken"]);
  }

  if (
    localStorage["isSignedIn"] === true ||
    localStorage["isSignedIn"] === "true"
  ) {
    updateSignedIn(localStorage["isSignedIn"]);
  }
  // Update the App Controls based on isSignedIn:
  updateAppControls();

  if (localStorage["subscriptionId"]) {
    updateSubscriptionId(localStorage["subscriptionId"]);
  }

  if (localStorage["serviceAccountKey"]) {
    updateServiceAccountKey(localStorage["serviceAccountKey"]);
  }
  */
}
