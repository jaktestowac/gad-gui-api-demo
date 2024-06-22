const { isDateInFuture } = require("../../../helpers/validation.helpers.js");
const { expect } = require("../../config.js");
const { gracefulQuit, getCurrentDate, addOffsetToDateString } = require("../../helpers/helpers.js");

describe("validation helpers", async () => {
  after(() => {
    gracefulQuit();
  });
  // 2024-06-02T11:01:41+02:00
  describe("isDateInFuture", async () => {
    [
      ["2020-12-12T12:12:12Z", false],
      ["2040-12-12T12:12:12Z", true],
      [addOffsetToDateString(new Date().toISOString(), "-11:00"), true],
      [addOffsetToDateString(new Date().toISOString(), "-04:00"), true],
      [addOffsetToDateString(new Date().toISOString(), "-02:00"), true],
      [addOffsetToDateString(new Date().toISOString(), "+02:00"), false],
      [addOffsetToDateString(new Date().toISOString(), "+04:00"), false],
      [addOffsetToDateString(new Date().toISOString(), "+11:00"), false],
      [addOffsetToDateString(getCurrentDate(1, 0, 0), "-02:00"), true],
    ].forEach((inputDateStringPairs) => {
      it(`check date - ${inputDateStringPairs[0]} - in future - ${inputDateStringPairs[1]}`, async () => {
        // Arrange:
        const inputDateString = inputDateStringPairs[0];

        // Act:
        const result = isDateInFuture(inputDateString);

        // Assert:
        expect(result.isDateInFuture, JSON.stringify(result, null, 2)).to.eql(inputDateStringPairs[1]);
      });
    });

    it(`check date - current date (America/New_York)- should be in past`, async () => {
      const currentDate = new Date();
      const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "America/New_York",
      };

      // Arrange:
      let inputDateString = currentDate.toLocaleString("en-US", options);

      inputDateString = new Date(inputDateString).toISOString();

      inputDateString = inputDateString.replace("Z", "-04:00");
      // Act:
      const result = isDateInFuture(inputDateString);
      // Assert:
      expect(result.isDateInFuture, JSON.stringify(result, null, 2)).to.eql(false);
    });

    it(`check date - current date ISO string - should be in past`, async () => {
      // Arrange:
      const inputDateString = new Date().toISOString();

      // Act:
      const result = isDateInFuture(inputDateString);

      // Assert:
      expect(result.isDateInFuture, JSON.stringify(result, null, 2)).to.eql(false);
    });

    it(`check date - current date - should be in past`, async () => {
      // Arrange:
      const inputDateString = getCurrentDate();

      // Act:
      const result = isDateInFuture(inputDateString);

      // Assert:
      expect(result.isDateInFuture, JSON.stringify(result, null, 2)).to.eql(false);
    });

    it(`check date - one hour in future`, async () => {
      // Arrange:
      const inputDateString = getCurrentDate(1, 0, 0);

      // Act:
      const result = isDateInFuture(inputDateString);

      // Assert:
      expect(result.isDateInFuture, JSON.stringify(result, null, 2)).to.eql(true);
    });

    it(`check date - few seconds in future`, async () => {
      // Arrange:
      const inputDateString = getCurrentDate(0, 0, 12);

      // Act:
      const result = isDateInFuture(inputDateString);

      // Assert:
      expect(result.isDateInFuture, JSON.stringify(result, null, 2)).to.eql(true);
    });
  });
});
