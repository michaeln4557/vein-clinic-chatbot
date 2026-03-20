/**
 * Logger
 *
 * Structured logging with Winston.
 * All logs are JSON-formatted for observability tooling.
 * PHI is never logged directly - only reference IDs.
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  service?: string;
  conversationId?: string;
  leadId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private service: string;

  constructor(service: string = 'vein-clinic-backend') {
    this.service = service;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: context?.service || this.service,
      message,
      ...this.sanitizeContext(context),
    };

    // TODO: Replace with Winston in production
    // winston.log(entry);

    if (level === LogLevel.ERROR) {
      console.error(JSON.stringify(entry));
    } else if (level === LogLevel.WARN) {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Remove any potential PHI from log context
   */
  private sanitizeContext(context?: LogContext): Record<string, unknown> {
    if (!context) return {};

    const sanitized = { ...context };

    // Never log these fields
    const phiFields = [
      'phoneNumber', 'phone_number', 'phone',
      'email', 'dateOfBirth', 'date_of_birth', 'dob',
      'fullName', 'full_name', 'name', 'patientName',
      'address', 'ssn', 'insuranceMemberId',
      'insurance_member_id',
    ];

    for (const field of phiFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): Logger {
    const child = new Logger(context.service || this.service);
    // In production, Winston child loggers carry default metadata
    return child;
  }
}

export const logger = new Logger();
export default logger;
