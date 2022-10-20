import { mkdir, readFile, writeFile, access, cp, rm } from 'node:fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'

const roamingPath = join(homedir(), 'AppData/Roaming')
const savePath = join(roamingPath, 'DarkSoulsIII')
const keeperPath = join(roamingPath, 'DarkSoulsKeeper')
const saveListPath = join(keeperPath, 'saves.json')

let saveListData: Save[] = []

!(async () => {
  if (!(await isKeeperPathExist())) {
    await mkdir(keeperPath)
    writeFile(saveListPath, '[]')
  }
})()

async function isKeeperPathExist() {
  try {
    await access(keeperPath)
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

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

export async function getSaves(): Promise<[false, Save[]] | [true]> {
  try {
    const result = await readFile(saveListPath, { encoding: 'utf-8' })
    saveListData = JSON.parse(result)
    return [false, saveListData]
  } catch (err) {
    console.error(err)
    return [true]
  }
}

export async function backup(data: BackupData): Promise<[false, Save] | [string]> {
  if (data.name && saveListData.find(save => save.name === data.name)) {
    return ['Duplicate naming']
  }
  const id = uuid()
  const now = dayjs()
  const createdAt = now.format('YYYY-MM-DD HH:mm:ss')
  const name = data.name || `Quick backup ${now.format('YYYY-MM-DD HHmmss')}`
  const description = data.description || `Created at ${createdAt}`
  const type = data.type || 'DarkSoulsIII'
  try {
    await cp(savePath, join(keeperPath, name), { recursive: true })
    const save: Save = { id, name, description, createdAt, type }
    saveListData = [...saveListData, save]
    await writeFile(saveListPath, JSON.stringify(saveListData))
    return [false, save]
  } catch (err) {
    console.error(err)
    return ['Backup failed, please try later']
  }
}

export async function load(id: string) {
  const save = saveListData.find(save => save.id === id)
  if (!save) return false
  const path = join(keeperPath, save.name)
  try {
    await rm(savePath, { recursive: true, force: true })
    await cp(path, savePath, { recursive: true })
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

export async function remove(id: string) {
  const index = saveListData.findIndex(save => save.id === id)
  if (index === -1) return false
  const save = saveListData[index]
  const path = join(keeperPath, save.name)

  const promises = []
  saveListData.splice(index, 1)
  promises.push(writeFile(saveListPath, JSON.stringify(saveListData)))
  promises.push(rm(path, { recursive: true, force: true }))
  try {
    await Promise.all(promises)
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
