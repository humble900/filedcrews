export interface LogMetadata {
  companyId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export const logger = {
  info(event: string, metadata?: LogMetadata) {
    console.log(
      JSON.stringify({
        level: "info",
        event,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  },

  warn(event: string, metadata?: LogMetadata) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  },

  error(event: string, error: unknown, metadata?: LogMetadata) {
    console.error(
      JSON.stringify({
        level: "error",
        event,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  },
};
