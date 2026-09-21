export {};

declare global {
  interface Window {
    maxDesktop: {
      showNotification(input: { title: string; body: string }): Promise<void>;
      updates: {
        getState(): Promise<UpdateState>;
        check(): Promise<UpdateState>;
        download(): Promise<void>;
        install(): Promise<void>;
        onState(listener: (state: UpdateState) => void): () => void;
      };
    };
  }
}

type UpdateState = {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'disabled';
  version?: string;
  percent?: number;
};
