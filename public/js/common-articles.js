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
  let url = `${articleLabelsUpdateEndpoint}`;

  if (articleLabelId !== undefined) url = `${articleLabelsUpdateEndpoint}/${articleLabelId}`;

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

async function updateLabelElements() {
  const isEnabled = await checkIfFeatureEnabled("feature_labels");
  if (!isEnabled) return;

  const elements = document.querySelectorAll(".labels-container");
  const ids = [];
  elements.forEach((element) => {
    ids.push(element.id.split("-").slice(-1)[0]);
  });

  issueGetLabelsForArticles(ids).then((labelsData) => {
    const labelIds = [...new Set(Object.values(labelsData.labels).flatMap((item) => item.label_ids || []))];
    issueGetLabels(labelIds).then((labelData) => {
      elements.forEach((element) => {
        element.innerHTML = "";
        const id = element.id.split("-").slice(-1)[0];
        const labelIds = labelsData.labels[id]?.label_ids;
        if (labelIds !== undefined) {
          labelIds.forEach((labelId) => {
            const label = labelData.find((lbl) => lbl.id === labelId);
            element.innerHTML += formatLabelElement(label).outerHTML;
          });
        }
      });
    });
  });
}
