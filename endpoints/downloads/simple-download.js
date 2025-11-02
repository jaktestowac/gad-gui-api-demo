const { logDebug } = require("../../helpers/logger-api");
const { HTTP_NOT_FOUND, HTTP_OK, HTTP_BAD_REQUEST } = require("../../helpers/response.helpers");
const { FileContentGenerator } = require("./file-content-generator");
const { formatErrorResponse } = require("../../helpers/helpers");

function handleSimpleDownload(req, res) {
  // GET /api/practice/download/path/{filename} - Download by filename in URL path
  if (req.url.includes("/api/practice/download/path/")) {
    if (req.method !== "GET") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Method not allowed"));
    }

    const fileName = req.url.split("/api/practice/download/path/")[1];

    if (!fileName) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Filename required in path"));
    }

    // Security check - only allow txt files for demo
    if (!fileName.endsWith(".txt")) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Only .txt files are allowed"));
    }

    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "data", fileName);

    try {
      const fileContent = fs.readFileSync(filePath);
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      return res.status(HTTP_OK).send(fileContent);
    } catch (error) {
      logDebug("handleSimpleDownload:path download error", { error: error.message, fileName });
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("File not found"));
    }
  }

  // POST /api/practice/download/header - Download with filename specified in header
  if (req.url === "/api/practice/download/header") {
    if (req.method !== "POST") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Method not allowed"));
    }

    const requestedFileName = req.headers["x-filename"] || req.headers["filename"];

    if (!requestedFileName) {
      return res
        .status(HTTP_BAD_REQUEST)
        .send(formatErrorResponse("Filename header required (x-filename or filename)"));
    }

    // Security check - only allow txt files for demo
    if (!requestedFileName.endsWith(".txt")) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Only .txt files are allowed"));
    }

    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "data", requestedFileName);

    try {
      const fileContent = fs.readFileSync(filePath);
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename=${requestedFileName}`);
      return res.status(HTTP_OK).send(fileContent);
    } catch (error) {
      logDebug("handleSimpleDownload:header download error", { error: error.message, requestedFileName });
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("File not found"));
    }
  }

  // GET /api/practice/download/query?file={filename} - Download by filename in query parameter
  if (req.url.startsWith("/api/practice/download/query")) {
    if (req.method !== "GET") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Method not allowed"));
    }

    const url = require("url");
    const queryObject = url.parse(req.url, true).query;
    const requestedFileName = queryObject.file || queryObject.filename;

    if (!requestedFileName) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Query parameter 'file' or 'filename' required"));
    }

    // Security check - only allow txt files for demo
    if (!requestedFileName.endsWith(".txt")) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Only .txt files are allowed"));
    }

    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "data", requestedFileName);

    try {
      const fileContent = fs.readFileSync(filePath);
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename=${requestedFileName}`);
      return res.status(HTTP_OK).send(fileContent);
    } catch (error) {
      logDebug("handleSimpleDownload:query download error", { error: error.message, requestedFileName });
      return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("File not found"));
    }
  }

  // POST /api/practice/download/generate - Generate and download file from request body
  if (req.url === "/api/practice/download/generate") {
    if (req.method !== "POST") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Method not allowed"));
    }

    const contentType = req.headers["content-type"] || "";
    const requestedFileName = req.headers["x-filename"] || req.headers["filename"] || "generated-file.txt";

    if (!contentType.includes("application/json")) {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Content-Type must be application/json"));
    }

    try {
      const requestData = req.body;

      if (!requestData) {
        return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Request body required"));
      }

      // Use FileContentGenerator to create content
      const genType = requestData.type || "text";
      const generatorParams = {
        ...requestData,
        includeTimestamp: requestData.includeTimestamp !== false, // default to true
      };

      const fileContent = FileContentGenerator.generate(genType, generatorParams);

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename=${requestedFileName}`);
      return res.status(HTTP_OK).send(fileContent);
    } catch (error) {
      logDebug("handleSimpleDownload:generate error", { error: error.message });
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid request data"));
    }
  }

  // POST /api/practice/download/doc - Generate a Word-compatible HTML document (.doc)
  if (req.url === "/api/practice/download/doc") {
    if (req.method !== "POST") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Method not allowed"));
    }

    const requestedFileName = req.headers["x-filename"] || req.headers["filename"] || "generated-document.doc";

    try {
      const requestData = req.body || {};
      const genType = requestData.type || "report";
      const generatorParams = {
        ...requestData,
        includeTimestamp: requestData.includeTimestamp !== false,
      };

      // Prefer report or text content for docs
      let bodyText;
      if (genType === "report") {
        bodyText = FileContentGenerator.generateReportContent(generatorParams);
      } else if (genType === "json") {
        bodyText = FileContentGenerator.generateJsonContent(generatorParams);
      } else if (genType === "csv") {
        bodyText = FileContentGenerator.generateCsvContent(generatorParams);
      } else {
        bodyText = FileContentGenerator.generateTextContent(generatorParams);
      }

      // Wrap plain text in simple HTML so Word can open it
      const escapeHtml = (s = "") =>
        String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
        requestedFileName
      )}</title></head><body><pre style="font-family:Segoe UI,Calibri,Arial;white-space:pre-wrap;">${escapeHtml(
        bodyText
      )}</pre></body></html>`;

      res.setHeader("Content-Type", "application/msword; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=${requestedFileName}`);
      return res.status(HTTP_OK).send(html);
    } catch (error) {
      logDebug("handleSimpleDownload:doc error", { error: error.message });
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid request data"));
    }
  }

  // POST /api/practice/download/xlsx - Generate Excel-friendly content (HTML table or CSV) that Excel can open and be saved as .xlsx
  if (req.url === "/api/practice/download/xlsx") {
    if (req.method !== "POST") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Method not allowed"));
    }

    const requestedFileName = req.headers["x-filename"] || req.headers["filename"] || "generated-spreadsheet.xlsx";

    try {
      const requestData = req.body || {};
      const genType = requestData.type || "user-data"; // default CSV type
      const generatorParams = {
        ...requestData,
      };

      // If CSV requested or generator provides CSV, use it. Otherwise try to create table from JSON
      let csvContent = "";
      if (genType === "csv" || genType === "user-data" || genType === "sales" || genType === "inventory") {
        csvContent = FileContentGenerator.generateCsvContent({ type: genType, rows: requestData.rows || 10 });
      } else if (genType === "json" || genType === "api-response" || genType === "product-catalog") {
        // Generate JSON and then convert to simple table (take first array found)
        const jsonText = FileContentGenerator.generateJsonContent({
          structure: requestData.structure || "api-response",
          count: requestData.count || 5,
        });
        try {
          const parsed = JSON.parse(jsonText);
          // Attempt to find an array inside parsed.data or parsed.data.products or parsed.data.users
          const arr =
            parsed?.data?.products ||
            parsed?.data?.users ||
            parsed?.data?.recentActivity ||
            (Array.isArray(parsed?.data) && parsed.data) ||
            null;
          if (Array.isArray(arr) && arr.length > 0) {
            const keys = Object.keys(arr[0]);
            const rows = [keys.join(",")];
            arr.forEach((r) => {
              rows.push(
                keys
                  .map((k) =>
                    String(r[k] ?? "")
                      .replace(/\n/g, " ")
                      .replace(/\r/g, " ")
                  )
                  .join(",")
              );
            });
            csvContent = rows.join("\n");
          } else {
            // fallback to putting the whole JSON into one cell
            csvContent = `data\n"""${jsonText.replace(/"/g, '""')}"""`;
          }
        } catch (e) {
          csvContent = `data\n"""${jsonText.replace(/"/g, '""')}"""`;
        }
      } else {
        // Other types -> generate default text and put in one cell
        const text = FileContentGenerator.generateDefaultContent(generatorParams);
        csvContent = `content\n"""${text.replace(/"/g, '""')}"""`;
      }

      // Build simple HTML table around CSV for better Excel compatibility
      const rows = csvContent.split(/\r?\n/).filter((r) => r.length > 0);
      const tableRows = rows.map((r) => {
        const cells = r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, ""));
        return `<tr>${cells.map((c) => `<td>${c.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</td>`).join("")}</tr>`;
      });

      const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table border="1">${tableRows.join(
        "\n"
      )}</table></body></html>`;

      // Use excel content type for HTML-based spreadsheets
      res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=${requestedFileName}`);
      return res.status(HTTP_OK).send(html);
    } catch (error) {
      logDebug("handleSimpleDownload:xlsx error", { error: error.message });
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid request data"));
    }
  }

  return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Download endpoint not found"));
}

module.exports = {
  handleSimpleDownload,
};
