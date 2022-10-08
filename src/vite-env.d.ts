/// <reference types="vite/client" />

type IpcChannel = import('../electron/preload').IpcChannel

interface Window {
  electron: {
    rendererInvoke<T>(channel: IpcChannel, ...data: any[]): Promise<T>
  }
}
