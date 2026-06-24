const { AsyncLocalStorage } = require("async_hooks");
const { randomUUID } = require("crypto");

const store = new AsyncLocalStorage();

const getRequestId = () => store.getStore()?.requestId ?? undefined;

const requestContext = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || randomUUID();
  req.requestId = requestId;
  req._hrStart  = process.hrtime.bigint();
  res.setHeader("x-request-id", requestId);
  store.run({ requestId }, next);
};

module.exports = { requestContext, getRequestId };
