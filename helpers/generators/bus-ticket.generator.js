const { randomNames, randomSurnames, randomCities } = require("./base.data");
const { RandomValueGeneratorWithSeed } = require("./random-data.generator");

const sampleBusTicketCard = {
  id: 1,
  ticketNumber: "TICKET-123",
  owner: {
    name: "John Doe",
    age: 30,
  },
  funds: 100,
  validUntil: "2023-10-20T14:35:00Z",
  status: 1,
  useHistory: [
    {
      date: "2023-10-20T14:35:00Z",
      from: "Springfield",
      to: "Rivertown",
      cost: 10,
      timeInMinutes: 30,
    },
    {
      date: "2023-10-21T14:35:00Z",
      from: "Rivertown",
      to: "Springfield",
      cost: 10,
      timeInMinutes: 30,
    },
  ],
};

function generateRandomSimpleBusTicketCard(totalRandom = false) {
  let dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());

  if (totalRandom === true) {
    dataGenerator = new RandomValueGeneratorWithSeed(Math.random().toString());
  }

  const card = { ...sampleBusTicketCard };

  card.id = dataGenerator.getNextValue(1, 1000);
  card.ticketNumber = `TICKET-${dataGenerator.getNextValue(1000, 9999)}`;
  const firstName = randomNames[dataGenerator.getNextValue(0, randomNames.length - 1)];
  const lastName = randomSurnames[dataGenerator.getNextValue(0, randomSurnames.length - 1)];
  card.owner.name = `${firstName} ${lastName}`;
  card.owner.age = dataGenerator.getNextValue(18, 70);
  card.funds = dataGenerator.getNextValue(50, 500);
  card.validUntil = new Date(Date.now() + dataGenerator.getNextValue(1, 30) * 24 * 60 * 60 * 1000).toISOString();
  card.status = dataGenerator.getNextValue(0, 4);

  const useHistory = [];
  const numberOfTrips = dataGenerator.getNextValue(1, 10);

  const tripsStartDate = new Date(Date.now() - dataGenerator.getNextValue(200, 5000) * 24 * 60 * 60 * 1000);

  let tripDate = tripsStartDate;
  for (let i = 0; i < numberOfTrips; i++) {
    const trip = {
      date: new Date(tripDate.getTime() + dataGenerator.getNextValue(1, 100) * 24 * 60 * 60 * 1000).toISOString(),
      from: randomCities[dataGenerator.getNextValue(0, randomCities.length - 1)],
      to: randomCities[dataGenerator.getNextValue(0, randomCities.length - 1)],
      cost: dataGenerator.getNextValue(5, 20),
      timeInMinutes: dataGenerator.getNextValue(20, 60),
    };
    useHistory.push(trip);
    tripDate = new Date(trip.date);
  }

  card.useHistory = useHistory;

  return card;
}

module.exports = {
  generateRandomSimpleBusTicketCard,
};
