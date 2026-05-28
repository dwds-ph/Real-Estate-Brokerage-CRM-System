/**
 * Structured logging utility.
 * Replaces ad-hoc console.log/error with structured, scoped logging.
 * In production, this can be swapped for a real logging service.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  scope: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(entry: LogEntry): string {
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.scope}] ${entry.message}`;
}

function createEntry(
  level: LogLevel,
  scope: string,
  message: string,
  data?: unknown,
): LogEntry {
  return {
    level,
    scope,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function logToConsole(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const formatted = formatLog(entry);

  switch (entry.level) {
    case "error":
      console.error(formatted, entry.data ?? "");
      break;
    case "warn":
      console.warn(formatted, entry.data ?? "");
      break;
    case "info":
      console.info(formatted, entry.data ?? "");
      break;
    case "debug":
      console.debug(formatted, entry.data ?? "");
      break;
  }
}

// ─── Logger class ───────────────────────────────────────────────────

export class Logger {
  private readonly scope: string;

  constructor(scope: string) {
    this.scope = scope;
  }

  debug(message: string, data?: unknown): void {
    logToConsole(createEntry("debug", this.scope, message, data));
  }

  info(message: string, data?: unknown): void {
    logToConsole(createEntry("info", this.scope, message, data));
  }

  warn(message: string, data?: unknown): void {
    logToConsole(createEntry("warn", this.scope, message, data));
  }

  error(message: string, data?: unknown): void {
    logToConsole(createEntry("error", this.scope, message, data));
  }
}

// ─── Factory ───────────────────────────────────────────────────────

const loggers = new Map<string, Logger>();

/**
 * Get or create a scoped logger.
 */
export function createScopedLogger(scope: string): Logger {
  let logger = loggers.get(scope);
  if (!logger) {
    logger = new Logger(scope);
    loggers.set(scope, logger);
  }
  return logger;
}
