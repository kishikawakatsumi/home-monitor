"use strict";

import { getAccessToken, getProjectId } from "./auth";
import { initializeWebRTC, updateWebRTC, getOfferSDP } from "./webrtc";

let accessToken = getAccessToken();
let projectId = getProjectId();

class Device {
  constructor(id, type, name, structure, traits) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.structure = structure;
    this.traits = traits;
  }
}

let selectedDevice = new Device(
  "AVPHwEvwRHksnBhU3vgudAUX06VA7xdpZyYZZUseIVmdm38CnGhcqYx64_tm3q7EVHFFLZMhXUCx2sRy8jTIZ0mw9YWLX-Y",
  null,
  null,
  null,
  null
);
let streamExtensionToken = "";
let mediaSessionId = "";

const selectedAPI = "https://smartdevicemanagement.googleapis.com/v1";

/** deviceAccessRequest - Issues requests to Device Access Rest API */
function deviceAccessRequest(method, call, localpath, payload = "") {
  let xhr = new XMLHttpRequest();
  xhr.open(method, selectedAPI + localpath);
  xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

  xhr.onload = function () {
    if (xhr.status === 200) {
      deviceAccessResponse(method, call, xhr.response);
    }
  };

  if (method === "POST" && payload && payload !== "") {
    xhr.send(JSON.stringify(payload));
  } else {
    xhr.send();
  }
}

/** deviceAccessResponse - Parses responses from Device Access API calls */
function deviceAccessResponse(method, call, response) {
  let data = JSON.parse(response);
  // Check if response data is empty:
  if (!data) {
    return;
  }
  // Based on the original request call, interpret the response:
  switch (call) {
    case "listDevices":
      // clearDevices(); // Clear the previously detected devices.

      // Check for detected devices:
      if (!data.devices) {
        return;
      }

      // Iterate over detected devices:
      for (let i = 0; i < data.devices.length; i++) {
        // Parse Device Id:
        let scannedId = data.devices[i].name;
        let startIndexId = scannedId.lastIndexOf("/");
        let deviceId = scannedId.substring(startIndexId + 1);
        // Parse Device Type:
        let scannedType = data.devices[i].type;
        let startIndexType = scannedType.lastIndexOf(".");
        let deviceType = scannedType.substring(startIndexType + 1);
        // Parse Device Structure:
        let scannedAssignee = data.devices[i].assignee;
        let startIndexStructure = scannedAssignee.lastIndexOf("/structures/");
        let endIndexStructure = scannedAssignee.lastIndexOf("/rooms/");
        let deviceStructure = scannedAssignee.substring(
          startIndexStructure + 12,
          endIndexStructure
        );

        // Handle special case for Displays (Skip, no support!)
        if (deviceType === "DISPLAY") continue;

        // Handle special case for Thermostats (Read Temperature Unit)
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

        // Parse Device Room:
        let scannedName =
          data.devices[i].traits["sdm.devices.traits.Info"].customName;
        let scannedRelations = data.devices[i].parentRelations;
        let scannedRoom = scannedRelations[0]["displayName"];
        // Parse Device Name:
        let deviceName =
          scannedName !== ""
            ? scannedName
            : scannedRoom + " " + stringFormat(deviceType);
        // Parse Device Traits:
        let deviceTraits = Object.keys(data.devices[i].traits);

        // WebRTC check:
        let traitCameraLiveStream =
          data.devices[i].traits["sdm.devices.traits.CameraLiveStream"];

        if (traitCameraLiveStream) {
          let supportedProtocols = traitCameraLiveStream.supportedProtocols;
          if (supportedProtocols && supportedProtocols.includes("WEB_RTC")) {
            deviceType += "-webrtc";
            initializeWebRTC();
          }
        }

        // addDevice(
        // new Device(
        //   deviceId,
        //   deviceType,
        //   deviceName,
        //   deviceStructure,
        //   deviceTraits
        // )
        // );
        selectedDevice = new Device(
          deviceId,
          deviceType,
          deviceName,
          deviceStructure,
          deviceTraits
        );
      }
      break;
    case "listStructures":
      console.log("List Structures!");
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
      initializeWebRTC();
      break;
    case "fanMode":
      if (document.getElementById("btnFanMode").textContent === "Activate Fan")
        document.getElementById("btnFanMode").textContent = "Deactivate Fan";
      else document.getElementById("btnFanMode").textContent = "Activate Fan";
      break;
    case "thermostatMode":
      console.log("Thermostat Mode!");
      break;
    case "temperatureSetpoint":
      console.log("Temperature Setpoint!");
      break;
    default:
      break;
  }
}

/** openResourcePicker - Opens Resource Picker on a new browser tab */
function openResourcePicker() {
  window.open(selectedResourcePicker);
}

/// Device Access API ///

/** onListDevices - Issues a ListDevices request */
export function onListDevices() {
  let endpoint = "/enterprises/" + projectId + "/devices";
  deviceAccessRequest("GET", "listDevices", endpoint);
}

/** onListStructures - Issues a ListStructures request */
export function onListStructures() {
  let endpoint = "/enterprises/" + projectId + "/structures";
  deviceAccessRequest("GET", "listStructures", endpoint);
}

/** onFan - Issues a FanMode change request */
export function onFan() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  // Construct the payload:
  let payload = {
    command: "sdm.devices.commands.Fan.SetTimer",
    params: {},
  };
  // Set correct FanMode based on the current selection:
  switch (document.getElementById("btnFanMode").textContent) {
    case "Activate Fan":
      payload.params["timerMode"] = "ON";
      payload.params["duration"] = "3600s";
      break;
    case "Deactivate Fan":
      payload.params["timerMode"] = "OFF";
      break;
    default:
      return;
  }
  deviceAccessRequest("POST", "fanMode", endpoint, payload);
}

/** onThermostatMode - Issues a ThermostatMode request */
export function onThermostatMode() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let tempMode = document.getElementById("sctThermostatMode").value;
  let payload = {
    command: "sdm.devices.commands.ThermostatMode.SetMode",
    params: {
      mode: tempMode,
    },
  };
  deviceAccessRequest("POST", "thermostatMode", endpoint, payload);
}

/** onTemperatureSetpoint - Issues a TemperatureSetpoint request */
export function onTemperatureSetpoint() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let heatCelsius = parseFloat(
    document.getElementById("txtHeatTemperature").value
  );
  let coolCelsius = parseFloat(
    document.getElementById("txtCoolTemperature").value
  );
  // Convert temperature values based on temperature unit:
  if (document.getElementById("heatUnit").innerText === "°F") {
    heatCelsius = ((heatCelsius - 32) * 5) / 9;
  }
  if (document.getElementById("coolUnit").innerText === "°F") {
    coolCelsius = ((coolCelsius - 32) * 5) / 9;
  }
  // Construct the payload:
  let payload = {
    command: "",
    params: {},
  };
  // Set correct temperature fields based on the selected ThermostatMode:
  switch (document.getElementById("sctThermostatMode").value) {
    case "HEAT":
      payload.command =
        "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat";
      payload.params["heatCelsius"] = heatCelsius;
      break;
    case "COOL":
      payload.command =
        "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool";
      payload.params["coolCelsius"] = coolCelsius;
      break;
    case "HEATCOOL":
      payload.command =
        "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange";
      payload.params["heatCelsius"] = heatCelsius;
      payload.params["coolCelsius"] = coolCelsius;
      break;
    default:
      return;
  }
  deviceAccessRequest("POST", "temperatureSetpoint", endpoint, payload);
}

/** onGenerateStream - Issues a GenerateRtspStream request */
export function onGenerateStream() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let payload = {
    command: "sdm.devices.commands.CameraLiveStream.GenerateRtspStream",
  };
  deviceAccessRequest("POST", "generateStream", endpoint, payload);
}

/** onExtendStream - Issues a ExtendRtspStream request */
export function onExtendStream() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let payload = {
    command: "sdm.devices.commands.CameraLiveStream.ExtendRtspStream",
    params: {
      streamExtensionToken: streamExtensionToken,
    },
  };
  deviceAccessRequest("POST", "refreshStream", endpoint, payload);
}

/** onStopStream - Issues a StopRtspStream request */
function onStopStream() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let payload = {
    command: "sdm.devices.commands.CameraLiveStream.StopRtspStream",
    params: {
      streamExtensionToken: streamExtensionToken,
    },
  };
  deviceAccessRequest("POST", "stopStream", endpoint, payload);
}

/** onGenerateStream_WebRTC - Issues a GenerateWebRtcStream request */
export function onGenerateStream_WebRTC() {
  let offerSDP = getOfferSDP();
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let payload = {
    command: "sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream",
    params: {
      offer_sdp: offerSDP,
    },
  };

  deviceAccessRequest("POST", "generateStream", endpoint, payload);
}

/** onExtendStream_WebRTC - Issues a ExtendWebRtcStream request */
export function onExtendStream_WebRTC() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let payload = {
    command: "sdm.devices.commands.CameraLiveStream.ExtendWebRtcStream",
    params: {
      mediaSessionId: streamExtensionToken,
    },
  };
  deviceAccessRequest("POST", "refreshStream", endpoint, payload);
}

/** onStopStream_WebRTC - Issues a StopWebRtcStream request */
export function onStopStream_WebRTC() {
  let endpoint =
    "/enterprises/" +
    projectId +
    "/devices/" +
    selectedDevice.id +
    ":executeCommand";
  let payload = {
    command: "sdm.devices.commands.CameraLiveStream.StopWebRtcStream",
    params: {
      mediaSessionId,
    },
  };
  deviceAccessRequest("POST", "stopStream", endpoint, payload);
}
