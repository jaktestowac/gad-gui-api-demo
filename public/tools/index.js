fetch("/api/db")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    const urls = [];
    let count = 0;
    for (endpoint in data) {
      count += data[endpoint].length;
      urls.push(`<a href="/api/${endpoint}">/${endpoint}</a><sup>${data[endpoint].length}x</sup>`);
    }
    urls.push(`<a href="../api/db">/db</a><sup>${count}x</sup>`);
    const resources = document.getElementById("resources");
    if (resources) {
      resources.innerHTML = urls.join("<br>");
    }
  });

const swaggerElement = document.querySelector("#swaggerEditor");
const pathToSchema = `${window.location.origin}${window.location.pathname}schema/openapi_rest_demo.json`;
if (swaggerElement) {
  swaggerElement.href = `https://editor.swagger.io/?url=${pathToSchema.replace("index.html", "")}`;
}
