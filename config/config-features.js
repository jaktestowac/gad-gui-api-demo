// Config to turn on and off different features

const featureFlagConfig = {
  feature_likes: false,
  feature_files: false,
  feature_only_backend: false,
  feature_labels: false,
  feature_cache_control_no_store: false,
  feature_visits: false,
  feature_user_bookmark_articles: false,
  feature_infinite_scroll_articles: false,
};

module.exports = {
  featureFlagConfig,
};
