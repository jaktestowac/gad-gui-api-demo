const articleLabelsEndpoint = "../../api/article-labels/articles";
const labelsEndpoint = "../../api/labels";

async function issueGetLabelsForArticles(articleIds) {
  const formattedIds = articleIds.join("&id=");
  const labelsData = await fetch(`${articleLabelsEndpoint}?id=${formattedIds}`, { headers: formatHeaders() }).then(
    (r) => r.json()
  );
  return labelsData.labels;
}

async function issueGetLabels(labelIds) {
  const formattedIds = labelIds.join("&id=");
  const labelsData = await fetch(`${labelsEndpoint}?id=${formattedIds}`, { headers: formatHeaders() }).then((r) =>
    r.json()
  );
  return labelsData;
}
