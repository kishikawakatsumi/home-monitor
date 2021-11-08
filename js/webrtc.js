/* Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// WebRTC Variables:

let localPeerConnection;
let localSendChannel;
let localStream;
let remoteStream;
let offerSDP = "";

export function getOfferSDP() {
  return offerSDP;
}

// WebRTC Configurations:

const localOfferOptions = {
  offerToReceiveVideo: 1,
  offerToReceiveAudio: 1,
};

/// WebRTC Functions ///

/** initializeWebRTC - Triggers starting a new WebRTC stream on initialization */
export function initializeWebRTC() {
  startLocalStream();
}

/** startLocalStream - Starts a WebRTC stream on the browser */
function startLocalStream(mediaStream) {
  localPeerConnection = null;
  localSendChannel = null;
  localStream = null;
  offerSDP = "";

  remoteStream = new MediaStream();

  const servers = { sdpSemantics: "unified-plan", iceServers: [] };
  localPeerConnection = new RTCPeerConnection(servers);
  localPeerConnection.ondatachannel = receiveChannelCallback;

  localSendChannel = localPeerConnection.createDataChannel(
    "dataSendChannel",
    null
  );
  localPeerConnection.addEventListener(
    "iceconnectionstatechange",
    handleConnectionChange
  );

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      localPeerConnection.addTrack(track, mediaStream);
    });
    localStream = mediaStream;
  }

  localPeerConnection.addEventListener("track", gotRemoteMediaTrack);

  localPeerConnection
    .createOffer(localOfferOptions)
    .then(createdOffer)
    .catch(setSessionDescriptionError);
}

/** createdOffer - Handles local offerSDP creation */
function createdOffer(description) {
  offerSDP = description.sdp;
  localPeerConnection
    .setLocalDescription(description)
    .then(() => {
      setLocalDescriptionSuccess(localPeerConnection);
    })
    .catch(setSessionDescriptionError);
}

/** updateWebRTC - Updates WebRTC connection on receiving answerSDP */
export function updateWebRTC(answerSDP) {
  if (answerSDP[answerSDP.length - 1] !== "\n") {
    answerSDP += "\n";
  }

  localPeerConnection
    .setRemoteDescription({ type: "answer", sdp: answerSDP })
    .then(() => {
      setRemoteDescriptionSuccess(localPeerConnection);
    })
    .catch(setSessionDescriptionError);
}

/// Helper Functions ///

/** getPeerName - Handles received peer name */
function getPeerName(peerConnection) {
  return peerConnection === localPeerConnection
    ? "localPeerConnection"
    : "remotePeerConnection";
}

/** gotRemoteMediaTrack - Handles received media track */
function gotRemoteMediaTrack(event) {
  remoteStream.addTrack(event.track);

  document.getElementById("video-stream").srcObject = remoteStream;
  document.getElementById("generate-stream-button").classList.add("is-hidden");
  document.getElementById("stop-stream-button").classList.remove("is-hidden");
}

/** receiveChannelCallback - Handles received channel callback */
const receiveChannelCallback = (event) => {
  const receiveChannel = event.channel;
  receiveChannel.onmessage = handleReceiveMessage;
};

/** setDescriptionSuccess - Handles received success description */
function setDescriptionSuccess(peerConnection, functionName) {}

/** setLocalDescriptionSuccess - Handles received local success description */
function setLocalDescriptionSuccess(peerConnection) {
  setDescriptionSuccess(peerConnection, "setLocalDescription");
  const generateStreamButton = document.getElementById(
    "generate-stream-button"
  );
  generateStreamButton.classList.remove("is-hidden");
  generateStreamButton.removeAttribute("disabled");
  generateStreamButton.click();
}

/** setRemoteDescriptionSuccess - Handles received remote success description */
function setRemoteDescriptionSuccess(peerConnection) {
  setDescriptionSuccess(peerConnection, "setRemoteDescription");
}

/** setSessionDescriptionError - Handles session description error */
function setSessionDescriptionError(error) {
  console.error(`Failed to create session description: ${error.toString()}.`);
}

/** handleLocalMediaStreamError - Handles media stream error */
function handleLocalMediaStreamError(error) {
  console.error(`navigator.getUserMedia error: ${error.toString()}.`);
}

/** handleReceiveMessage - Handles receiving message */
const handleReceiveMessage = (event) => {
  console.log(`Incoming DataChannel push: ${event.data}`);
};

/** handleConnectionChange - Handles connection change */
function handleConnectionChange(event) {
  if (event.target) {
    switch (event.target.iceConnectionState) {
      case "connected":
        const generateStreamButton = document.getElementById(
          "generate-stream-button"
        );
        generateStreamButton.classList.add("is-hidden");

        const stopStreamButton = document.getElementById("stop-stream-button");
        stopStreamButton.classList.remove("is-hidden");
        stopStreamButton.removeAttribute("disabled");
        return;
      case "disconnected":
        document.getElementById("video-stream").srcObject = null;
        initializeWebRTC();
        break;
      default:
        break;
    }

    const generateStreamButton = document.getElementById(
      "generate-stream-button"
    );
    generateStreamButton.classList.remove("is-hidden");
    generateStreamButton.removeAttribute("disabled");
    const stopStreamButton = document.getElementById("stop-stream-button");
    stopStreamButton.classList.add("is-hidden");
  }
}
