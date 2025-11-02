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

  // POST /api/practice/download/docx - Generate a true .docx (OpenXML) file in-memory (no external libraries)
  if (req.url === "/api/practice/download/docx") {
    if (req.method !== "POST") {
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Method not allowed"));
    }

    const requestedFileName = req.headers["x-filename"] || req.headers["filename"] || "generated-document.docx";

    try {
      const requestData = req.body || {};
      const genType = requestData.type || "report";
      const generatorParams = {
        ...requestData,
        includeTimestamp: requestData.includeTimestamp !== false,
      };

      // Generate plain text content for the document body
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

      // Minimal functions to build an uncompressed ZIP (method 0) in-memory
      const crc32Table = (() => {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
          let c = i;
          for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          table[i] = c >>> 0;
        }
        return table;
      })();

      const crc32 = (buf) => {
        let crc = 0 ^ -1;
        for (let i = 0; i < buf.length; i++) {
          crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xff];
        }
        return (crc ^ -1) >>> 0;
      };

      const u16 = (n) => {
        const b = Buffer.allocUnsafe(2);
        b.writeUInt16LE(n & 0xffff, 0);
        return b;
      };
      const u32 = (n) => {
        const b = Buffer.allocUnsafe(4);
        b.writeUInt32LE(n >>> 0, 0);
        return b;
      };

      const files = [];
      const pushFile = (name, dataStr) => {
        const nameBuf = Buffer.from(name, "utf8");
        const dataBuf = Buffer.from(dataStr, "utf8");
        const crc = crc32(dataBuf);
        files.push({ nameBuf, dataBuf, crc, size: dataBuf.length });
      };

      // Build required OpenXML parts
      const now = new Date().toISOString();

      // Helper to escape XML special characters
      const escapeXml = (s = "") =>
        String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");

      pushFile(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>\n  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>\n</Types>`
      );

      pushFile(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n</Relationships>`
      );

      pushFile(
        "docProps/core.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <dc:title>${escapeXml(
          requestData.title || "Generated Document"
        )}</dc:title>\n  <dc:creator>${escapeXml(
          requestData.author || "GAD Generator"
        )}</dc:creator>\n  <cp:lastModifiedBy>${escapeXml(
          requestData.author || "GAD Generator"
        )}</cp:lastModifiedBy>\n  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>\n  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>\n</cp:coreProperties>`
      );

      pushFile(
        "docProps/app.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n  <Application>Microsoft Office Word</Application>\n  <DocSecurity>0</DocSecurity>\n  <ScaleCrop>false</ScaleCrop>\n  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Title</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>\n  <TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>${escapeXml(
          requestData.title || "Generated Document"
        )}</vt:lpstr></vt:vector></TitlesOfParts>\n</Properties>`
      );

      // Build a simple WordprocessingML document with paragraphs from bodyText
      const paragraphs = bodyText
        .split(/\r?\n\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      const wp = [];
      wp.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
      wp.push('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">');
      wp.push("<w:body>");
      paragraphs.forEach((p) => {
        // split lines within paragraph
        const lines = p.split(/\r?\n/).map((l) => escapeXml(l));
        wp.push("<w:p>");
        lines.forEach((line, idx) => {
          wp.push('<w:r><w:t xml:space="preserve">' + line + "</w:t></w:r>");
          if (idx < lines.length - 1) wp.push("<w:br/>");
        });
        wp.push("</w:p>");
      });
      wp.push('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>');
      wp.push("</w:body>");
      wp.push("</w:document>");

      pushFile("word/document.xml", wp.join("\n"));

      // Now assemble ZIP with local headers, central directory, and end record
      const parts = [];
      let offset = 0;
      const centralDir = [];

      files.forEach((f) => {
        const localHeader = Buffer.concat([
          Buffer.from([0x50, 0x4b, 0x03, 0x04]), // local file header signature
          u16(20), // version needed to extract
          u16(0), // gp bit flag
          u16(0), // compression method (0 = store)
          u16(0), // last mod time
          u16(0), // last mod date
          u32(f.crc),
          u32(f.size), // compressed size (stored)
          u32(f.size), // uncompressed size
          u16(f.nameBuf.length),
          u16(0), // extra length
        ]);

        parts.push(localHeader);
        parts.push(f.nameBuf);
        parts.push(f.dataBuf);

        const centralHeader = Buffer.concat([
          Buffer.from([0x50, 0x4b, 0x01, 0x02]), // central file header sig
          u16(0), // version made by
          u16(20), // version needed
          u16(0), // gp flag
          u16(0), // compression method
          u16(0), // mod time
          u16(0), // mod date
          u32(f.crc),
          u32(f.size),
          u32(f.size),
          u16(f.nameBuf.length),
          u16(0), // extra
          u16(0), // comment
          u16(0), // disk start
          u16(0), // internal attrs
          u32(0), // external attrs
          u32(offset),
        ]);

        centralDir.push(centralHeader);
        centralDir.push(f.nameBuf);

        // update offset: local header + name + data
        offset += localHeader.length + f.nameBuf.length + f.dataBuf.length;
      });

      const centralStart = offset;
      const centralBuf = Buffer.concat(centralDir);
      offset += centralBuf.length;

      const endRecord = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x05, 0x06]), // end of central dir sig
        u16(0), // disk number
        u16(0), // disk where cd starts
        u16(files.length),
        u16(files.length),
        u32(centralBuf.length),
        u32(centralStart),
        u16(0), // comment length
      ]);

      const zipBuffer = Buffer.concat([...parts, centralBuf, endRecord]);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename=${requestedFileName}`);
      return res.status(HTTP_OK).send(zipBuffer);
    } catch (error) {
      logDebug("handleSimpleDownload:docx error", { error: error.message });
      return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid request data"));
    }
  }

  return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Download endpoint not found"));
}

module.exports = {
  handleSimpleDownload,
};
