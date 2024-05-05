/* eslint-disable no-console */
const fs = require("fs");
const dbPath = `./db/db-base-v2.json`;
const { faker } = require("@faker-js/faker");

const db = JSON.parse(fs.readFileSync(dbPath));
const users = db.users;
const comments = db.comments;
const articles = db.articles;

for (let user of users) {
  // Find the oldest creation date among articles and comments
  let oldestDate = faker.date.between({ from: "2010-01-01", to: "2020-12-12" });
  let birthdate = faker.date.between({ from: "1950-01-01", to: "2000-01-01" });
  for (const article of articles) {
    if (article.user_id === user.id) {
      const articleDate = new Date(article.date);
      if (articleDate < oldestDate) {
        oldestDate = articleDate;
      }
    }
  }
  for (const comment of comments) {
    if (comment.user_id === user.id) {
      const commentDate = new Date(comment.date);
      if (commentDate < oldestDate) {
        oldestDate = commentDate;
      }
    }
  }

  user.creationDate = new Date(oldestDate.setDate(oldestDate.getDate() - 5)).toISOString();
  user.birthdate = birthdate.toISOString();
}

db["users"] = users;
fs.writeFileSync(dbPath, JSON.stringify(db));
