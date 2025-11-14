const axios = require("axios");
const { SWIFT_URL } = require("../config/swiftConfig");

const checkClusterHealth = async (req, res) => {
  try {
    const { token, project } = req;
    const storageUrl = `${SWIFT_URL}/AUTH_${project.id}`;

    const proxyUrl = `${SWIFT_URL.replace(/\/v1$/, "")}/healthcheck`;
    const proxyHealth = await axios.get(proxyUrl, { timeout: 5000 });

    const statsResponse = await axios.head(storageUrl, {
      headers: { "X-Auth-Token": token },
    });

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        proxy: {
          status: proxyHealth.status === 200 ? "online" : "offline",
          healthy: true,
        },
        storage: {
          containers: parseInt(statsResponse.headers["x-account-container-count"]) || 0,
          objects: parseInt(statsResponse.headers["x-account-object-count"]) || 0,
          bytesUsed: parseInt(statsResponse.headers["x-account-bytes-used"]) || 0,
          bytesUsedGB: (
            (parseInt(statsResponse.headers["x-account-bytes-used"]) || 0) /
            1024 ** 3
          ).toFixed(2),
        },
        health: "healthy",
      },
    });
  } catch (error) {
    console.error("Error checking cluster health:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check cluster health",
      error: error.message,
    });
  }
};

const getClusterOverview = async (req, res) => {
  try {
    const { token, project } = req;
    const storageUrl = `${SWIFT_URL}/AUTH_${project.id}`;

    // Proxy check
    const proxyUrl = `${SWIFT_URL.replace(/\/v1$/, "")}/healthcheck`;
    const proxyHealth = await axios
      .get(proxyUrl, { timeout: 3000 })
      .then(() => "online")
      .catch(() => "offline");

    // Storage stats
    const statsResponse = await axios.head(storageUrl, {
      headers: { "X-Auth-Token": token },
    });

    // Recent containers
    const containersResponse = await axios.get(`${storageUrl}?format=json`, {
      headers: { "X-Auth-Token": token },
    });

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        cluster: {
          health: proxyHealth === "online" ? "healthy" : "unhealthy",
          proxyStatus: proxyHealth,
        },
        storage: {
          containers: parseInt(statsResponse.headers["x-account-container-count"]) || 0,
          objects: parseInt(statsResponse.headers["x-account-object-count"]) || 0,
          bytesUsed: parseInt(statsResponse.headers["x-account-bytes-used"]) || 0,
          bytesUsedGB: (
            (parseInt(statsResponse.headers["x-account-bytes-used"]) || 0) /
            1024 ** 3
          ).toFixed(2),
        },
        recentContainers: containersResponse.data.slice(0, 5).map((c) => ({
          name: c.name,
          objects: c.count,
          sizeGB: (c.bytes / 1024 ** 3).toFixed(2),
        })),
      },
    });
  } catch (error) {
    console.error("Error getting cluster overview:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get cluster overview",
      error: error.message,
    });
  }
};

module.exports = { checkClusterHealth, getClusterOverview };
