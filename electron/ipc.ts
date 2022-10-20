import { BrowserWindow, ipcMain } from 'electron'
import { getSaves, backup, load, remove } from './saves'
import { setMenu, Lang } from './menu'

export type IpcChannel = 'GET_SAVE_LIST' | 'BACKUP' | 'LOAD' | 'REMOVE' | 'CHANGE_LANGUAGE'

export function registerIpc(win: BrowserWindow) {
  ipcMain.handle('GET_SAVE_LIST', async () => {
    return getSaves()
  })
  ipcMain.handle('BACKUP', async (_, data: { name: string; description: string }) => {
    return backup(data)
  })
  ipcMain.handle('LOAD', async (_, id: string) => {
    return load(id)
  })
  ipcMain.handle('REMOVE', async (_, id: string) => {
    return remove(id)
  })
  ipcMain.handle('CHANGE_LANGUAGE', async (_, lang: Lang) => {
    setMenu(win, lang)
    return true
  })
}
