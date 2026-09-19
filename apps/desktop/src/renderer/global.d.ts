export {};

declare global {
  interface Window {
    maxDesktop: {
      showNotification(input: { title: string; body: string }): Promise<void>;
    };
  }
}
