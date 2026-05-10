type LogLevel = 'info' | 'warn' | 'error';

interface LogEvent {
  category: string;
  event: string;
  level?: LogLevel;
  message?: string;
  data?: Record<string, unknown>;
}

const LOG_INGEST_URL = process.env.LOG_INGEST_URL || '';
const LOG_INGEST_TOKEN = process.env.LOG_INGEST_TOKEN || '';
const LOG_SERVICE_NAME = process.env.LOG_SERVICE_NAME || 'hi-ai-chat';
const LOG_ENVIRONMENT = process.env.LOG_ENVIRONMENT || process.env.NODE_ENV || 'development';
const LOG_REMOTE_TIMEOUT_MS = 2000;

let hasWarnedAboutRemoteLogConfig = false;

function getConsoleMethod(level: LogLevel) {
  if (level === 'error') return console.error;
  if (level === 'warn') return console.warn;
  return console.info;
}

function isRemoteLoggingEnabled(): boolean {
  if (!LOG_INGEST_URL && !LOG_INGEST_TOKEN) {
    return false;
  }

  if (!LOG_INGEST_URL || !LOG_INGEST_TOKEN) {
    if (!hasWarnedAboutRemoteLogConfig) {
      hasWarnedAboutRemoteLogConfig = true;
      console.warn('[server_log]', {
        timestamp: new Date().toISOString(),
        event: 'remote_log_config_invalid',
        message: 'LOG_INGEST_URL 和 LOG_INGEST_TOKEN 需要同时配置，才能开启远程日志投递。',
      });
    }
    return false;
  }

  return true;
}

async function sendRemoteLog(payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort('remote_log_timeout');
  }, LOG_REMOTE_TIMEOUT_MS);

  try {
    const response = await fetch(LOG_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOG_INGEST_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn('[server_log]', {
        timestamp: new Date().toISOString(),
        event: 'remote_log_failed',
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error) {
    console.warn('[server_log]', {
      timestamp: new Date().toISOString(),
      event: 'remote_log_failed',
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function logServerEvent({
  category,
  event,
  level = 'info',
  message,
  data = {},
}: LogEvent) {
  const payload = {
    dt: Date.now(),
    timestamp: new Date().toISOString(),
    level,
    service: LOG_SERVICE_NAME,
    environment: LOG_ENVIRONMENT,
    category,
    event,
    message: message || `${category}.${event}`,
    ...data,
  };

  const consoleMethod = getConsoleMethod(level);
  consoleMethod(`[${category}]`, payload);

  if (isRemoteLoggingEnabled()) {
    void sendRemoteLog(payload);
  }
}
