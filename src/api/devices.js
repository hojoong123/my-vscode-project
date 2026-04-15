import client from "./client";

export const getDevices = () => client.get("/devices");
export const getDevice = (id) => client.get("/devices/" + id);
export const getBins = (deviceId) => client.get("/bins/" + deviceId);
export const resetBin = (binId) => client.post("/bins/" + binId + "/reset");
export const getLogs = () => client.get("/logs");
export const getErrors = () => client.get("/errors");
export const resolveBinError = (id) => client.post("/errors/bin/" + id + "/resolve");
export const resolveDeviceError = (id) => client.post("/errors/device/" + id + "/resolve");