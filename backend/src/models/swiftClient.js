import axios from "axios";
import { SWIFT_CONFIG } from "../config/swiftConfig.js";

let authToken = null;
let storageUrl = null;

// Xác thực với Swift
export async function authenticate() {
  const response = await axios.get(SWIFT_CONFIG.authUrl, {
    headers: {
      "X-Auth-User": SWIFT_CONFIG.user,
      "X-Auth-Key": SWIFT_CONFIG.key,
    },
  });

  authToken = response.headers["x-auth-token"];
  storageUrl = response.headers["x-storage-url"];

  return { authToken, storageUrl };
}

// Helper để gọi Swift API
export async function swiftRequest(method, endpoint = "", data = null) {
  if (!authToken || !storageUrl) await authenticate();

  const url = `${storageUrl}${endpoint}`;
  const config = {
    method,
    url,
    headers: { "X-Auth-Token": authToken },
    data,
  };

  return axios(config);
}
