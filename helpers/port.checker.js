/* eslint-disable no-console */
let execSync = require("child_process").execSync;

const isPortFree = (port) => {
  try {
    execSync(`netstat -ano | findstr :${port}`);
    return false;
  } catch (e) {
    return true;
  }
};

const checkPorts = (ports) => {
  const results = [];

  for (const port of ports) {
    results.push({ port, isFree: isPortFree(port) });
  }

  //   results.forEach(({ port, isFree }) => {
  //     console.log(`> Port ${port} is ${isFree ? "free" : "busy"}`);
  //   });

  return results;
};

const printBusyPortMessage = (busyPorts) => {
  const borderWidth = 70;
  const borderChar = "═";
  const verticalChar = "║";

  const topBorder = `╔${borderChar.repeat(borderWidth)}╗`;
  const bottomBorder = `╚${borderChar.repeat(borderWidth)}╝`;
  const emptyLine = `${verticalChar}${" ".repeat(borderWidth)}${verticalChar}`;

  const formatLine = (text) =>
    `${verticalChar} ${text}${" ".repeat(Math.max(0, borderWidth - text.length - 1))}${verticalChar}`;

  console.log(topBorder);
  console.log(formatLine("Looks like some required ports are busy:"));
  console.log(emptyLine);

  busyPorts.forEach(({ port, isFree }) => {
    console.log(formatLine(` - Port "${port}" ${isFree ? "is free [ok]" : "is busy [nok]"}`));
  });

  console.log(emptyLine);
  console.log(emptyLine);
  console.log(formatLine("=> Please free those ports and try again."));
  console.log(emptyLine);
  console.log(formatLine("<3 jaktestowac.pl Team"));
  console.log(bottomBorder);
};

const assertFreePorts = (ports, failFast = true) => {
  const results = checkPorts(ports);
  try {
    const busyPorts = results.filter((result) => !result.isFree);

    if (busyPorts.length > 0) {
      printBusyPortMessage(busyPorts);
      if (failFast) {
        throw new Error(`Required ports are busy. Please free them and try again.`);
      }
    }
    console.log("> All required ports are free");
  } catch (error) {
    process.exit(1);
  }
};

module.exports = { assertFreePorts };
