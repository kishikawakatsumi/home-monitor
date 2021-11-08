"use strict";

import {
  onListDevices,
  onGenerateStream_WebRTC,
  onStopStream_WebRTC,
} from "./js/api";
import { signIn, handleAuth, exchangeCode, refreshAccess } from "./js/auth";
import { startReceivingMetrics } from "./js/metrics";

init();
onListDevices();

const authButton = document.getElementById("auth-button");
authButton.addEventListener("click", signIn);

const generateStreamButton = document.getElementById("generate-stream-button");
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
videoElement.addEventListener("play", () => {
  videoElement.classList.remove("loading");
});
videoElement.addEventListener("playing", () => {
  videoElement.classList.remove("loading");
});

window.addEventListener("beforeunload", (event) => {
  onStopStream_WebRTC();
});

async function init() {
  startReceivingMetrics();
  await handleAuth();
  await exchangeCode();
  await refreshAccess();
}
