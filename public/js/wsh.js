const addr = window.location.host;
const addrParts = addr.split(":");
addrParts[1] = (parseInt(addrParts[1]) + 10).toString();
const wsAddr = addrParts.join(":");
