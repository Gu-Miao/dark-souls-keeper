import { fs, path } from '@tauri-apps/api'
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import forage from './forage'
import { Lang } from '../i18n'

const dataDir = await path.dataDir()
const keeperDir = await path.join(dataDir, 'DarkSoulsKeeper')

export type BackupType = 'DarkSoulsIII' | 'EldenRing'

export type Backup = {
  id: string
  name: string
  type: BackupType
  description: string
  createdAt: string
}

export type BackupData = {
  name?: string
  type?: BackupType
  description?: string
}

export type Theme = 'light' | 'dark' | 'system'

export type Store = {
  backups: Backup[]
  fontSize: number
  theme: Theme
  lang: Lang
}

const defaultStore: Store = {
  backups: [],
  fontSize: 16,
  theme: 'system',
  lang: 'en'
}

/** Store manager */
export class Storage {
  backups: Backup[]
  fontSize: number
  theme: Theme
  lang: Lang

  /** Constructor of archive manager */
  constructor() {}

  /** Create instance of Storage */
  static async create() {
    const storage = new Storage()

    await storage.getStore()
    return storage
  }

  /** Get all the data and store in current instance */
  async getStore() {
    this.backups = (await forage.getItem('backups')) || defaultStore.backups
    this.fontSize = (await forage.getItem('fontSize')) || defaultStore.fontSize
    this.theme = (await forage.getItem('theme')) || defaultStore.theme
    this.lang = (await forage.getItem('lang')) || defaultStore.lang
  }

  /**
   * Get path of archive directory
   * @param type Type of archive
   * @returns
   */
  getArchiveDir(type: BackupType) {
    return path.join(dataDir, type)
  }

  /**
   * Back up an archive
   * @param data Current archived data and its naming and description by users
   */
  async backUp(data: BackupData) {
    const id = uuid()
    const now = dayjs()
    const createdAt = now.format('YYYY-MM-DD HH:mm:ss')
    const name = data.name || `Quick backup ${now.format('YYYY-MM-DD HHmmss')}`
    const description = data.description || `Created at ${createdAt}`
    const type = data.type
    const backup: Backup = { id, name, description, createdAt, type }

    const archiveDir = await this.getArchiveDir(data.type)
    const destination = await path.join(keeperDir, name)
    await copyDir(archiveDir, destination)

    const nextBackups = [...this.backups, backup]
    await this.setItem('backups', nextBackups)

    this.backups = nextBackups
  }

  /**
   * Load backup and overwrite current archive
   * @param backup Backup to use
   */
  async loadBackup(backup: Backup) {
    const archiveDir = await this.getArchiveDir(backup.type)

    await removeDir(archiveDir)
    await copyDir(await path.join(keeperDir, backup.name), archiveDir)
  }

  /**
   * Remove backup
   * @param id Id of backup to remove
   */
  async removeBackup(id: string) {
    const index = this.backups.findIndex(backup => backup.id === id)
    const dir = await path.join(keeperDir, this.backups[index].name)

    const nextBackups = [...this.backups]
    nextBackups.splice(index, 1)

    await removeDir(dir)
    await this.setItem('backups', nextBackups)

    this.backups = nextBackups
  }

  /**
   * Set data of item in store
   * @param key Key of data
   * @param value Value of data
   */
  async setItem<T extends keyof Store>(key: T, value: Store[T]) {
    await forage.setItem(key, value)
  }
}

/**
 * Create directory if necessary
 * @param path path of directory
 */
async function createDirIfNecessary(path: string) {
  const isDirExisted = await fs.exists(path)
  if (!isDirExisted) await fs.createDir(path, { recursive: true })
}

/**
 * Copy directory recursively
 * @param source Path of source directory
 * @param destination Path of destination directory
 */
async function copyDir(source: string, destination: string) {
  await createDirIfNecessary(destination)
  const dirents = await fs.readDir(source, { recursive: false })
  for (let dirent of dirents) {
    const destinationPath = await path.join(destination, dirent.name)
    if (dirent.children) {
      copyDir(dirent.path, destinationPath)
    } else {
      fs.copyFile(dirent.path, destinationPath)
    }
  }
}

/**
 * Remove directory recursively
 * @param path Path of directory
 */
async function removeDir(path: string) {
  const dirents = await fs.readDir(path, { recursive: false })
  for (let dirent of dirents) {
    if (dirent.children) {
      await removeDir(dirent.path)
    } else {
      await fs.removeFile(dirent.path)
    }
  }
  fs.removeDir(path)
}
