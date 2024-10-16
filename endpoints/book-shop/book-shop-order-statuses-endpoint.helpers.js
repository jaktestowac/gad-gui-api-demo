const { formatErrorResponse } = require("../../helpers/helpers");
const { logDebug } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND } = require("../../helpers/response.helpers");

function handleBookShopOrderStatuses(req, res, isAdmin) {
  const urlEnds = req.url.replace(/\/\/+/g, "/");
  if (req.method === "GET" && req.url.includes("/api/book-shop-order-statuses")) {
    return true;
  } else {
    logDebug("handleBookShopOrderStatuses: Not Found", { url: req.url, urlEnds });
    res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Not Found"));
  }
  return;
}

module.exports = {
  handleBookShopOrderStatuses,
};
