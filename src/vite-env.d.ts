/// <reference types="vite/client" />

type IpcChannel = import('../electron/ipc').IpcChannel

interface Window {
  electron: {
    rendererInvoke<T>(channel: IpcChannel, ...data: any[]): Promise<T>
  }
}
