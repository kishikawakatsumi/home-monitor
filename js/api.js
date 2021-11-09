"use strict";

import { sharedCredential, PROJECT_ID } from "./auth";
import { Device } from "./device";
import { initializeWebRTC, updateWebRTC, getOfferSDP } from "./webrtc";

const devices = [];
let selectedDevice = null;
let mediaSessionId = "";

function deviceAccessRequest(method, call, localpath, payload = "") {
  const credential = sharedCredential();
  console.log(credential);
  if (!credential.accessToken || !credential.refreshToken) {
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open(
    method,
    `https://smartdevicemanagement.googleapis.com/v1${localpath}`
  );
  xhr.setRequestHeader("Authorization", `Bearer ${credential.accessToken}`);
  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

  xhr.onload = function () {
    if (xhr.status === 200) {
      deviceAccessResponse(method, call, xhr.response);
    } else {
      console.error(xhr.responseText);
    }
  };

  if (method === "POST" && payload && payload !== "") {
    xhr.send(JSON.stringify(payload));
  } else {
    xhr.send();
  }
}

function deviceAccessResponse(method, call, response) {
  const data = JSON.parse(response);
  if (!data) {
    return;
  }

  switch (call) {
    case "listDevices":
      if (!data.devices) {
        return;
      }

      for (let i = 0; i < data.devices.length; i++) {
        const scannedId = data.devices[i].name;
        const startIndexId = scannedId.lastIndexOf("/");
        const deviceId = scannedId.substring(startIndexId + 1);

        const scannedType = data.devices[i].type;
        const startIndexType = scannedType.lastIndexOf(".");
        let deviceType = scannedType.substring(startIndexType + 1);

        const scannedAssignee = data.devices[i].assignee;
        const startIndexStructure = scannedAssignee.lastIndexOf("/structures/");
        const endIndexStructure = scannedAssignee.lastIndexOf("/rooms/");
        const deviceStructure = scannedAssignee.substring(
          startIndexStructure + 12,
          endIndexStructure
        );

        if (deviceType === "DISPLAY") {
          continue;
        }

        if (deviceType === "THERMOSTAT") {
          let tempScale =
            data.devices[i].traits["sdm.devices.traits.Settings"]
              .temperatureScale;
          if (tempScale === "FAHRENHEIT") {
            document.getElementById("heatUnit").innerText = "°F";
            document.getElementById("coolUnit").innerText = "°F";
          } else {
            document.getElementById("heatUnit").innerText = "°C";
            document.getElementById("coolUnit").innerText = "°C";
          }
        }

        let scannedName =
          data.devices[i].traits["sdm.devices.traits.Info"].customName;
        let scannedRelations = data.devices[i].parentRelations;
        let scannedRoom = scannedRelations[0]["displayName"];

        let deviceName =
          scannedName !== ""
            ? scannedName
            : scannedRoom + " " + stringFormat(deviceType);

        let deviceTraits = Object.keys(data.devices[i].traits);

        let traitCameraLiveStream =
          data.devices[i].traits["sdm.devices.traits.CameraLiveStream"];

        if (traitCameraLiveStream) {
          let supportedProtocols = traitCameraLiveStream.supportedProtocols;
          if (supportedProtocols && supportedProtocols.includes("WEB_RTC")) {
            deviceType += "-webrtc";
          }
        }

        addDevice(
          new Device(
            deviceId,
            deviceType,
            deviceName,
            deviceStructure,
            deviceTraits
          )
        );
      }

      selectedDevice = devices.find((device) => {
        if (device.type === "DOORBELL-webrtc") {
          return device;
        }
      });
      if (selectedDevice) {
        const dropdown = document.createElement("div");
        dropdown.classList.add("dropdown", "is-hoverable");

        const dropdownTrigger = document.createElement("div");
        dropdownTrigger.classList.add("dropdown-trigger");

        const button = document.createElement("button");
        button.classList.add("button", "is-warning", "is-light");
        button.setAttribute("aria-haspopup", "true");
        button.setAttribute("aria-controls", "dropdown-menu");

        const title = document.createElement("span");
        title.classList.add("title", "is-4");

        const value = document.createElement("span");
        value.textContent = selectedDevice.name;

        title.appendChild(value);
        button.appendChild(title);
        dropdownTrigger.appendChild(button);
        dropdown.appendChild(dropdownTrigger);

        const dropdownMenu = document.createElement("div");
        dropdownMenu.classList.add("dropdown-menu");
        dropdownMenu.setAttribute("id", "dropdown-menu");
        dropdownMenu.setAttribute("role", "menu");

        const dropdownContent = document.createElement("div");
        dropdownContent.classList.add("dropdown-content");

        const dropdownItemTypeTitle = document.createElement("div");
        dropdownItemTypeTitle.classList.add("dropdown-item");

        const dropdownItemType = document.createElement("div");
        dropdownItemType.classList.add("dropdown-item");

        const typeTitle = document.createElement("span");
        typeTitle.classList.add("has-text-grey", "is-size-7");
        typeTitle.textContent = "Type";
        dropdownItemTypeTitle.appendChild(typeTitle);

        const type = document.createElement("span");
        type.classList.add("is-size-6", "pl-4");
        type.textContent = selectedDevice.type;
        dropdownItemType.appendChild(type);

        const divider = document.createElement("hr");
        divider.classList.add("dropdown-divider");

        const dropdownItemTraitTitle = document.createElement("div");
        dropdownItemTraitTitle.classList.add("dropdown-item");

        const traitTitle = document.createElement("span");
        traitTitle.classList.add("has-text-grey", "is-size-7");
        traitTitle.textContent = "Trait";
        dropdownItemTraitTitle.appendChild(traitTitle);

        dropdownContent.appendChild(dropdownItemTypeTitle);
        dropdownContent.appendChild(dropdownItemType);
        dropdownContent.appendChild(divider);
        dropdownContent.appendChild(dropdownItemTraitTitle);

        for (const trait of selectedDevice.traits) {
          const dropdownItemTrait = document.createElement("div");
          dropdownItemTrait.classList.add("dropdown-item");

          const t = document.createElement("span");
          t.classList.add("is-size-6", "pl-4");
          t.textContent = trait;
          dropdownItemTrait.appendChild(t);

          dropdownContent.appendChild(dropdownItemTrait);
        }

        dropdown.appendChild(dropdownMenu);
        dropdownMenu.appendChild(dropdownContent);

        document.getElementById("device-values").appendChild(dropdown);

        initializeWebRTC();
      }

      break;
    case "listStructures":
      break;
    case "generateStream":
      console.log("Generate Stream!");
      if (data["results"] && data["results"].hasOwnProperty("mediaSessionId")) {
        mediaSessionId = data["results"].mediaSessionId;
      }
      if (data["results"] && data["results"].hasOwnProperty("answerSdp")) {
        updateWebRTC(data["results"].answerSdp);
      }
      break;
    case "refreshStream":
      console.log("Refresh Stream!");
      break;
    case "stopStream":
      console.log("Stop Stream!");
      break;
    case "fanMode":
      if (document.getElementById("btnFanMode").textContent === "Activate Fan")
        document.getElementById("btnFanMode").textContent = "Deactivate Fan";
      else document.getElementById("btnFanMode").textContent = "Activate Fan";
      break;
    case "thermostatMode":
      break;
    case "temperatureSetpoint":
      break;
    default:
      break;
  }
}

function addDevice(device) {
  devices.push(device);
}

export function onListDevices() {
  const endpoint = `/enterprises/${PROJECT_ID}/devices`;
  deviceAccessRequest("GET", "listDevices", endpoint);
}

export function onListStructures() {
  const endpoint = `/enterprises/${PROJECT_ID}/structures`;
  deviceAccessRequest("GET", "listStructures", endpoint);
}

export function onGenerateStream_WebRTC() {
  if (!selectedDevice) {
    return;
  }
  let offerSDP = getOfferSDP();
  if (!offerSDP.includes("a=recvonly")) {
    offerSDP = `${offerSDP}a=recvonly`;
  }

  const endpoint = `/enterprises/${PROJECT_ID}/devices/${selectedDevice.id}:executeCommand`;
  const payload = {
    command: "sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream",
    params: {
      offer_sdp: offerSDP,
    },
  };

  deviceAccessRequest("POST", "generateStream", endpoint, payload);
}

export function onStopStream_WebRTC() {
  if (!selectedDevice || !mediaSessionId) {
    return;
  }
  const endpoint = `/enterprises/${PROJECT_ID}/devices/${selectedDevice.id}:executeCommand`;
  const payload = {
    command: "sdm.devices.commands.CameraLiveStream.StopWebRtcStream",
    params: {
      mediaSessionId,
    },
  };
  deviceAccessRequest("POST", "stopStream", endpoint, payload);
}
