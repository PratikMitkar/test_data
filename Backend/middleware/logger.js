const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file with timestamp
const getLogFileName = () => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  return `api-${date}.log`;
};

const logToFile = (message) => {
  const logFile = path.join(logsDir, getLogFileName());
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.log(message); // Also log to console
};

const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  const requestLog = `REQUEST: ${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`;
  logToFile(requestLog);
  
  if (req.body && Object.keys(req.body).length > 0) {
    logToFile(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    logToFile(`REQUEST QUERY: ${JSON.stringify(req.query)}`);
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const responseLog = `RESPONSE: ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`;
    logToFile(responseLog);
    
    if (data && typeof data === 'object') {
      // Don't log sensitive data like tokens
      const sanitizedData = { ...data };
      if (sanitizedData.token) {
        sanitizedData.token = '[REDACTED]';
      }
      if (sanitizedData.password) {
        sanitizedData.password = '[REDACTED]';
      }
      logToFile(`RESPONSE BODY: ${JSON.stringify(sanitizedData)}`);
    }
    
    return originalJson.call(this, data);
  };
  
  // Override res.status to log error responses
  const originalStatus = res.status;
  res.status = function(code) {
    if (code >= 400) {
      const errorLog = `ERROR: ${req.method} ${req.originalUrl} - Status: ${code}`;
      logToFile(errorLog);
    }
    return originalStatus.call(this, code);
  };
  
  next();
};

module.exports = logger; 