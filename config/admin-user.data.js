const { getConfigValue } = require("./config-manager");
const { ConfigKeys } = require("./enums");

const ADMIN_USER = {
  email: getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL),
  firstname: getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL),
  lastname: "",
  id: getConfigValue(ConfigKeys.SUPER_ADMIN_USER_EMAIL),
  avatar: ".\\data\\users\\face_admin.png",
};

module.exports = {
  ADMIN_USER,
};
