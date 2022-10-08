import { contextBridge, ipcRenderer } from 'electron'

export type IpcChannel = 'CREATE_DIR' | 'BACKUP' | 'LOAD'

contextBridge.exposeInMainWorld('electron', {
  rendererInvoke<T>(channel: IpcChannel, ...data: any[]): Promise<T> {
    return ipcRenderer.invoke(channel, data)
  }
})