import { fs, path } from '@tauri-apps/api'
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'

const dataDir = await path.dataDir()
const keeperDir = await path.join(dataDir, 'DarkSoulsKeeper')
const backupJson = await path.join(keeperDir, 'backups.json')

export type Backup = {
  id: string
  name: string
  type: 'DarkSouls' | 'DarkSoulsII' | 'DarkSoulsIII' | 'Sekiro' | 'EldenRing'
  description: string
  createdAt: string
}

export type BackupData = {
  name?: string
  type: Backup['type']
  description?: string
}

/**
 * Archive manager
 */
export class ArchiveManager {
  /** Current backups of archive manager  */
  backups: Backup[]

  /**
   * Constructor of archive manager
   */
  constructor() {
    this.backups = []
  }

  /**
   * Get path of archive directory
   * @param type Type of archive
   * @returns
   */
  getArchiveDir(type: Backup['type']) {
    return path.join(dataDir, type)
  }

  /**
   * Initialize if necessary. It will create a `DarkSoulsKeeper` directory
   * in `$DATA` directory and create a `backups.json` file to store data of
   * backups when calling this function
   */
  async initializeIfNecessary() {
    createDirIfNecessary(keeperDir)

    const isBackupJsonExisted = await fs.exists(backupJson)
    if (isBackupJsonExisted) return

    await fs.writeTextFile(backupJson, '[]')
  }

  /**
   * Get all the backups and store in current instance
   */
  async getBackups() {
    await this.initializeIfNecessary()

    const backupJsonContent = await fs.readTextFile(backupJson)
    this.backups = JSON.parse(backupJsonContent)
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
    await fs.writeTextFile(backupJson, JSON.stringify(nextBackups))

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
    await fs.writeTextFile(backupJson, JSON.stringify(nextBackups))

    this.backups = nextBackups
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
