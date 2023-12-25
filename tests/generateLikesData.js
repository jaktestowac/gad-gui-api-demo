/* eslint-disable no-console */
const db = require("../db/db-base.json");
const { faker } = require("@faker-js/faker");
const { getGaussianRandomInt, getRandomInt } = require("../helpers/helpers");

const articles = db.articles;
const users = db.users;
const comments = db.comments;
const likes = db.likes;

// check likes:
const duplicatedLikes = [];
likes.forEach((like) => {
  const foundLikes = likes.filter(
    (l) =>
      `${l.user_id}` === `${like.user_id}` && `${l.article_id}` === `${like.article_id}` && `${l.id}` !== `${like.id}`
  );
  if (foundLikes.length > 0) {
    duplicatedLikes.push(foundLikes);
    duplicatedLikes.push(like);
  }
});

if (duplicatedLikes.length > 0) {
  console.log("duplicatedLikes:", duplicatedLikes);
}

const baseLength = likes.length;
console.log("-----------------------------------------------------------");
const numberOfLikesToGenerate = 50;
const generatedLikes = [];
for (let index = 0; index < numberOfLikesToGenerate; index++) {
  let attempt = 0;
  let attemptsMax = 10;
  let wasAdded = false;
  do {
    const user_id = getRandomInt(1, users.length);
    const article_id = getGaussianRandomInt(1, articles.length, 2);
    const date = `${faker.date.between({ from: "2011-01-01", to: "2022-10-05" }).toISOString()}`.split(".")[0] + "Z";

    const foundLikes = likes.filter(
      (like) => `${like.article_id}` === `${article_id}` && `${like.user_id}` === `${user_id}`
    );

    if (foundLikes.length === 0) {
      const newLike = {
        user_id,
        article_id,
        date,
        id: baseLength + index,
      };
      generatedLikes.push(newLike);
      likes.push(newLike);
      wasAdded = true;
    } else {
      attempt++;
    }
  } while (!wasAdded && attempt < attemptsMax);
}

console.log(generatedLikes);
