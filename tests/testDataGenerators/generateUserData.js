/* eslint-disable no-console */
const db = require("../../db/db-base-big.json");
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");
const { getRandomInt } = require("../../helpers/helpers");
const images = fs.readdirSync(path.join(__dirname, "../../public/data/users"));

const faceAvatars = images.filter((img) => img.includes("face_") && !img.includes("admin"));

const users = db.users;

const numberOfUsersToGenerate = 50;

function createUser(id, email, firstname, lastname, password, avatar) {
  return {
    id,
    email,
    firstname,
    lastname,
    password,
    avatar,
  };
}

const baseLength = users.length;
console.log("-----------------------------------------------------------");

const generatedUsers = [];

for (let index = 0; index < numberOfUsersToGenerate; index++) {
  const firstname = faker.person.firstName();
  const lastname = faker.person.lastName();
  const email = faker.internet.email({ firstName: firstname, lastName: lastname, provider: "test.test.dev" });
  const pass = faker.internet.password({ length: 5 });

  const maxAttempts = 10;

  let user;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const image = faceAvatars[getRandomInt(0, faceAvatars.length)];
    const imageName = image.split("/").pop();

    const foundUsers = users.filter((user) => user.avatar.includes(imageName));

    if (foundUsers.length === 0) {
      const avatar = `.\\data\\users\\${imageName}`;
      user = createUser(baseLength + index, email, firstname, lastname, pass, avatar);
      break;
    }
  }
  if (user !== undefined) {
    generatedUsers.push(user);
    users.push(user);
  }
}

console.log("Generated: ", generatedUsers.length);
console.log("-----");
console.log(generatedUsers);
