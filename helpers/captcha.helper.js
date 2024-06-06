const imageHashes = {
  0: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAeElEQVQoU2NkIBIwEqmOgbYKpwGdkYnkFBTbYBx0RSD1d4FYBaYRpvA/VEAZSN8D4jtADGJHAvEKkBxIoQ0QHwbinUDsAdVQBqQ7gbgciLtgCiOAjOVoCmFi04HiWcQohNsCsppoE4l2I8gJRPkapJDocMSmGCVmAB1JIhB9t4GSAAAAAElFTkSuQmCC",
  1: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAQElEQVQoU2NkIBIwEqmOgT4K/0Odg2IbutXTgIoyCSm8A1SgjOQ5rCbCFN1FUoxTYQJQ0TMgBikGAbxuVBoRCgFCwg4Q/pyh7AAAAABJRU5ErkJggg==",
  2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAh0lEQVQoU2NkIBIwEqmOgbYKy4DO6ERySiSQvQLGh1mNrggmbwtkHAFxYArvANnKQAwzZRqQnQnE04E4C6ZQCci4CzUCpjECyF+OrhBbCMFMhLsTW/DA3AuyRQXdMzA+sqdQDEHm4FSE7GuY40FiIN/fQ3c4zMT/OOJ8J1DcA2aiDZBxmJBCAPxeFxBD759FAAAAAElFTkSuQmCC",
  3: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAk0lEQVQoU2NkIBIwEqmOgbYKdwCd4Q51yl0grYLsLJjVyIpg8iiKQQqVgBgkCALKQHwPiP+j8XF6BqYQ7ll0X0cATVoONS0SSK+AuQNdYRlQohMquRNIe+BSCBOfBmRkAnE5EHeBBEEmwqxDNgEmNh0onwVTiOxrW6DgESCGBReKQpAGmFUwq2E0LLhQggddMYpHAbMxGhCI8PJtAAAAAElFTkSuQmCC",
  4: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAZElEQVQoU2NkIBIwEqmOgT4KI4DOWQ7EO4HYA+Y0dKuVgBJ3oZJ4Fe4AKnInpBBmJchEZXxW/4daW4PPjTArbYGKZHAphFlZDlTQBcQ4fY3sAWwRBQ4ZEEG0QnRTiApwkCasCgEYIxoQNF0juAAAAABJRU5ErkJggg==",
  5: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAh0lEQVQoU2NkIBIwEqmOgbYK/2NxRiRQbAVIHGa1DZB9mBiFEUBFy4F4OhBnYfMgzMRpQMlMNAVwa5GtvgPkKGMxyRYodgRZIcwjIMX3gBhmA9wpuMIR5rmdQE0eMBNhgneBAipQ67EqBMnBrIa5aQdQzB2Iy4G4C9mN2HyNLI8S1+iKUdwPAMxlGhCqnqikAAAAAElFTkSuQmCC",
  6: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAiElEQVQoU2NkIBIwEqmOgbYKI4DOWI7kFGUg+x6MD7O6DCjQicW9cKfBGP+himCm7ADy3YE4EohXgORACm2A+DAQ7wRiD1yhAFIIc1s5mvW2QP4RZDeiewLZULiHkE2EOQVETwPiTCCeDsRZ+NwIswVFIUgDuq+xmghSiCscUdwIczy6YpSYAQBmZx0QmjLEDAAAAABJRU5ErkJggg==",
  7: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAfklEQVQoU2NkIBIwEqmOgTYKI4DWL8fhhJ1AcQ+QHMhqohWiG6YEFLgLFbQF0kdgJqIr3AEUcAficiDugkmi+9oGKHEYaqIKsgnoCmGmRQIVrcClENltGOGLLFAGNKETiKcDcRa6w5EV4rQW3dd3gALKUHwPn4n/oZIgxRgKAboVFRDxTi/aAAAAAElFTkSuQmCC",
  8: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAjElEQVQoU2NkIBIwEqmOgbYK7wCdoYzkFFsg+wiMD7MaXRFMHqTxHogDUqgExHehMjCJHUC+OxBHAvEKmEIQ/Z9YhRFAhcvRgmo6kJ+F7sYyoEAnmsKdQL4HskJkN8I8B3NjOVBhF8yNMGuRTYCJwa0HmWADxIehVqCbiKIQpIaocIS5F+YujMAGCQAAui0eEBhhjrgAAAAASUVORK5CYII=",
  9: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAkklEQVQoU2NkIBIwEqmOgbYK7wCdoQx1yk4g7YHsLJjVyIpg8neBDBUYB6TQBogPAzGyxA4g3x2IbYH4CEgxSGEEEC8HYmTrYGLlQPEumEKYiTA+iJ4GxJlAPB2Is5AlsLkRJI+hECSIrBikAKuJyCEBYmN1oxLUxyAFoHC8h2Q6iq9BCmDBgWwySqAjxzXemAEAD9AeEPs9na0AAAAASUVORK5CYII=",
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
