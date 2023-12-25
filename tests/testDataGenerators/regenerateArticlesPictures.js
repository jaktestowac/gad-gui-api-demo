/* eslint-disable no-console */
const db = require("../../db/db-base-big.json");
const fs = require("fs");
const path = require("path");
const { getRandomInt } = require("../../helpers/helpers");
const images = fs.readdirSync(path.join(__dirname, "../../public/data/images/256"));

const articles = db.articles;

articles.forEach((articles) => {
  articles.image = `.\\data\\images\\256\\${images[getRandomInt(0, images.length)]}`;
});

console.log(JSON.stringify(articles));
