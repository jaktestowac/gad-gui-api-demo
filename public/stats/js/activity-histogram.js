const userActivityEndpoint = "../../api/stats/activity/user";

async function issueGetStatsRequest(userId) {
  const url = userId !== undefined ? `${userActivityEndpoint}/${userId}` : userActivityEndpoint;

  const data = fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());
  return data;
}

function parseDataByDayOfWeek(jsonData, dataType = "articles") {
  const parsedData = [];

  for (const key in jsonData) {
    const userActivityByDay = jsonData[key].userActivityByDay;
    for (const dayOfWeek in userActivityByDay) {
      const userName = jsonData[key].user.name;
      let value = userActivityByDay[dayOfWeek].comments;
      if (dataType === "articles") {
        value = userActivityByDay[dayOfWeek].articles;
      }
      const dataObject = {
        x: dayOfWeek,
        y: userName,
        value,
      };
      parsedData.push(dataObject);
    }
  }
  return parsedData;
}

function parseDataByMonths(jsonData, dataType = "articles") {
  const parsedData = [];

  for (const key in jsonData) {
    const userActivityByMonth = jsonData[key].userActivityByMonth;
    for (const month in userActivityByMonth) {
      const userName = jsonData[key].user.name;
      let value = userActivityByMonth[month].comments;
      if (dataType === "articles") {
        value = userActivityByMonth[month].articles;
      }
      const dataObject = {
        x: month,
        y: userName,
        value,
      };
      parsedData.push(dataObject);
    }
  }
  return parsedData;
}

function composeChart(data, yElementsCount) {
  const dataLength = yElementsCount ?? data.length;

  const element = document.getElementById("chartPlaceholder");
  if (element) {
    element.innerHTML = "";
  }
  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 25, bottom: 30, left: 200 },
    width = 750 - margin.left - margin.right,
    height = 40 + dataLength * 20 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3
    .select("#chartPlaceholder")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    };
  }

  const maxValue = data.reduce((max, obj) => {
    return obj.value > max ? obj.value : max;
  }, 0);

  const myGroups = Array.from(new Set(data.map((d) => d.x)));
  const myVars = Array.from(new Set(data.map((d) => d.y)));

  // Build X scales and axis:
  const x = d3.scaleBand().range([0, width]).domain(myGroups).padding(0.05);
  svg
    .append("g")
    .style("font-size", 10)
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .select(".domain")
    .remove();

  // Build Y scales and axis:
  const y = d3.scaleBand().range([0, height]).domain(myVars).padding(0.05);
  svg.append("g").style("font-size", 12).call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

  // Build color scale
  const myColor = d3.scaleSequential().interpolator(d3.interpolateInferno).domain([0, maxValue]);

  // create a tooltip
  const tooltip = d3
    .select("#chartPlaceholder")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute");

  const mouseover = function (event, d) {
    tooltip.style("opacity", 1);
    d3.select(this).style("stroke", "black").style("opacity", 1);
  };
  const mousemove = function (event, d) {
    tooltip
      .html("Value: " + d.value)
      .style("left", event.x + 10 + "px")
      .style("top", event.y + 10 + window.scrollY + "px");
  };
  const mouseleave = function (event, d) {
    tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none").style("opacity", 0.8);
  };

  // add the squares
  svg
    .selectAll()
    .data(data, function (d) {
      return d.x + ":" + d.y;
    })
    .join("rect")
    .attr("x", function (d) {
      return x(d.x);
    })
    .attr("y", function (d) {
      return y(d.y);
    })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", function (d) {
      return myColor(d.value);
    })
    .style("stroke-width", 4)
    .style("stroke", "none")
    .style("opacity", 0.8)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
}

function presentData(type, period) {
  const element = document.getElementById("chartPlaceholder");
  if (element) {
    element.innerHTML = "";
  }

  const loader = document.createElement("div");
  loader.classList.add("loader2-container");
  element.appendChild(loader);

  issueGetStatsRequest(userId).then((data) => {
    data = userId !== undefined ? [data] : data;

    let parsedData = parseDataByDayOfWeek(data, type);
    if (period.toLowerCase().includes("day")) {
      parsedData = parseDataByDayOfWeek(data, type);
    } else if (period.toLowerCase().includes("month")) {
      parsedData = parseDataByMonths(data, type);
    }

    if (parsedData.length === 0) {
      document.getElementById("chartPlaceholder").innerHTML = "<h2>No data available</h2><br/><br/>";
      return;
    }
    composeChart(parsedData, Object.keys(data).length);
    document.getElementById(
      "details"
    ).innerHTML = `Number of <strong>${type}</strong> published by <strong>${period}</strong>`;
  });
}

function generateChartPDF(filename) {
  generatePDF(filename, "chartPlaceholder");
}

const userId = getParams()["user_id"];
presentData("articles", "Day of Week");

if (userId !== undefined) {
  const header = document.querySelector("#header");
  header.innerHTML = "Single User Activity";
}
