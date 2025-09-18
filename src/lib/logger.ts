type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...context
    }

    if (this.isDevelopment) {
      // In development, use console with colors
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m'  // red
      }
      const reset = '\x1b[0m'
      
      console.log(
        `${colors[level]}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`,
        context ? context : ''
      )
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logData))
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = error instanceof Error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    } : { error, ...context }

    this.log('error', message, errorContext)
  }
}

export const logger = new Logger()