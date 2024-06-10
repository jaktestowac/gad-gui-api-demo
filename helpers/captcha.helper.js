const imageHashes = {
  0: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAP0lEQVQYV2NkwAEYyZYoA+rshOouB9JdIKOUgPguENtCJQ4DaWWQBEw1zL7/QLFyKkvYAM0EWYhhOcgxGM4FAO5FEihdXNWJAAAAAElFTkSuQmCC",
  1: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAANUlEQVQYV2NkwAEYKZJQAuq+C8SRQLwCZhRMEGQyXAImCFKtjC5RAhRYBsSH0Y0CGWFDIwkA6k8SDLjhlP4AAAAASUVORK5CYII=",
  2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAUklEQVQYV2NkwAEYyZaYBtSZCdW9E0h7gIyyAeLDQGwLxM+A+C4QR2Kz4z9QohxdAmYkio4yoMpOqFEqMB0wQZD9YDEQoQRVBReEMZBVw/w7HQD+Vg3IgXVZxQAAAABJRU5ErkJggg==",
  3: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAWklEQVQYV2NkwAEYyZaYBtSZCdVdDqS7QEbZAPFhILYFYhkgXg5io9sRAZVQRpaACwIl76HrUAIK3gXiSGzO/Q+UmA6SKAPiTiBWhroKRccOoKA7VGI6kM4CAG8SDrDNAnkHAAAAAElFTkSuQmCC",
  4: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAR0lEQVQYV2NkwAEYKZa4AzVBBdmoMqBgJxDfBWK4hBJUAKQBRQJkxC4gBilQgekAGZEGFdiBLAFSrYzm7Lvo/kDRgawYLgEAMWgM6KbBhDYAAAAASUVORK5CYII=",
  5: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAWklEQVQYV2NkwAEYyZaYBtSZiaQ7EmbUDqDgPSDOgknCJP4DBSKBeAWyhBKQcxfJGBBbBaQjAoiXA7Ey1DiQ7unYnHsHKHEHJFEGxJ1oOsqRXeUOtWcnkPYAAFK3EigHNkowAAAAAElFTkSuQmCC",
  6: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAXElEQVQYV2NkwAEYyZawAeo8DNV9F0irgIxSAmIQxxaIn0HZkSCJCCBeDsQo9oE4ZUCcBsTKUKN2AmkPmEQnmlHlyBIwo+4AFe1Ct/wIUPA/EIN1gADMASA22A4ARbwT5gInt6kAAAAASUVORK5CYII=",
  7: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAUklEQVQYV2NkwAEYyZKYBtSViaZzOrpRZUAFnUBsiy7xHyhYDsRdyBIw1WAxZIk7QP4uIM5ClrABcg4DcSQQr0CWiABylgOxMhDfQ5ZAMR8kAQDc1QzexOU1iAAAAABJRU5ErkJggg==",
  8: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAV0lEQVQYV2NkwAEYyZbYAdTpDtW9E0h7gIyKAOLlQGwLlTgMpCNBEjZADOJgSIAUwiRBbJCCI+hGPQMK3oUZVQZkdAIxzOn/gezpuHSUw1RNA6rKRHYuAEtUFCAQ6h+RAAAAAElFTkSuQmCC",
  9: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAZElEQVQYV2NkwAEYyZaYBtSZCdVdDqS7QEZFAPFyIFYGYikgPgzEtiCJMiDuBGKYff+B7HJkHbZAgWdAfBeIp8NUIdsBktiFzbl3gBKzQBI2MAuhrgJZrgzTsQPIcYdKRALpFQA52hKC0Xp5xAAAAABJRU5ErkJggg==",
};

const imageHashesOther = {
  "?": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAbUlEQVQoU2NkIBIwEqmOgbYKpwGdkYnklLtAtgqMD7N6B1DAHYd7wWpAhBIQg3SDgDIQ34OyYZrLgfwufJ6BOQWvwjKgKZ3ItmAzEdm9cKegK4wAmrIcahKKHLpCmJXTgYqzkEOB7Jgh2kScCgHZrRQQqTh+ZgAAAABJRU5ErkJggg==",
  "+": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAP0lEQVQoU2NkIBIwEqmOYRApnAZ0cyYQlwNxF7L70d1IHYURQCuW4wmmSKDcCpDVRCtENow6biTLRJx+IjquAVzQEBDxO41NAAAAAElFTkSuQmCC",
  "-": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAMElEQVQoU2NkIBIwEqmOYVQh3pAiKXhsgEYdRjLuLpCtgm48yESiFRIViyS5kSgTAcBlBBDdIALHAAAAAElFTkSuQmCC",
  "*": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAVElEQVQoU2NkIBIwEqmOgbYK7wCdUQPEK7A5B2T1NCDOBOKdQLwAiJcDsS0QH0HWAHOjDVDwMBDfBWIVXCaWASU6gVgZiEOgbAxP0tbXeMN+KFgNAONNChBofATFAAAAAElFTkSuQmCC",
  "/": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAe0lEQVQoU2NkIBIwEqmOgbYKy4DO6ARirLYgC+6AutcDm7uRFf4HKigH4i58Cm2AkoeB2BaIj+BTCHOfMlDRPXwKQe5TgWKsQQtz4x2g7C4gzsIVASCFSkB8F4gjgXgFPoURQMnlQIzTfSDNIBOnAbEbPvfBFBJ0H0ghAL6QEhDdgp2HAAAAAElFTkSuQmCC",
  "=": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAL0lEQVQoU2NkIBIwEqmOYdgpjAD6fDke3ysD5e6BfE20QqKCkiQTqW810W4kSiEADTgIEBMHSlwAAAAASUVORK5CYII=",
};

const mathOperations = {
  "+": {
    hash: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAP0lEQVQoU2NkIBIwEqmOYRApnAZ0cyYQlwNxF7L70d1IHYURQCuW4wmmSKDcCpDVRCtENow6biTLRJx+IjquAVzQEBDxO41NAAAAAElFTkSuQmCC",
    operation: (a, b) => a + b,
  },
  "-": {
    hash: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAMElEQVQoU2NkIBIwEqmOYVQh3pAiKXhsgEYdRjLuLpCtgm48yESiFRIViyS5kSgTAcBlBBDdIALHAAAAAElFTkSuQmCC",
    operation: (a, b) => a - b,
  },
};

function parseEquation(str) {
  return Function(`return (${str})`)();
}

function generateEquation(minOperations, maxOperations, minNumbers, maxNumbers) {
  const equation = [];
  let equationString = "";

  const numOperations = Math.floor(Math.random() * (maxOperations - minOperations + 1)) + minOperations;

  for (let i = 0; i < numOperations; i++) {
    const numNumbers = Math.floor(Math.random() * (maxNumbers - minNumbers + 1)) + minNumbers;
    const operation = Object.keys(mathOperations)[Math.floor(Math.random() * Object.keys(mathOperations).length)];
    const numbers = [];

    for (let j = 0; j < numNumbers; j++) {
      const number = Math.floor(Math.random() * 10);
      numbers.push(number);
      equation.push(imageHashes[number]);
    }

    equation.push(mathOperations[operation].hash);
    equationString += numbers.join("") + operation;
  }

  equationString = equationString.slice(0, -1); // Remove the last operation symbol
  equation.pop(); // Remove the last operation hash
  const result = parseEquation(equationString);
  return {
    equation: equation,
    equationString: equationString,
    result: result,
  };
}

function checkCaptcha(actualResult, expectedResult) {
  if (
    expectedResult === undefined ||
    actualResult === undefined ||
    actualResult === null ||
    expectedResult?.result === null ||
    expectedResult?.result === undefined
  ) {
    return false;
  }

  return `${actualResult}` === `${expectedResult?.result}`;
}

module.exports = {
  generateEquation,
  checkCaptcha,
};
