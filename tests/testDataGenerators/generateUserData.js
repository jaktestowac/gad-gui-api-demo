/* eslint-disable no-console */
const db = require("../../db/db-base-big.json");
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");
const { getRandomInt } = require("../../helpers/generators/random-data.generator");
const images = fs.readdirSync(path.join(__dirname, "../../public/data/users"));

const faceAvatars = images.filter((img) => img.includes("face_") && !img.includes("admin"));

const users = db.users;

const numberOfUsersToGenerate = 60;

function createUser(id, email, firstname, lastname, password, avatar) {
  let birthdate = faker.date.between({ from: "1950-01-01", to: "2000-01-01" });
  return {
    id,
    email,
    firstname,
    lastname,
    password,
    avatar,
    birthdate,
  };
}

console.log("-----------------------------------------------------------");

const generatedUsers = [];

for (let index = 0; index < numberOfUsersToGenerate; index++) {
  const gender = faker.person.sex();

  const firstname = faker.person.firstName(gender);
  const lastname = faker.person.lastName(gender);
  const email = faker.internet
    .email({ firstName: firstname, lastName: lastname, provider: "test.test.dev" })
    .toLowerCase();
  const pass = faker.internet.password({ length: 5 });

  const maxAttempts = 10;

  let user;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const faceAvatarsGender = faceAvatars.filter(
      (img) =>
        (gender.toLowerCase() === "male" && img.includes("_m")) ||
        (gender.toLowerCase() === "female" && img.includes("_f"))
    );
    const image = faceAvatarsGender[getRandomInt(0, faceAvatarsGender.length)];
    const imageName = image.split("/").pop();

    const foundUsers = users.filter((user) => user.avatar.includes(imageName));

    if (foundUsers.length === 0) {
      const avatar = `.\\data\\users\\${imageName}`;
      user = createUser(users.length, email, firstname, lastname, pass, avatar);
      break;
    } else {
      console.log("Found user with the same avatar: ", foundUsers.length, " Attempt: ", attempt + 1);
    }
  }
  if (user !== undefined) {
    generatedUsers.push(user);
    users.push(user);
  }
}

console.log("-----");
console.log(generatedUsers);
console.log("Generated: ", generatedUsers.length);
