const interceptConsole = require("./console");

const logBuffer = {};
let activeReq;
interceptConsole(m => {
  activeReq && logBuffer[activeReq] && logBuffer[activeReq].push(m);
});

module.exports = key => (req, res, next) => {
  if (req.headers["x-devmode-key"] === key) {
    const reqId = req.headers["x-devmode-id"];
    activeReq = reqId;
    logBuffer[reqId] = [];

    const originalWrite = res.write;
    const originalWriteHead = res.writeHead;
    const originalEnd = res.end;
    
    res.writeHead = function(code, message, headers) {
      const args = Array.prototype.slice.call(arguments);
      res.setHeader("x-devmode-logs", JSON.stringify(logBuffer[reqId]));
      return originalWriteHead.apply(res, args);
    };

    res.end = function(chunk, encoding, cb) {
      const args = Array.prototype.slice.call(arguments);
      if (!res.headersSent) {
        res.setHeader("x-devmode-logs", JSON.stringify(logBuffer[reqId]));
      }
      delete logBuffer[reqId];
      return originalEnd.apply(res, args);
    };

    req.isDev = true;
    res.setHeader("x-devmode", "1");
  }
  next();
};
