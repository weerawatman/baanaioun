type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMetadata {
    [key: string]: unknown;
}

/**
 * Simple logger utility
 * Can be extended to send logs to external services (e.g., Sentry, LogRocket)
 */
class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private formatMessage(level: LogLevel, message: string, meta?: LogMetadata): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    info(message: string, meta?: LogMetadata): void {
        if (this.isDevelopment) {
            console.log(this.formatMessage('info', message, meta));
        }
    }

    warn(message: string, meta?: LogMetadata): void {
        console.warn(this.formatMessage('warn', message, meta));
    }

    error(message: string, error?: unknown, meta?: LogMetadata): void {
        const errorMeta = {
            ...meta,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            } : error,
        };

        console.error(this.formatMessage('error', message, errorMeta));

        // TODO: Send to error tracking service (e.g., Sentry)
        // if (process.env.NODE_ENV === 'production') {
        //   Sentry.captureException(error, { extra: meta });
        // }
    }

    debug(message: string, meta?: LogMetadata): void {
        if (this.isDevelopment) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }
}

export const logger = new Logger();
