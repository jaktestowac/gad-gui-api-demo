/* eslint-disable no-console */
const { faker } = require("@faker-js/faker");
const db = require("../../db/db-base.json");
const fs = require("fs");
const path = require("path");

const articles = db.articles;
const users = db.users;
const comments = db.comments;

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
};

const images = fs.readdirSync(path.join(__dirname, "../public/data/images/256"));

for (let i = 1; i < 20; i++) {
  let article = {
    id: articles.length + i,
    title: faker.lorem.sentence(),
    body: faker.lorem.sentences(3),
    user_id: getRandomInt(1, users.length - 1),
    date: `${faker.date.between("2011-01-01", "2022-10-05").toISOString()}`.split(".")[0] + "Z",
    image: ".\\data\\images\\256\\" + images[getRandomInt(0, images.length)],
  };
  console.log(JSON.stringify(article) + ",");
}

console.log("=============================================");

for (let i = 1; i < 20; i++) {
  let comment = {
    id: comments.length + i,
    article_id: getRandomInt(1, articles.length - 1),
    user_id: getRandomInt(1, users.length - 1),
    body: faker.lorem.sentences(1),
    date: `${faker.date.between("2012-01-01", "2022-10-05").toISOString()}`.split(".")[0] + "Z",
  };
  console.log(JSON.stringify(comment) + ",");
}
