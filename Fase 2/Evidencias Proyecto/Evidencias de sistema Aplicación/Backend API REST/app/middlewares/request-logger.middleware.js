const { v4: uuidv4 } = require('uuid');
const config = require('../configs/config');

const requestLoggerMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    const url = req.originalUrl.replace(config.server.context, '');
    const trackingId = uuidv4();
    const contentType = req.get('Content-Type') || 'application/json';
    
    console.info(`${timestamp} [RequestLoggerMiddleware] [START] [${trackingId}] [${req.method}] [${url}] [${contentType}]`);

    const originalSend = res.send;
    
    res.send = function(data) {
        const duration = Date.now() - startTime;

        console.info(`${new Date().toISOString()} [RequestLoggerMiddleware] [END] [${trackingId}] [${req.method}] [${url}] [${res.statusCode}] [${duration}ms]`);
      
        res.send = originalSend;
        return originalSend.call(this, data);
    };

    next();
};

module.exports = requestLoggerMiddleware;