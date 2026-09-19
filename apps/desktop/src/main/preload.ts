import { contextBridge, ipcRenderer } from 'electron';

type NotificationInput = { title: string; body: string };

contextBridge.exposeInMainWorld('maxDesktop', {
  showNotification(input: NotificationInput): Promise<void> {
    return ipcRenderer.invoke('show-notification', input) as Promise<void>;
  }
});
