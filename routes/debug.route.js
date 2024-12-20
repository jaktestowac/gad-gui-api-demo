const { logDebug } = require("../helpers/logger-api");

const exitRoutes = (req, res) => {
  logDebug("Shutting down the 🦎 GAD service... Bye bye!");
  res.status(200).json({ message: "Shutting down the 🦎 GAD service... Bye bye!" });
  process.exit(0);
};

const restartRoutes = (req, res) => {
  logDebug("Restarting the 🦎 GAD service... (lets hope that pm2 is running!)");
  res.status(200).json({ message: "Restarting the 🦎 GAD service... (lets hope that pm2 is running!)" });
  process.exit(0);
};

exports.exitRoutes = exitRoutes;
exports.restartRoutes = restartRoutes;
