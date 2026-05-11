const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, `run-${Date.now()}.log`);
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 23);
  }

  formatLog(level, message, data = null) {
    const timestamp = this.formatTimestamp();
    let logLine = `[${timestamp}] [${level}] ${message}`;
    if (data) {
      logLine += '\n' + JSON.stringify(data, null, 2);
    }
    return logLine;
  }

  writeToFile(logLine) {
    fs.appendFileSync(this.logFile, logLine + '\n', 'utf-8');
  }

  info(message, data = null) {
    const logLine = this.formatLog('INFO', message, data);
    this.writeToFile(logLine);
  }

  warn(message, data = null) {
    const logLine = this.formatLog('WARN', message, data);
    this.writeToFile(logLine);
  }

  error(message, error = null) {
    const logLine = this.formatLog('ERROR', message, error ? { error: error.message, stack: error.stack } : null);
    this.writeToFile(logLine);
  }

  debug(message, data = null) {
    const logLine = this.formatLog('DEBUG', message, data);
    this.writeToFile(logLine);
  }

  agent(agentName, status, message = '') {
    const logLine = this.formatLog('AGENT', `${agentName} - ${status}${message ? ': ' + message : ''}`);
    this.writeToFile(logLine);
  }

  pipeline(pipelineName, phase, message) {
    const logLine = this.formatLog('PIPELINE', `${pipelineName} - ${phase}: ${message}`);
    this.writeToFile(logLine);
  }

  logFile() {
    return this.logFile;
  }

  getLogPath() {
    return path.relative(process.cwd(), this.logFile);
  }
}

const logger = new Logger();

module.exports = { logger };