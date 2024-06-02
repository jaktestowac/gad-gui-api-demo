const { isDateInFuture } = require("../../../helpers/validation.helpers.js");
const { expect } = require("../../config.js");
const { gracefulQuit, getCurrentDate, addOffsetToDateString } = require("../../helpers/helpers.js");

describe("validation helpers", async () => {
  after(() => {
    gracefulQuit();
  });

  describe("isDateInFuture", async () => {
    [
      ["2020-12-12T12:12:12Z", false, -60],
      [new Date().toISOString(), false, -120],
      [getCurrentDate(), false, -120],
      [addOffsetToDateString(new Date().toISOString(), "-11:00"), false, -660],
      [addOffsetToDateString(new Date().toISOString(), "-04:00"), false, -240],
      [addOffsetToDateString(new Date().toISOString(), "-02:00"), false, -120],
      [addOffsetToDateString(new Date().toISOString(), "+02:00"), false, 120],
      [addOffsetToDateString(new Date().toISOString(), "+04:00"), false, 240],
      [addOffsetToDateString(new Date().toISOString(), "+11:00"), false, 660],
      [getCurrentDate(0, 0, 12), true, -120],
      [getCurrentDate(1, 0, 0), true, -120],
      [addOffsetToDateString(getCurrentDate(1, 0, 0), "-02:00", -120), true],
      ["2040-12-12T12:12:12Z", true, -60],
    ].forEach((inputDateStringPairs) => {
      it(`check date - ${inputDateStringPairs[0]} - in future - ${inputDateStringPairs[1]}`, async () => {
        // Arrange:
        const inputDateString = inputDateStringPairs[0];

        // Act:
        const result = isDateInFuture(inputDateString);

        // Assert:
        expect(result.isDateInFuture, JSON.stringify(result, null, 2)).to.eql(inputDateStringPairs[1]);
        if (inputDateStringPairs[2] !== undefined) {
          expect(result.inputDateTimezoneOffsetInMinutes, JSON.stringify(result, null, 2)).to.eql(
            inputDateStringPairs[2]
          );
        }
      });
    });
  });
});
