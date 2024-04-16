/* eslint-disable no-console */
const db = require("../../db/db-base-v2.json");
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");
const { getRandomInt } = require("../../helpers/generators/random-data.generator");
const images = fs.readdirSync(path.join(__dirname, "../../public/data/users"));

const faceAvatars = images.filter((img) => img.includes("face_") && !img.includes("admin"));

const users = db.users;

const numberOfUsersToGenerate = 2;

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
  const gender = faker.person.sex();

  const firstname = faker.person.firstName(gender);
  const lastname = faker.person.lastName(gender);
  const email = faker.internet.email({ firstName: firstname, lastName: lastname, provider: "test.test.dev" });
  const pass = faker.internet.password({ length: 5 });

  const maxAttempts = 10;

  let user;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const faceAvatarsGender = faceAvatars.filter(
      (img) =>
        (gender.toLowerCase() === "male" && img.includes("_m")) ||
        (gender.toLowerCase() === "female" && img.includes("_f"))
    );
    console.log(gender);
    const image = faceAvatarsGender[getRandomInt(0, faceAvatarsGender.length)];
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
