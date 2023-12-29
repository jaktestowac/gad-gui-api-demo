/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { getRandomInt } = require("../../helpers/helpers");
const images = fs.readdirSync(path.join(__dirname, "../../public/data/images/256"));
const dbPath = `./db/db-base-big.json`;

const db = JSON.parse(fs.readFileSync(dbPath));
const articles = db.articles
images.filter((img) => img.toLowerCase().includes(".jpg"));

articles.forEach((articles) => {
  if (articles.image === undefined) {
    articles.image = `.\\data\\images\\256\\${images[getRandomInt(0, images.length)]}`;
  }
});

db["articles"] = articles;
fs.writeFileSync(dbPath, JSON.stringify(db));
