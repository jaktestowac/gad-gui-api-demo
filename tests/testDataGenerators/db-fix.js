const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../../db/db-base-interview.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const existingArticleIds = db.articles.map((article) => article.id);

const beforeCount = db.comments.length;
db.comments = db.comments.filter((comment) => existingArticleIds.includes(comment.article_id));
const afterCount = db.comments.length;

console.log(`Comments before: ${beforeCount}`);
console.log(`Comments after: ${afterCount}`);
console.log(`Removed ${beforeCount - afterCount} comments`);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log("Database cleaned successfully!");
