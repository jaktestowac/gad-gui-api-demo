const postData = () => {
  fetch("http://localhost:3000/berkeley", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      first_name: document.querySelector("#first_name").value,
      last_name: document.querySelector("#last_name").value,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      document.querySelector("pre").innerHTML = JSON.stringify(data, null, 4);
    });
};

document.querySelector("button").onclick = postData;
