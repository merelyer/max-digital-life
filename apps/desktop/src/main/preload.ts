import { contextBridge, ipcRenderer } from 'electron';

type NotificationInput = { title: string; body: string };
type UpdateState = {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'disabled';
  version?: string;
  percent?: number;
};

contextBridge.exposeInMainWorld('maxDesktop', {
  showNotification(input: NotificationInput): Promise<void> {
    return ipcRenderer.invoke('show-notification', input) as Promise<void>;
  },
  updates: {
    getState(): Promise<UpdateState> {
      return ipcRenderer.invoke('updates:get-state') as Promise<UpdateState>;
    },
    check(): Promise<UpdateState> {
      return ipcRenderer.invoke('updates:check') as Promise<UpdateState>;
    },
    download(): Promise<void> {
      return ipcRenderer.invoke('updates:download') as Promise<void>;
    },
    install(): Promise<void> {
      return ipcRenderer.invoke('updates:install') as Promise<void>;
    },
    onState(listener: (state: UpdateState) => void): () => void {
      const receive = (_event: Electron.IpcRendererEvent, state: UpdateState): void => listener(state);
      ipcRenderer.on('updates:state', receive);
      return () => ipcRenderer.removeListener('updates:state', receive);
    }
  }
});
