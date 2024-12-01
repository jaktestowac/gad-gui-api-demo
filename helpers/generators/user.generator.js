const {
  randomNames,
  randomSurnames,
  randomCities,
  randomCountries,
  randomStreets,
  randomEmailProviders,
} = require("./base.data");
const { RandomValueGeneratorWithSeed } = require("./random-data.generator");

const sampleUser = {
  userId: "U1001",
  username: "johndoe123",
  firstName: "John",
  lastName: "Doe",
  email: "johndoe@test.test.com",
  phone: "+1-555-0101",
  dateOfBirth: "1990-05-15",
  profilePicture: "profile.jpg",
  address: {
    street: "123 Elm Street",
    city: "Springfield",
    postalCode: "62701",
    country: "USA",
  },
  lastLogin: "2023-10-20T14:35:00Z",
  accountCreated: "2020-01-10T09:15:00Z",
  status: 1,
};

const randomPhoneCodes = ["555", "666", "777", "888", "999"];

const randomProfilePictures = [
  "1bd4391b-e7a0-49ed-8fb8-38fc73f76fa3.jpg",
  "83d80aca-da5a-4582-88d6-34a42574a9fe.jpg",
  "f3f59567-3b8c-481f-851a-0f03bfb3fa4c.jpg",
  "facca2a3-2ca9-4fc6-8a21-28214c0a2bd7.jpg",
  "f32f7c94-942b-420c-8d94-6f0cfde242ca.jpg",
  "20341d8f-9fae-4906-8f70-1e8e8949e3a4.jpg",
  "65ea94cb-ec8c-407e-8a2f-2861c5e057e1.jpg",
  "7a1bf608-915b-4ad2-8972-468d605db110.jpg",
  "1cfe385c-571f-4047-a717-3df0f4031590.jpg",
  "1cdb7c69-dfe6-45c5-9c0e-e3a15c5789ba.jpg",
  "6d4598e5-9778-4e9d-8a96-dd1a625b9f0a.jpg",
];

const possibleStatuses = {
  0: "inactive",
  1: "active",
  2: "banned",
  3: "deleted",
  4: "suspended",
};

function generateRandomUser(totalRandom = false) {
  let dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());

  if (totalRandom === true) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const user = { ...sampleUser };

  user.userId = "U" + dataGenerator.getNextValue(1000, 9999);
  user.firstName = randomNames[dataGenerator.getNextValue(0, randomNames.length - 1)];
  user.lastName = randomSurnames[dataGenerator.getNextValue(0, randomSurnames.length - 1)];
  user.username = user.firstName.toLowerCase() + user.lastName.toLowerCase() + dataGenerator.getNextValue(100, 999);
  user.email =
    user.username + "@" + randomEmailProviders[dataGenerator.getNextValue(0, randomEmailProviders.length - 1)];
  user.phone =
    "+845-" +
    randomPhoneCodes[dataGenerator.getNextValue(0, randomPhoneCodes.length - 1)] +
    "-" +
    dataGenerator.getNextValue(100, 999) +
    "-" +
    dataGenerator.getNextValue(1000, 9999);
  user.dateOfBirth = new Date(
    dataGenerator.getNextValue(1950, 2000),
    dataGenerator.getNextValue(0, 11),
    dataGenerator.getNextValue(1, 28)
  ).toISOString();

  user.profilePicture = randomProfilePictures[dataGenerator.getNextValue(0, randomProfilePictures.length - 1)];
  user.address.street =
    dataGenerator.getNextValue(100, 999) + " " + randomStreets[dataGenerator.getNextValue(0, randomStreets.length - 1)];
  user.address.city = randomCities[dataGenerator.getNextValue(0, randomCities.length - 1)];
  user.address.postalCode = dataGenerator.getNextValue(10000, 99999);
  user.address.country = randomCountries[dataGenerator.getNextValue(0, randomCountries.length - 1)];
  user.lastLogin = new Date(
    dataGenerator.getNextValue(2019, 2023),
    dataGenerator.getNextValue(0, 11),
    dataGenerator.getNextValue(1, 28)
  ).toISOString();
  user.accountCreated = new Date(
    dataGenerator.getNextValue(2019, 2023),
    dataGenerator.getNextValue(0, 11),
    dataGenerator.getNextValue(1, 28)
  ).toISOString();
  user.status = dataGenerator.getNextValue(0, 4);

  return user;
}

module.exports = {
  generateRandomUser,
};
