const $backup = document.getElementById('Backup') as HTMLButtonElement
const $quickBackup = document.getElementById('QuickBackup') as HTMLButtonElement
const $saveList = document.getElementById('SaveList') as HTMLUListElement
const $search = document.getElementById('Search') as HTMLUListElement

const defaultRootFontSize = 20
const rootFontSize = localStorage.getItem('rootFontSize') || defaultRootFontSize
document.body.style.setProperty('--font-size', `${rootFontSize}px`)
