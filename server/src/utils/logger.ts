// server/src/utils/logger.ts

import { env } from '../config/env.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;
  private serverId: string;

  constructor() {
    this.level = env.IS_PRODUCTION ? LogLevel.INFO : LogLevel.DEBUG;
    this.serverId = env.SERVER_ID;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.serverId}] [${level}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  error(message: string, error?: any, meta?: any): void {
    if (this.level <= LogLevel.ERROR) {
      const errorInfo = error instanceof Error 
        ? { message: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
      console.error(this.formatMessage('ERROR', message, errorInfo));
    }
  }

  // Specialized log methods
  socket(message: string, meta?: any): void {
    this.debug(`🔌 ${message}`, meta);
  }

  auth(message: string, meta?: any): void {
    this.debug(`🔐 ${message}`, meta);
  }

  message(message: string, meta?: any): void {
    this.debug(`💬 ${message}`, meta);
  }

  redis(message: string, meta?: any): void {
    this.debug(`🔴 ${message}`, meta);
  }

  db(message: string, meta?: any): void {
    this.debug(`💾 ${message}`, meta);
  }

  http(method: string, path: string, status: number, duration: number): void {
    this.info(`📡 ${method} ${path} ${status} ${duration}ms`);
  }
}

export const logger = new Logger();
