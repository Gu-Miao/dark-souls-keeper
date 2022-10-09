import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from './ipc'

contextBridge.exposeInMainWorld('electron', {
  rendererInvoke<T>(channel: IpcChannel, ...data: any[]): Promise<T> {
    return ipcRenderer.invoke(channel, ...data)
  }
})
