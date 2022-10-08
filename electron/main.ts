// The built directory structure
//
// ├─┬ dist
// │ ├─┬ electron
// │ │ ├── main.js
// │ │ └── preload.js
// │ ├── index.html
// │ ├── ...other-static-files-from-public
// │
process.env.DIST = join(__dirname, '..')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public')

import path, { join } from 'path'
import { app, BrowserWindow } from 'electron'

let win: BrowserWindow | null
const preload = join(__dirname, './preload.js')
const url = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    show: false,
    center: true,
    icon: path.join(process.env.PUBLIC, 'icon.ico'),
    webPreferences: {
      devTools: !app.isPackaged,
      preload
    }
  })

  win.once('ready-to-show', () => win.show())

  if (app.isPackaged) {
    win.loadFile(join(process.env.DIST, 'index.html'))
  } else {
    win.loadURL(url)
  }
}

app.on('window-all-closed', () => {
  win = null
  app.quit()
})

app.whenReady().then(createWindow)
