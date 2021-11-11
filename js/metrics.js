"use strict";

import { sharedCredential } from "./auth";

const endpoint = "https://home.kishikawakatsumi.workers.dev";

export function startReceivingMetrics() {
  const credential = sharedCredential();
  if (!credential.accessToken || !credential.refreshToken) {
    return;
  }
  const metrics = async () => {
    try {
      const co2 = await fetchCO2();
      const temperature = await fetchTemparature();
      const power = await fetchPower();
      const humidity = await fetchHumidity();

      document.getElementById("co2-value").innerHTML = co2.toFixed(0);
      document.getElementById("temperature-value").innerHTML =
        temperature.toFixed(1);
      document.getElementById("power-value").innerHTML = power.toFixed(0);
      document.getElementById("humidity-value").innerHTML = humidity.toFixed(0);
    } catch {}
  };
  metrics();

  setInterval(metrics, 20_000);
}

async function fetchCO2() {
  const response = await fetch(`${endpoint}/co2`);
  return (await response.json())["tsdbLatest"]["3PDMmFz2CKs"][
    "custom.OfficeEnv.co2"
  ]["value"];
}

async function fetchTemparature() {
  const response = await fetch(`${endpoint}/temperature`);
  return (await response.json())["tsdbLatest"]["3PDMmFz2CKs"][
    "custom.OfficeEnv.temp"
  ]["value"];
}

async function fetchPower() {
  const response = await fetch(`${endpoint}/power`);
  return (await response.json())["tsdbLatest"]["3PDMmFz2CKs"][
    "custom.Home.power"
  ]["value"];
}

async function fetchHumidity() {
  const response = await fetch(`${endpoint}/humidity`);
  return (await response.json())["tsdbLatest"]["3PDMmFz2CKs"][
    "custom.OfficeEnv.humidity"
  ]["value"];
}
