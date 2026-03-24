// Type declarations for browser globals injected by third-party scripts

interface TurnstileInstance {
  render(container: string | HTMLElement, options?: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
  getResponse(widgetId: string): string | undefined;
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

export {};
