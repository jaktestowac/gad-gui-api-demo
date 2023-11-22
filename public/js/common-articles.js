const articleLabelsEndpoint = "../../api/article-labels/articles";
const articleLabelsUpdateEndpoint = "../../api/article-labels";
const labelsEndpoint = "../../api/labels";

async function issueGetLabelsForArticles(articleIds) {
  const formattedIds = articleIds.join("&id=");
  const labelsData = await fetch(`${articleLabelsEndpoint}?id=${formattedIds}`, { headers: formatHeaders() }).then(
    (r) => r.json()
  );
  return labelsData;
}

async function issueGetLabels(labelIds) {
  const formattedIds = labelIds.join("&id=");
  const labelsData = await fetch(`${labelsEndpoint}?id=${formattedIds}`, { headers: formatHeaders() }).then((r) =>
    r.json()
  );
  return labelsData;
}

async function issueGetAllLabels() {
  const labelsData = await fetch(`${labelsEndpoint}`, { headers: formatHeaders() }).then((r) => r.json());
  return labelsData;
}

async function issueUpdateLabels(articleLabelId, articleId, labelIds) {
  let data = {
    id: articleLabelId,
    label_ids: labelIds,
    article_id: articleId,
  };
  const url = `${articleLabelsUpdateEndpoint}/${articleLabelId}`;
  return fetch(url, {
    method: "put",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(data),
  });
}
