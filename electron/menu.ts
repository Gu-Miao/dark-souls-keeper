import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron'

const template: MenuItemConstructorOptions[] = [
  {
    label: 'Window',
    submenu: [
      ...(app.isPackaged
        ? []
        : [{ role: 'toggleDevTools', label: 'Toggle DevTools' } as MenuItemConstructorOptions]),
      { role: 'forceReload', label: 'Reload' },
      { role: 'minimize', label: 'Minimize' },
      { role: 'close', label: 'Close' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo', label: 'Undo' },
      { role: 'redo', label: 'Redo' },
      { type: 'separator' },
      { role: 'cut', label: 'Cut' },
      { role: 'copy', label: 'Copy' },
      { role: 'paste', label: 'Paste' },
      { type: 'separator' },
      { role: 'selectAll', label: 'Select All' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'About',
        click() {
          shell.openExternal('https://github.com/Gu-Miao/dark-souls-keeper')
        }
      }
    ]
  }
]

export function setMenu(win: BrowserWindow) {
  const menu = Menu.buildFromTemplate(template)
  win.setMenu(menu)
}
