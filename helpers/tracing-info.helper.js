const TRACING_INFO = "_TracingInfo";

const sampleTracingInfo = {
  orgMethod: undefined,
  resourceId: undefined,
  wasAuthorized: false,
  baseResourceId: undefined,
  targetResourceId: undefined,
  targetResource: undefined,
};

class TracingInfoBuilder {
  constructor(req) {
    this.req = req;
    this.tracingInfo = req[TRACING_INFO] || { ...sampleTracingInfo };
  }

  setWasAuthorized(wasAuthorized) {
    this.tracingInfo.wasAuthorized = wasAuthorized;
    return this;
  }

  setOriginMethod(orgMethod) {
    this.tracingInfo.orgMethod = orgMethod;
    return this;
  }

  setResourceId(id) {
    this.tracingInfo.resourceId = id;
    return this;
  }

  setTargetResource(resource) {
    this.tracingInfo.targetResource = resource;
    return this;
  }

  setBaseResourceId(id) {
    this.tracingInfo.baseResourceId = id;
    return this;
  }

  setTargetResourceId(id) {
    this.tracingInfo.targetResourceId = id;
    return this;
  }

  build() {
    this.req[TRACING_INFO] = this.tracingInfo;
    return this.req;
  }
}

function getTracingInfo(req) {
  return req[TRACING_INFO];
}

function getOriginMethod(req) {
  return getTracingInfo(req)?.orgMethod;
}

function getWasAuthorized(req) {
  return getTracingInfo(req)?.wasAuthorized;
}

module.exports = {
  TRACING_INFO,
  sampleTracingInfo,
  TracingInfoBuilder,
  getTracingInfo,
  getOriginMethod,
  getWasAuthorized,
};
