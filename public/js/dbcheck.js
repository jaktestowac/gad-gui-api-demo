const dbCheckEndpoint = "../../api/health/dbcheck";
const dbStatusInfoContainer = document.getElementById("dbStatusInfoBox");

async function issueGetDbCheckRequest() {
  const data = fetch(dbCheckEndpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());
  return data;
}

issueGetDbCheckRequest().then((data) => {
  if (data.status !== true) {
    if (dbStatusInfoContainer !== null) {
      const missingTables =
        data.result?.missingTablesInCurrentDb?.length > 0
          ? `- <strong>tables</strong> are missing <span class="span-button" onclick="toggleMenu('missingTables')">Show more</span></br>
      <span id="missingTables" style="display:none;"><strong>${data.result?.missingTablesInCurrentDb.join(
        ", "
      )}</strong></br></span>`
          : [];
      const missingMandatoryColumns =
        data.result?.missingKeysInCurrentDb?.length > 0
          ? `- <strong>mandatory columns</strong> are missing (in one or more entities) <span class="span-button" onclick="toggleMenu('missingColumns')">Show more</span></br>
             <span id="missingColumns" style="display:none;"><strong>${data.result?.missingKeysInCurrentDb.join(
               ", "
             )}</strong></br></span>`
          : [];
      const error = data.result?.error !== undefined ? `<strong>${data.result?.error}</strong></br>` : "";

      const text = `Current database seems to be <strong>incorrect</strong> 🤕</br>
      ${missingTables}
      ${missingMandatoryColumns}
      ${error}
      </br>If You progress with this state - GAD can return errors.
      </br>Go to <strong><a href='/tools/index.html#restore'>💣 DB Restore</a></strong> to fix it.`;
      dbStatusInfoContainer.innerHTML = text;

      dbStatusInfoContainer.style.display = "";
    }
  }
});

function toggleMenu(id) {
  var menu = document.getElementById(id);
  if (menu.style.display === "none") {
    menu.style.display = null;
  } else {
    menu.style.display = "none";
  }
}
