/**
 * Structured Logging System
 * 
 * Production-ready logging with different levels and structured output.
 * Automatically formats logs for development (pretty) and production (JSON).
 * 
 * @module logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger Class
 * 
 * Provides structured logging with environment-aware formatting.
 * - Development: Pretty console logs with colors
 * - Production: Structured JSON for log aggregation
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Internal log method
   * 
   * Formats and outputs log entries based on environment.
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    };

    if (this.isDevelopment) {
      // Development: Pretty console logs
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`,
        metadata || ''
      );
    } else {
      // Production: Structured JSON (for log aggregation services)
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Debug level logging
   * 
   * For detailed debugging information.
   * Only shown in development mode.
   * 
   * @param {string} message - Log message
   * @param {LogMetadata} metadata - Additional context
   * 
   * @example
   * logger.debug('Processing request', { userId: '123', action: 'subscribe' });
   */
  debug(message: string, metadata?: LogMetadata) {
    if (this.isDevelopment) {
      this.log('debug', message, metadata);
    }
  }

  /**
   * Info level logging
   * 
   * For general informational messages.
   * 
   * @param {string} message - Log message
   * @param {LogMetadata} metadata - Additional context
   * 
   * @example
   * logger.info('Email subscription successful', { email: 'user@example.com' });
   */
  info(message: string, metadata?: LogMetadata) {
    this.log('info', message, metadata);
  }

  /**
   * Warning level logging
   * 
   * For warning messages that don't prevent operation.
   * 
   * @param {string} message - Log message
   * @param {LogMetadata} metadata - Additional context
   * 
   * @example
   * logger.warn('Rate limit approaching', { ip: '192.168.1.1', remaining: 1 });
   */
  warn(message: string, metadata?: LogMetadata) {
    this.log('warn', message, metadata);
  }

  /**
   * Error level logging
   * 
   * For error conditions that need attention.
   * Includes error stack trace in development.
   * 
   * @param {string} message - Log message
   * @param {Error} error - Error object (optional)
   * @param {LogMetadata} metadata - Additional context
   * 
   * @example
   * try {
   *   await someOperation();
   * } catch (error) {
   *   logger.error('Operation failed', error as Error, { userId: '123' });
   * }
   */
  error(message: string, error?: Error, metadata?: LogMetadata) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
      ...(error ? {
        error: {
          name: error.name,
          message: error.message,
          ...(this.isDevelopment && error.stack ? { stack: error.stack } : {}),
        }
      } : {}),
    };

    if (this.isDevelopment) {
      console.error(
        `❌ [${logEntry.timestamp}] ERROR: ${message}`,
        error || '',
        metadata || ''
      );
      if (error?.stack) {
        console.error(error.stack);
      }
    } else {
      console.log(JSON.stringify(logEntry));
      
      // In production, you could send to error tracking service here
      // Example: Sentry.captureException(error, { extra: metadata });
    }
  }

  /**
   * Log API request
   * 
   * Specialized logging for API requests.
   * 
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {number} status - Response status code
   * @param {number} duration - Request duration in ms
   * 
   * @example
   * logger.request('POST', '/api/subscribe', 201, 145);
   */
  request(method: string, path: string, status: number, duration?: number) {
    const metadata: LogMetadata = {
      method,
      path,
      status,
      ...(duration ? { duration: `${duration}ms` } : {}),
    };

    const message = `${method} ${path} ${status}`;
    
    if (status >= 500) {
      this.error(message, undefined, metadata);
    } else if (status >= 400) {
      this.warn(message, metadata);
    } else {
      this.info(message, metadata);
    }
  }
}

/**
 * Singleton logger instance
 * 
 * Pre-configured logger that can be imported throughout the application.
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('Application started');
 * logger.error('Failed to process', error, { userId: '123' });
 */
export const logger = new Logger();
