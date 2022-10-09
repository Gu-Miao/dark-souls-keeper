import Swal from 'sweetalert2'
import debounce from 'lodash.debounce'
import { Save } from '../electron/saves'

const { rendererInvoke } = window.electron

const $backup = document.getElementById('Backup') as HTMLButtonElement
const $quickBackup = document.getElementById('QuickBackup') as HTMLButtonElement
const $saveList = document.getElementById('SaveList') as HTMLUListElement
const $search = document.getElementById('Search') as HTMLInputElement

const defaultRootFontSize = 20
const rootFontSize = localStorage.getItem('rootFontSize') || defaultRootFontSize
document.body.style.setProperty('--font-size', `${rootFontSize}px`)

getSaveList()

$backup.addEventListener('click', handleBackup)
$quickBackup.addEventListener('click', handleQuickBackup)
$search.addEventListener('input', debounce(handleSearch, 300))
$saveList.addEventListener('click', handleSaveListAction)

let saveList: Save[] = []

async function handleRemove(id: string) {
  const { isConfirmed } = await Swal.fire({
    titleText: 'Remove this backup?',
    icon: 'warning',
    showCancelButton: true
  })
  if (!isConfirmed) return

  const result = await rendererInvoke('REMOVE', id)
  if (result) {
    Swal.fire('Remove success', '', 'success')
    const index = saveList.findIndex(save => save.id === id)
    saveList.splice(index, 1)
    $saveList.querySelector(`li:nth-child(${index + 1})`).remove()
  } else {
    Swal.fire('Remove failed', 'Please try later', 'error')
  }
}

async function handleLoad(id: string) {
  const { isConfirmed } = await Swal.fire({
    titleText: 'Load this backup?',
    icon: 'warning',
    html: 'This will completely overwrite the current archive. Please ensure that the current archive has been backed up',
    showCancelButton: true
  })
  if (!isConfirmed) return

  const result = await rendererInvoke<boolean>('LOAD', id)
  Swal.fire(
    result ? 'Load success' : 'Load fail',
    result ? '' : 'Please try later',
    result ? 'success' : 'error'
  )
}

function handleSaveListAction(event: MouseEvent) {
  const el = event.target as HTMLElement
  if (el.tagName !== 'BUTTON') return

  const { classList } = el
  const { id } = el.dataset

  if (classList.contains('load')) {
    handleLoad(id)
  } else if (classList.contains('remove')) {
    handleRemove(id)
  }
}

function handleSearch() {
  const search = $search.value.trim().toLowerCase()
  let len = 0
  saveList.forEach((save, i) => {
    const $listItem = $saveList.querySelector(`li:nth-child(${i + 1})`) as HTMLLIElement
    if (save.name.toLowerCase().includes(search)) {
      $listItem.style.display = ''
    } else {
      len++
      $listItem.style.display = 'none'
    }
  })
  if (len === saveList.length) {
    appendEmpty('No search result')
  } else {
    removeEmpty()
  }
}

async function getSaveList() {
  const [failed, data] = await rendererInvoke<[false, Save[]] | [true]>('GET_SAVE_LIST')
  if (failed) {
    Swal.fire('Get save list failed', 'Please try later', 'error')
    return
  }

  saveList = data
  if (saveList.length) {
    let dom = ''
    saveList.forEach(save => {
      dom += renderSaveItem(save)
    })
    $saveList.innerHTML = dom
  } else {
    appendEmpty('No save yet')
  }
}

async function handleBackup() {
  Swal.fire({
    titleText: 'Backup',
    icon: 'info',
    html: `<form>
      <label for="Name"><span class="red">*</span>Save name:</label>
      <input id="Name" type="text" autocomplete="false" placeholder="Save name..." />
      <em id="NameMsg"></em>
      <label for="Name">Description:</label>
      <textarea id="Description" placeholder="Some description..."></textarea>
    </form>`,
    showCancelButton: true,
    showLoaderOnConfirm: true,
    willOpen() {
      const $name = document.getElementById('Name') as HTMLInputElement
      const $nameMsg = document.getElementById('NameMsg')
      $name.onfocus = () => ($nameMsg.innerHTML = '')
    },
    async preConfirm() {
      const $name = document.getElementById('Name') as HTMLInputElement
      const name = $name.value.trim()
      const $nameMsg = document.getElementById('NameMsg')
      if (!name) {
        $nameMsg.innerHTML = 'Name can not be empty'
        return false
      } else if (!/^.{3,36}$/.test(name)) {
        $nameMsg.innerHTML = 'The length of the name should be between 3 and 36'
        return false
      } else if (/[\\/:*?"<>|]/.test(name)) {
        $nameMsg.innerHTML = 'Save name can not include \\ / : * ? " < > |'
        return false
      }
      const description = (document.getElementById('Description') as HTMLTextAreaElement).value
      return backup({ name, description })
    }
  })
}

function handleQuickBackup() {
  Swal.fire({
    titleText: 'Quick backup?',
    html: 'This will backup current save and name it by create time',
    icon: 'question',
    showCancelButton: true
  }).then(({ isConfirmed }) => {
    if (isConfirmed) backup({})
  })
}

async function backup(data: { name?: string; description?: string }) {
  const [reason, save] = await rendererInvoke<[false, Save] | [string]>('BACKUP', data)
  if (reason) {
    Swal.fire('Backup failed', reason, 'error')
    return false
  }
  removeEmpty()
  saveList.push(save)
  $saveList.innerHTML += renderSaveItem(save)
  handleSearch()
  Swal.fire('Backup success', '', 'success')
}

function appendEmpty(content: string) {
  $saveList.innerHTML += `<div class="empty">${content}</div>`
}

function removeEmpty() {
  const $empty = document.querySelector('.empty')
  if ($empty) $empty.remove()
}

function renderSaveItem(save: Save) {
  return `<li>
  <header>
    <div class="name">${save.name}</div>
    <div class="actions">
      <button class="load" data-id="${save.id}">Load</button>
      <button class="remove" data-id="${save.id}">Remove</button>
    </div>
  </header>
  <div class="description">${save.description}</div>
</li>`
}
