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

const authButton = document.getElementById("auth-button");
authButton.addEventListener("click", signIn);

const generateStreamButton = document.getElementById("generate-stream-button");
generateStreamButton.classList.remove("is-hidden");
generateStreamButton.removeAttribute("disabled");
generateStreamButton.addEventListener("click", () => {
  videoElement.classList.add("loading");

  generateStreamButton.setAttribute("disabled", true);
  onGenerateStream_WebRTC();
});

const stopStreamButton = document.getElementById("stop-stream-button");
stopStreamButton.addEventListener("click", () => {
  stopStreamButton.setAttribute("disabled", true);
  onStopStream_WebRTC();
});

const videoElement = document.getElementById("video-stream");
videoElement.addEventListener("canplay", () => {
  console.log("Video can play");
});
videoElement.addEventListener("complete", () => {
  console.log("Video complete");
});
videoElement.addEventListener("emptied", () => {
  console.log("Video emptied");
});
videoElement.addEventListener("ended", () => {
  console.log("Video ended");
});
videoElement.addEventListener("loadeddata", () => {
  console.log("Video loaded data");
});
videoElement.addEventListener("loadedmetadata", () => {
  console.log("Video loaded metadata");
});
videoElement.addEventListener("pause", () => {
  console.log("Video paused");
});
videoElement.addEventListener("play", () => {
  videoElement.classList.remove("loading");
  console.log("Video playing");
});
videoElement.addEventListener("playing", () => {
  videoElement.classList.remove("loading");
  console.log("Video playing");
});
videoElement.addEventListener("stalled", () => {
  console.log("Video stalled");
});
videoElement.addEventListener("suspend", () => {
  console.log("Video suspended");
});
videoElement.addEventListener("waiting", () => {
  console.log("Video waiting");
});

window.addEventListener("beforeunload", (event) => {
  onStopStream_WebRTC();
});

if (localStorage["accessToken"] && localStorage["refreshToken"]) {
  setTimeout(() => {
    generateStreamButton.click();
  }, 1000);
}

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
