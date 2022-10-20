import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron'

const template: MenuItemConstructorOptions[] = [
  {
    label: 'Window',
    submenu: [
      ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' } as MenuItemConstructorOptions]),
      { role: 'reload' },
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' }
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
