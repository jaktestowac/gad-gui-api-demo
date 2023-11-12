function formatFileName(userId, currentFilePerUser, isPublic) {
  let fileType = isPublic ? "P" : "R";

  const fileName = `uploaded-article_${userId}_${currentFilePerUser}_${fileType}.json`;
  return fileName;
}

function checkFileName(fileName, userId, isPublic) {
  let fileType = isPublic ? "P" : "R";

  const parts = fileName.split("_");
  const actualUserID = parts[1];
  const actualFileType = parts[3];

  return actualUserID === userId && actualFileType === fileType;
}

module.exports = { formatFileName, checkFileName };
