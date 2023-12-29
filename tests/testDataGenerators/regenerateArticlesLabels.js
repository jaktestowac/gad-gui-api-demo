/* eslint-disable no-console */
const dbPath = `./db/db-base-big.json`;

const fs = require("fs");
const { getRandomInt } = require("../../helpers/helpers");

const db = JSON.parse(fs.readFileSync(dbPath));
const articles = db.articles;
const labels = db.labels;

const articleLabelsAll = [];

let index = 1;
articles.forEach((article) => {
  const articleLabels = {
    id: index,
    label_ids: [],
    article_id: article.id,
  };

  const attemptMax = 100;

  for (let index = 0; index < attemptMax; index++) {
    const randomLabel = labels[getRandomInt(1, labels.length)];

    if (article.body.toLowerCase().includes(randomLabel.name.toLowerCase())) {
      if (!articleLabels.label_ids.includes(randomLabel.id)) {
        articleLabels.label_ids.push(randomLabel.id);
      }
    }

    if (articleLabels.label_ids.length === 3) {
      break;
    }
  }

  index++;
  articleLabelsAll.push(articleLabels);
});

db["article-labels"] = articleLabelsAll;
fs.writeFileSync(dbPath, JSON.stringify(db));
