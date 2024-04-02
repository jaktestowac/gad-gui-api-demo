const { compareDbObjects } = require("../../../helpers/compare.helpers");
const { expect } = require("../../config.js");
const { gracefulQuit } = require("../../helpers/helpers.js");

describe("compareDbObjects", () => {
  after(() => {
    gracefulQuit();
  });

  it("should return false - object missing key", async () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 2 };

    // Act:
    const result = compareDbObjects(obj1, obj2);

    // Assert:
    expect(result.areEqual, result).to.equal(false);
  });
  it("should return true - objects have same keys", async () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 2, c: 4 };

    // Act:
    const result = compareDbObjects(obj1, obj2);

    // Assert:
    expect(result.areEqual, result).to.equal(true);
  });
  it("should return true - nested objects have same keys", async () => {
    const obj1 = { a: 1, b: 2, c: { c1: 5 } };
    const obj2 = { a: 1, b: 2, c: { c1: 4 } };

    // Act:
    const result = compareDbObjects(obj1, obj2);

    // Assert:
    expect(result.areEqual, result).to.equal(true);
  });
  it("should return true - nested object lists have same keys", async () => {
    const obj1 = { a: [{ a1: 5 }, { a1: 15 }] };
    const obj2 = { a: [{ a1: 4 }, { a1: 25 }] };

    // Act:
    const result = compareDbObjects(obj1, obj2);

    // Assert:
    expect(result.areEqual, result).to.equal(true);
  });
  it("should return true - nested object lists have same keys (skips optional values)", async () => {
    const obj1 = { a: [{ a1: 5 }, { a1: 15, b1: 33 }] };
    const obj2 = { a: [{ a1: 4 }, { a1: 25 }] };

    // Act:
    const result = compareDbObjects(obj1, obj2);

    // Assert:
    expect(result.areEqual, result).to.equal(true);
  });
  it("should return false - nested objects have missing keys", async () => {
    const obj1 = { a: 1, b: 2, c: { c1: 5 } };
    const obj2 = { a: 1, b: 2, c: { c2: 4 } };

    // Act:
    const result = compareDbObjects(obj1, obj2);

    // Assert:
    expect(result.areEqual, result).to.equal(false);
  });
  it("should return true - double nested objects have missing keys", async () => {
    const obj1 = { a: 1, b: 2, c: { c1: 5, c2: { c21: 11 } } };
    const obj2 = { a: 1, b: 2, c: { c1: 4, c2: { c22: 12 } } };

    // Act:
    const result = compareDbObjects(obj1, obj2);

    // Assert:
    expect(result.areEqual, result).to.equal(true);
  });
});
