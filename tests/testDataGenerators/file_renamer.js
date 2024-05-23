const fs = require("fs");
const path = require("path");

const directoryPath = "public\\data\\users\\temp\\m";

try {
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    const oldFilePath = path.join(directoryPath, file);
    const directoryName = path.basename(directoryPath);
    const fileExtension = path.extname(file);
    const oldFileName = path.basename(file, fileExtension);

    let newFileName = oldFileName;
    if (!oldFileName.includes("face_")) {
      newFileName = `face_${newFileName}`;
    }

    newFileName = `${newFileName}_${directoryName}`;

    if (newFileName !== oldFileName) {
      if (!newFileName.includes(".jpg")) {
        newFileName = `${newFileName}.jpg`;
      }
      const newFilePath = path.join(directoryPath, newFileName);
      //   newFileName = `${newFileName}${fileExtension}`;
      fs.renameSync(oldFilePath, newFilePath);
      console.log(`File ${file} renamed to ${newFileName}`);
    }
  });
} catch (err) {
  console.error("Error reading or renaming files:", err);
}
