async function getRandomStudentsData() {
  return fetch(`/api/v1/data/random/students`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

function getAndPresentRandomStudentsData() {
  return getRandomStudentsData().then((response) => {
    if (response.status === 200) {
      return response.json().then((data) => {
        removeErrorMessage();
        return data;
      });
    } else {
      invokeActionsOnDifferentStatusCodes(response.status, response);
      return response;
    }
  });
}
