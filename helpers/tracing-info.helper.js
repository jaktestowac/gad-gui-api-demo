const TRACKING_INFO = "_trackingInfo";

const sampleTrackingInfo = {
  orgMethod: undefined,
  resourceId: undefined,
};

class TrackingInfoBuilder {
  constructor(req) {
    this.req = req;
    this.trackingInfo = req[TRACKING_INFO] || { ...sampleTrackingInfo };
  }

  setOriginMethod(orgMethod) {
    this.trackingInfo.orgMethod = orgMethod;
    return this;
  }

  setResourceId(id) {
    this.trackingInfo.resourceId = id;
    return this;
  }

  build() {
    this.req[TRACKING_INFO] = this.trackingInfo;
    return this.req;
  }
}

function getTracingInfo(req) {
  return req[TRACKING_INFO];
}

function getOriginMethod(req) {
  return getTracingInfo(req)?.orgMethod;
}

module.exports = {
  TRACKING_INFO,
  sampleTrackingInfo,
  TrackingInfoBuilder,
  getTracingInfo,
  getOriginMethod,
};
