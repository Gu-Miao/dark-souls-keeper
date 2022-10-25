import { fs, path } from '@tauri-apps/api'
import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'

const dataDir = await path.dataDir()
const saveDir = await path.join(dataDir, 'DarkSoulsIII')
const keeperDir = await path.join(dataDir, 'DarkSoulsKeeper')
const saveJson = await path.join(keeperDir, 'saves.json')

export type Save = {
  id: string
  name: string
  type: 'DarkSouls' | 'DarkSoulsII' | 'DarkSoulsIII' | 'Sekiro' | 'EldenRing'
  description: string
  createdAt: string
}

export type BackupData = {
  name?: string
  type?: Save['type']
  description?: string
}

export class SaveManager {
  static async getAll() {
    await initKeeperIfNecessary()
    const saveJsonContent = await fs.readTextFile(saveJson)
    return JSON.parse(saveJsonContent) as Save[]
  }
  static async backup(saves: Save[], data: BackupData) {
    if (data.name && saves.find(save => save.name === data.name)) {
      throw new Error('Duplicate naming')
    }
    const id = uuid()
    const now = dayjs()
    const createdAt = now.format('YYYY-MM-DD HH:mm:ss')
    const name = data.name || `Quick backup ${now.format('YYYY-MM-DD HHmmss')}`
    const description = data.description || `Created at ${createdAt}`
    const type = data.type || 'DarkSoulsIII'
    await copyDir(saveDir, await path.join(keeperDir, name))
    const save: Save = { id, name, description, createdAt, type }
    await fs.writeTextFile(saveJson, JSON.stringify([...saves, save]))
    return save
  }
  static async load(save: Save) {
    await removeDir(saveDir)
    await copyDir(await path.join(keeperDir, save.name), saveDir)
  }
  static async remove(saves: Save[], id: string) {
    const index = saves.findIndex(save => save.id === id)
    const dir = await path.join(keeperDir, saves[index].name)
    const nextSaves = [...saves]
    nextSaves.splice(index, 1)
    await removeDir(dir)
    fs.writeTextFile(saveJson, JSON.stringify(nextSaves))
    return nextSaves
  }
}

async function initKeeperIfNecessary() {
  if (!(await fs.exists(keeperDir))) {
    await fs.createDir(keeperDir)
  }
  if (!(await fs.exists(saveJson))) {
    await fs.writeTextFile(saveJson, '[]')
  }
}

async function copyDir(source: string, destination: string) {
  if (!(await fs.exists(destination))) {
    await fs.createDir(destination)
  }
  const dir = await fs.readDir(source, { recursive: false })
  for (let item of dir) {
    if (item.children) {
      copyDir(item.path, await path.join(destination, item.name))
    } else {
      fs.copyFile(item.path, await path.join(destination, item.name))
    }
  }
}

async function removeDir(path: string) {
  const dir = await fs.readDir(path, { recursive: false })
  for (let item of dir) {
    if (item.children) {
      await removeDir(item.path)
    } else {
      await fs.removeFile(item.path)
    }
  }
  fs.removeDir(path)
}
