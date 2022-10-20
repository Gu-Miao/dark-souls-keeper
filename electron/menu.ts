import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron'

const zh = {
  window: '窗口',
  toggleDevTools: '切换开发者工具',
  reload: '刷新',
  minimize: '最小化',
  close: '关闭',
  edit: '编辑',
  undo: '撤销',
  redo: '还原',
  cut: '剪切',
  copy: '复制',
  paste: '粘贴',
  selectAll: '全选'
}

const en = {
  window: 'Window',
  toggleDevTools: 'toggle Developer Tools',
  reload: 'Reload',
  minimize: 'Minimize',
  close: 'Close',
  edit: 'Edit',
  undo: 'Undo',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  selectAll: 'Select All'
}

export type Lang = 'en' | 'zh'

function getTemplate(lang: Lang): MenuItemConstructorOptions[] {
  const text = lang === 'en' ? en : zh
  return [
    {
      label: text.window,
      submenu: [
        ...(app.isPackaged
          ? []
          : [{ role: 'toggleDevTools', label: text.toggleDevTools } as MenuItemConstructorOptions]),
        { role: 'reload', label: text.reload },
        { role: 'minimize', label: text.minimize },
        { role: 'close', label: text.close }
      ]
    },
    {
      label: text.edit,
      submenu: [
        { role: 'undo', label: text.undo },
        { role: 'redo', label: text.redo },
        { type: 'separator' },
        { role: 'cut', label: text.cut },
        { role: 'copy', label: text.copy },
        { role: 'paste', label: text.paste },
        { type: 'separator' },
        { role: 'selectAll', label: text.selectAll }
      ]
    }
  ]
}

export function setMenu(win: BrowserWindow, lang: 'en' | 'zh' = 'en') {
  const menu = Menu.buildFromTemplate(getTemplate(lang))
  win.setMenu(menu)
}
