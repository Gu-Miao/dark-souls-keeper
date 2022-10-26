<template>
  <div class="container">
    <!-- Header buttons -->
    <header class="header">
      <el-button type="primary" @click="quickBackUp">{{ i18n.text.quickBackUp }}</el-button>
      <el-button type="primary" @click="showBackUp = true">{{ i18n.text.backUp }}</el-button>
      <el-button class="language" type="primary" @click="changeLanguage">
        <icon-english v-if="i18n.lang === 'en'" />
        <icon-chinese v-else />
      </el-button>
    </header>

    <!-- Search -->
    <el-input v-model="search" autocomplete="false" :placeholder="i18n.text.searchPlaceholder" />

    <!-- List -->
    <ul class="list">
      <li v-for="backup in filteredBackups">
        <header>
          <!-- Title of item -->
          <div class="name">{{ backup.name }}</div>

          <!-- Action buttons -->
          <div class="actions">
            <el-button type="primary" @click="loadBackup(backup)">{{ i18n.text.load }}</el-button>
            <el-button type="danger" @click="removeBackup(backup.id)">{{
              i18n.text.remove
            }}</el-button>
          </div>
        </header>

        <!-- Description of item -->
        <div class="description">{{ backup.description }}</div>
      </li>

      <!-- Empty block -->
      <div class="empty" v-if="!filteredBackups.length">{{ i18n.text.empty }}</div>
    </ul>
  </div>

  <!-- backUp dialog -->
  <el-dialog
    v-model="showBackUp"
    :title="i18n.text.backUp"
    draggable
    align-center
    @close="closeBackUpModal"
    @submit.prevent="submitBackUp"
  >
    <!-- Form -->
    <el-form :model="backupFormState" ref="formRef" label-position="top">
      <!-- Name -->
      <el-form-item
        :label="i18n.text.nameLabel"
        prop="name"
        :rules="[{ required: true, validator: nameValidator }]"
      >
        <el-input v-model="backupFormState.name" :placeholder="i18n.text.namePlaceholder" />
      </el-form-item>

      <!-- Description -->
      <el-form-item :label="i18n.text.descriptionLabel" prop="description">
        <el-input
          v-model="backupFormState.description"
          type="textarea"
          :placeholder="i18n.text.descriptionPlaceholder"
          rows="5"
          resize="none"
        />
      </el-form-item>

      <!-- Buttons -->
      <el-button type="primary" native-type="submit">{{ i18n.text.submitText }}</el-button>
      <el-button @click="closeBackUpModal">{{ i18n.text.cancelText }}</el-button>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import IconChinese from './components/IconChinese.vue'
import IconEnglish from './components/IconEnglish.vue'
import { to } from './utils'
import { ArchiveManager, Backup, BackupData } from './utils/ArchiveManager'
import { I18n } from './i18n'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

const i18n = reactive(new I18n('en'))

const search = ref<string>('')
const manager = reactive(new ArchiveManager())
const filteredBackups = computed(() =>
  manager.backups.filter(backup =>
    backup.name.toLowerCase().includes(search.value.trim().toLocaleLowerCase())
  )
)

const showBackUp = ref<boolean>(false)
const formRef = ref<FormInstance>()
const backupFormState = reactive<BackupData>({
  type: 'DarkSoulsIII'
})

onMounted(() => {
  const defaultRootFontSize = 16
  const rootFontSize = localStorage.getItem('rootFontSize') || defaultRootFontSize
  document.body.style.setProperty('--font-size', `${rootFontSize}px`)

  getBackups()
})

/** Change current language */
function changeLanguage() {
  i18n.setLanguage(i18n.lang === 'en' ? 'zh' : 'en')
}

/** Close modal of backing up */
function closeBackUpModal() {
  showBackUp.value = false
  formRef.value.resetFields()
}

/**
 * Check whether the name is legal
 * @param _ Rule of this form item, but it's not used here
 * @param value The value of name input
 * @param cb Callback when validation passes or error occurs
 */
function nameValidator(_: any, value: string | undefined, cb: Function) {
  const name = value?.trim()

  if (!name) return cb(new Error(i18n.text.nameErrorMessageEmpty))
  else if (manager.backups.find(backup => backup.name === name))
    return cb(new Error(i18n.text.nameErrorMessageDuplicate))
  else if (!/^.{3,36}$/.test(value)) return cb(new Error(i18n.text.nameErrorMessageLength))
  else if (/[\\/:*?"<>|]/.test(value)) return cb(new Error(i18n.text.nameErrorMessageIllegal))

  return cb()
}

/** Submit backing up form */
async function submitBackUp() {
  const isVerified = await formRef.value.validate()
  if (!isVerified) return

  backUp({
    name: backupFormState.name.trim(),
    description: backupFormState.description.trim(),
    type: backupFormState.type
  })
  closeBackUpModal()
}

/** Quick back up */
async function quickBackUp() {
  const [canceled] = await to(
    ElMessageBox.confirm(i18n.text.quickBackUpMessage, {
      title: i18n.text.quickBackUp,
      type: 'warning',
      confirmButtonText: i18n.text.okText,
      cancelButtonText: i18n.text.cancelText
    })
  )
  if (canceled) return
  backUp({ type: 'DarkSoulsIII' })
}

/**
 * Back up an archive
 * @param data Current archived data and its naming and description by users
 */
async function backUp(data: BackupData) {
  const [err] = await to(manager.backUp(data))
  ElMessage({
    message: i18n.text[err ? 'backupFailed' : 'backupSucceeded'],
    type: err ? 'error' : 'success'
  })
}

/** Get all the backups */
async function getBackups() {
  const [err] = await to(manager.getBackups())
  if (err) {
    ElMessage.error(i18n.text.gettingBackupsFailed)
    return
  }
}

/**
 * Load backup and overwrite current archive
 * @param backup Backup to use
 */
async function loadBackup(backup: Backup) {
  const [canceled] = await to(
    ElMessageBox.confirm(i18n.text.loadMessage, {
      title: i18n.text.load,
      type: 'warning',
      confirmButtonText: i18n.text.okText,
      cancelButtonText: i18n.text.cancelText
    })
  )
  if (canceled) return
  const [err] = await to(manager.loadBackup(backup))
  ElMessage({
    message: i18n.text[err ? 'loadingFailed' : 'loadingSucceeded'],
    type: err ? 'error' : 'success'
  })
}

/**
 * Remove backup
 * @param id Id of backup to remove
 */
async function removeBackup(id: string) {
  const [canceled] = await to(
    ElMessageBox.confirm(i18n.text.removeMessage, {
      title: i18n.text.remove,
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
      confirmButtonText: i18n.text.okText,
      cancelButtonText: i18n.text.cancelText
    })
  )
  if (canceled) return
  const [err] = await to(manager.removeBackup(id))
  ElMessage({
    message: i18n.text[err ? 'removalFailed' : 'removalSucceeded'],
    type: err ? 'error' : 'success'
  })
}
</script>

<style>
body {
  font-size: var(--font-size);
  user-select: none;
}
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>

<style lang="less" scoped>
.header {
  margin-bottom: 1em;
}
.container {
  width: 50em;
  max-width: 90%;
  margin: 0 auto;
  padding: 1em;
}
.language svg {
  width: 1.5em;
  height: 1.5em;
}
.list {
  margin-top: 1em;
  padding-bottom: 2em;

  li {
    padding: 0.8em 1em;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    border: 1px solid #ccc;
    border-radius: 0.4em;
    transition: border-color 0.2s linear, box-shadow 0.2s ease-in-out;
    &:hover {
      border-color: #32abf1;
      box-shadow: 0 0 0.2em #08c;
    }
    &:not(:last-child) {
      margin-bottom: 0.7em;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 0.6em;
    }
    .actions {
      flex-shrink: 0;
    }
    .name {
      font-weight: bold;
      user-select: text;
    }
    .description {
      color: #666;
      font-size: 0.8em;
    }
  }
}
.empty {
  padding: 3em 0;
  text-align: center;
  color: #999;
}
</style>
