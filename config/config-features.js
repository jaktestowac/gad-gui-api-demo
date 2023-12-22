// Config to turn on and off different features

const featureFlagConfig = {
  feature_likes: false,
  feature_files: false,
  feature_only_backend: false,
  feature_labels: false,
  feature_cache_control_no_store: true,
  feature_visits: false,
};

module.exports = {
  featureFlagConfig,
};
