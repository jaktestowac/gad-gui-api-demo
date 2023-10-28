checkIfFeatureEnabled("feature_likes").then((isEnabled) => {
  if (isEnabled) {
    const container = document.querySelector("#mostLiked");
    container.innerHTML +=
      '<div class="container" id="pageHeader" style="font-size: 12px; align-content: center; display: flex; align-items: center; justify-content: center"> <h1>Show most liked...</h1> </div> <div class="container container-mobile" style="font-size: 12px; align-content: center; display: flex; align-items: center; justify-content: center"> <a href="./most-liked-articles.html"> <button class="button-primary button-mobile" id="btnMostLikedArticles" style="margin: 10; font-size: 22px">Articles </button> </a> </div>';
  }
});
