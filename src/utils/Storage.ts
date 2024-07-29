import { fs, path } from '@tauri-apps/api'
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import { Lang } from '../i18n'

const jsonName = 'keeper.json'
const dataDir = await path.dataDir()
const keeperDir = await path.join(dataDir, 'DarkSoulsKeeper')
const keeperJsonPath = await path.join(keeperDir, jsonName)

export type BackupType = 'DarkSoulsIII' | 'EldenRing'

export type Backup = {
  id: string
  name: string
  type: BackupType
  description: string
  lastUpdate: string
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
  store: Store

  /** Constructor of archive manager */
  constructor() {}

  /** Create instance of Storage */
  static async create() {
    const storage = new Storage()
    await storage.init()

    return storage
  }

  /** Get all the data and store in current instance */
  async init() {
    try {
      this.store = await this.getStore()
    } catch {
      const backups = await this.scanArchives()
      this.store = { ...defaultStore, backups }
      this.updateStore()
    }
  }

  /** Get store */
  async getStore() {
    const json = await fs.readTextFile(keeperJsonPath)

    return JSON.parse(json)
  }

  /** Update store */
  async updateStore() {
    return fs.writeTextFile(keeperJsonPath, JSON.stringify(this.store))
  }

  /** Scan archives */
  async scanArchives() {
    const entires = await fs.readDir(keeperDir)
    const backups: Backup[] = []

    for (const entry of entires) {
      if (!entry.children) continue

      const childEntries = await fs.readDir(entry.path)
      const hasKeeperJson = childEntries.find(child => child.name === jsonName)
      if (!hasKeeperJson) continue

      const jsonPath = await path.join(keeperDir, entry.name, jsonName)
      const json = await fs.readTextFile(jsonPath)

      try {
        backups.push(JSON.parse(json))
      } catch {}
    }

    return backups.sort(
      (before, after) => dayjs(after.lastUpdate).valueOf() - dayjs(before.lastUpdate).valueOf()
    )
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
   * Get name of backup directory
   * @param backup Backup to use
   * @returns
   */
  getBackupDir(backup: Backup) {
    const { id, name, type } = backup
    return `${type}-${name}-${id}`
  }

  /**
   * Back up an archive
   * @param data Current archived data and its naming and description by users
   */
  async backUp(data: BackupData) {
    const id = uuid()
    const now = dayjs()
    const lastUpdate = now.format('YYYY-MM-DD HH:mm:ss')
    const name = data.name || 'quickBackup'
    const description = data.description || `Created at ${lastUpdate}`
    const type = data.type
    const backup: Backup = { id, name, description, lastUpdate, type }

    const backupDir = this.getBackupDir(backup)
    const archiveDir = await this.getArchiveDir(data.type)
    const destination = await path.join(keeperDir, backupDir)
    const keeperJsonPath = await path.join(destination, jsonName)

    await copyDir(archiveDir, destination)
    await fs.writeTextFile(keeperJsonPath, JSON.stringify(backup))

    const nextBackups = [backup, ...this.store.backups]
    this.store.backups = nextBackups
    this.updateStore()
  }

  /**
   * Load backup and overwrite current archive
   * @param backup Backup to use
   */
  async loadBackup(backup: Backup) {
    const archiveDir = await this.getArchiveDir(backup.type)
    const backupDir = this.getBackupDir(backup)

    await removeDir(archiveDir)
    await copyDir(await path.join(keeperDir, backupDir), archiveDir)
  }

  /**
   * Update backup information
   * @param nextBackup Backup to use
   */
  async updateBackup(nextBackup: Backup) {
    const index = this.store.backups.findIndex(backup => backup.id === nextBackup.id)
    const backup = this.store.backups[index]
    const mergedBackup = {
      ...backup,
      ...nextBackup,
      lastUpdate: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    let nextBackups = [...this.store.backups]
    nextBackups.splice(index, 1)
    nextBackups = [mergedBackup, ...nextBackups]

    const backupDir = this.getBackupDir(backup)
    const backupDirPath = await path.join(keeperDir, backupDir)
    const keeperJsonPath = await path.join(keeperDir, backupDir, jsonName)

    const nextBackupDir = this.getBackupDir(mergedBackup)
    const nextBackupDirPath = await path.join(keeperDir, nextBackupDir)

    await fs.writeTextFile(keeperJsonPath, JSON.stringify(backup))
    await fs.renameFile(backupDirPath, nextBackupDirPath)

    this.store.backups = nextBackups
    await this.updateStore()
  }

  /**
   * Remove backup
   * @param id Id of backup to remove
   */
  async removeBackup(id: string) {
    const index = this.store.backups.findIndex(backup => backup.id === id)
    const backupDir = this.getBackupDir(this.store.backups[index])
    const dir = await path.join(keeperDir, backupDir)

    const nextBackups = [...this.store.backups]
    nextBackups.splice(index, 1)
    await removeDir(dir)

    this.store.backups = nextBackups
    await this.updateStore()
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
      await copyDir(dirent.path, destinationPath)
    } else {
      await fs.copyFile(dirent.path, destinationPath)
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
