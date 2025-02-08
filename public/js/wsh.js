const addr = window.location.host;
const addrParts = addr.split(":");

if (addrParts[1] !== undefined && !isNaN(addrParts[1])) {
  addrParts[1] = (parseInt(addrParts[1]) + 10).toString();
}

// check if http or https
const protocol = window.location.protocol;
const wsProtocol = protocol === "https:" ? "wss" : "ws";

const wsAddr = `${wsProtocol}://${addrParts.join(":")}`;
console.log("wsAddr", wsAddr);
