import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: { startedAt: number };
  }
}

export interface ApiLogEvent {
  timestamp: string;
  method: string;
  url: string;
  params?: unknown;
  status: number | null;
  durationMs: number;
  ok: boolean;
  error?: {
    message: string;
    code?: string;
  };
}

export type ApiLogSink = (event: ApiLogEvent) => void;

// Request bodies and response data are never logged: they clutter the logs and may carry credentials
const consoleSink: ApiLogSink = (event) => {
  const label = `[API] ${event.method} ${event.url} -> ${event.status ?? "sin respuesta"} (${event.durationMs}ms)`;

  if (event.ok) {
    if (import.meta.env.DEV) console.info(label, event);
  } else if (event.status !== null && event.status < 500) {
    console.warn(label, event);
  } else {
    console.error(label, event);
  }
};

const sinks: ApiLogSink[] = [consoleSink];

export const apiLogger = {
  addSink(sink: ApiLogSink) {
    sinks.push(sink);
    return () => {
      const index = sinks.indexOf(sink);
      if (index >= 0) sinks.splice(index, 1);
    };
  },
  log(event: ApiLogEvent) {
    for (const sink of sinks) {
      try {
        sink(event);
      } catch {
        // A failing sink must never break the request flow
      }
    }
  },
};

const buildEvent = (config: InternalAxiosRequestConfig | undefined, status: number | null, error?: ApiLogEvent["error"]): ApiLogEvent => ({
  timestamp: new Date().toISOString(),
  method: (config?.method ?? "GET").toUpperCase(),
  url: config?.url ?? "",
  params: config?.params,
  status,
  durationMs: config?.metadata ? Math.round(performance.now() - config.metadata.startedAt) : 0,
  ok: error === undefined,
  error,
});

const extractErrorMessage = (error: AxiosError<{ message?: string | string[] }>): string => {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || error.message || "Error de conexión";
};

export const attachApiLogger = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    config.metadata = { startedAt: performance.now() };
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      apiLogger.log(buildEvent(response.config, response.status));
      return response;
    },
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? null;
        apiLogger.log(buildEvent(error.config, status, { message: extractErrorMessage(error), code: error.code }));
      }
      return Promise.reject(error);
    },
  );
};
