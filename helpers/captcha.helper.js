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
  "?": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAPUlEQVQYV2NkwAEYyZYoA+rsRNJtCzIqAoiXA3EkEK8AYrAibHZglfgPNQ5sFAzA7FEGCtwjyrk4daBIAADA3AyCNeUcRQAAAABJRU5ErkJggg==",
  "+": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAK0lEQVQYV2NkwAEY6SxRBrQvDYhVQPYiW44hMQ2oIBPddXh1wBTjtAPFNAC6sAUL8uREPQAAAABJRU5ErkJggg==",
  "-": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAHklEQVQYV2NkwAEYh55EGdDJnVBnTwfSWSA26f4AAIWtAgzREeLgAAAAAElFTkSuQmCC",
  "*": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAQElEQVQYV2NkwAEYyZaIAOqUA+IumAkgo3YAsQpU4A6Q9gCxYXaAJEEALAiTmAZkPIDyFYB0FrIODMeR71wMowB7qgYMNuovygAAAABJRU5ErkJggg==",
  "/": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAQUlEQVQYV2NkwAEYKZL4D9QNNwHGsAEK1gCxB8xomEQZVKALXWIHUKAFiI+gS6CYD5IEGYVhPkwCw3yYBIb5IAkAvEoKDP/McMcAAAAASUVORK5CYII=",
  "=": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAHUlEQVQYV2NkwAEYB1piGtABmeiOwOsq0nVg9SMAw30CCoDDlo8AAAAASUVORK5CYII=",
};

const mathOperations = {
  "+": {
    hash: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAK0lEQVQYV2NkwAEY6SxRBrQvDYhVQPYiW44hMQ2oIBPddXh1wBTjtAPFNAC6sAUL8uREPQAAAABJRU5ErkJggg==",
    operation: (a, b) => a + b,
  },
  "-": {
    hash: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAALCAYAAABcUvyWAAAAHklEQVQYV2NkwAEYh55EGdDJnVBnTwfSWSA26f4AAIWtAgzREeLgAAAAAElFTkSuQmCC",
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
