const addr = window.location.host;
const addrParts = addr.split(":");

if (addrParts[1] !== undefined && !isNaN(addrParts[1])) {
  addrParts[1] = (parseInt(addrParts[1]) + 10).toString();
}

const wsAddr = addrParts.join(":");
console.log("wsAddr", wsAddr);
