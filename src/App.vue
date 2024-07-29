<template>
  <div class="container">
    <!-- Header buttons -->
    <header class="header">
      <el-select
        v-model="currentGame"
        class="game-select"
        :placeholder="text.gameNamePlaceholder"
        clearable
        @change="handleGameChange"
      >
        <el-option
          v-for="gameName in gameNames"
          :key="gameName"
          :label="text[gameName]"
          :value="gameName"
        />
      </el-select>
      <div>
        <el-button type="primary" @click="quickBackUp" :disabled="!currentGame">
          {{ text.quickBackUp }}
        </el-button>
        <el-button type="primary" @click="showBackUp = true">{{ text.backUp }}</el-button>
        <el-button class="icon-btn language" @click="changeLanguage">
          <icon-english v-if="store.lang === 'en'" />
          <icon-chinese v-else />
        </el-button>
        <el-button class="icon-btn settings" @click="showSettings = true">
          <icon-settings />
        </el-button>
      </div>
    </header>

    <!-- Search -->
    <el-input v-model.trim="search" autocomplete="false" :placeholder="text.searchPlaceholder" />

    <!-- List -->
    <ul class="list">
      <!-- Empty block -->
      <div class="empty" v-if="!filteredBackups.length">{{ text.empty }}</div>

      <!-- Backups -->
      <template v-else>
        <li v-for="backup in filteredBackups" :key="backup.id">
          <header>
            <!-- Name of backup -->
            <b class="name">
              【{{ text[backup.type] }}】
              {{ backup.name === 'quickBackup' ? text.quickBackup : backup.name }}
            </b>

            <!-- Action buttons -->
            <div class="actions">
              <el-button
                type="primary"
                circle
                :title="text.load"
                :icon="Check"
                @click="loadBackup(backup)"
              />
              <el-button
                type="primary"
                circle
                :title="text.update"
                :icon="Edit"
                @click="showUpdateModal(backup)"
              />
              <el-button
                type="danger"
                circle
                :title="text.remove"
                :icon="Delete"
                @click="removeBackup(backup.id)"
              />
            </div>
          </header>

          <!-- Description of backup -->
          <div class="description">{{ backup.description }}</div>
        </li>
      </template>
    </ul>
  </div>

  <!-- Back up dialog -->
  <el-dialog
    v-model="showBackUp"
    :title="text.backUp"
    width="25em"
    draggable
    align-center
    @close="closeBackUpModal"
  >
    <!-- Form -->
    <el-form
      :model="backupFormState"
      ref="backupFormRef"
      label-position="top"
      @submit.prevent="submitBackUp"
    >
      <!-- Name -->
      <el-form-item
        :label="text.nameLabel"
        prop="name"
        :rules="[{ required: true, validator: nameValidator }]"
      >
        <el-input v-model.trim="backupFormState.name" :placeholder="text.namePlaceholder" />
      </el-form-item>

      <!-- Game -->
      <el-form-item
        :label="text.backupTypeLabel"
        prop="type"
        :rules="[{ required: true, message: text.backupTypeRequiredMessage }]"
      >
        <el-select
          v-model="backupFormState.type"
          :placeholder="text.backupTypePlaceholder"
          clearable
        >
          <el-option
            v-for="gameName in gameNames"
            :key="gameName"
            :label="text[gameName]"
            :value="gameName"
          />
        </el-select>
      </el-form-item>

      <!-- Description -->
      <el-form-item :label="text.descriptionLabel" prop="description">
        <el-input
          v-model.trim="backupFormState.description"
          type="textarea"
          :placeholder="text.descriptionPlaceholder"
          rows="5"
          resize="none"
        />
      </el-form-item>

      <!-- Buttons -->
      <el-button type="primary" native-type="submit">{{ text.submitText }}</el-button>
      <el-button @click="closeBackUpModal">{{ text.cancelText }}</el-button>
    </el-form>
  </el-dialog>

  <!-- Update dialog -->
  <el-dialog
    v-model="showUpdate"
    :title="text.update"
    width="25em"
    draggable
    align-center
    @close="closeUpdateModal"
  >
    <!-- Form -->
    <el-form
      :model="updateFormState"
      ref="updateFormRef"
      label-position="top"
      @submit.prevent="submitUpdate"
    >
      <!-- Name -->
      <el-form-item
        :label="text.nameLabel"
        prop="name"
        :rules="[{ required: true, validator: nameValidator }]"
      >
        <el-input v-model.trim="updateFormState.name" :placeholder="text.namePlaceholder" />
      </el-form-item>

      <!-- Game -->
      <el-form-item
        :label="text.backupTypeLabel"
        prop="type"
        :rules="[{ required: true, message: text.backupTypeRequiredMessage }]"
      >
        <el-select
          v-model="updateFormState.type"
          :placeholder="text.backupTypePlaceholder"
          disabled
        >
          <el-option
            v-for="gameName in gameNames"
            :key="gameName"
            :label="text[gameName]"
            :value="gameName"
          />
        </el-select>
      </el-form-item>

      <!-- Description -->
      <el-form-item :label="text.descriptionLabel" prop="description">
        <el-input
          v-model.trim="updateFormState.description"
          type="textarea"
          :placeholder="text.descriptionPlaceholder"
          rows="5"
          resize="none"
        />
      </el-form-item>

      <!-- Buttons -->
      <el-button type="primary" native-type="submit">{{ text.submitText }}</el-button>
      <el-button @click="closeUpdateModal">{{ text.cancelText }}</el-button>
    </el-form>
  </el-dialog>

  <!-- Settings dialog -->
  <el-dialog v-model="showSettings" :title="text.settings" width="25em" draggable align-center>
    <!-- Form -->
    <el-form label-position="top">
      <!-- Font size -->
      <el-form-item :label="text.fontSizeLabel">
        <el-input-number v-model="store.fontSize" :min="14" :max="20" :step="1" />
      </el-form-item>

      <!-- Theme -->
      <el-form-item :label="text.themeLabel">
        <el-radio v-model="store.theme" label="light">{{ text.light }}</el-radio>
        <el-radio v-model="store.theme" label="dark">{{ text.dark }}</el-radio>
        <el-radio v-model="store.theme" label="system">
          {{ text.followSystem }}
        </el-radio>
      </el-form-item>
    </el-form>

    <!-- Close button -->
    <el-button @click="showSettings = false">{{ text.close }}</el-button>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watchEffect } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { Check, Edit, Delete } from '@element-plus/icons-vue'
import IconChinese from './components/IconChinese.vue'
import IconEnglish from './components/IconEnglish.vue'
import IconSettings from './components/IconSettings.vue'
import { to } from './utils'
import { BackupType, Storage, Store, Backup, BackupData } from './utils/Storage'
import { en, zh } from './i18n'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

const storage = await Storage.create()
const store = reactive<Store>({
  ...storage.store
})

const gameNames: BackupType[] = ['DarkSoulsIII', 'EldenRing', 'Sekiro']
const currentGame = ref<BackupType>()

/** Set default value of type of backing up */
function handleGameChange() {
  backupFormState.type = currentGame.value
}

const search = ref('')
const filteredBackups = computed(() =>
  store.backups.filter(backup => {
    const matchSearch = backup.name.toLowerCase().includes(search.value.toLocaleLowerCase())
    const matchType = currentGame.value ? backup.type === currentGame.value : true

    return matchSearch && matchType
  })
)

const text = computed(() => (store.lang === 'en' ? en : zh))

/** Change current language */
function changeLanguage() {
  const nextLang = store.lang === 'en' ? 'zh' : 'en'
  store.lang = nextLang
  storage.updateStore()
}

const showSettings = ref<boolean>(false)

watchEffect(() => {
  const isDarkMode = store.theme === 'dark'
  const isSystemDarkMode =
    store.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches

  document.documentElement.classList[isDarkMode || isSystemDarkMode ? 'add' : 'remove']('dark')
  document.body.style.setProperty('--font-size', `${store.fontSize}px`)

  storage.updateStore()
})

/**
 * Check whether the name is legal
 * @param _ Rule of this form item, but it's not used here
 * @param value The value of name input
 * @param cb Callback when validation passes or error occurs
 */
function nameValidator(_: any, value: string | undefined, cb: Function) {
  const name = value?.trim()

  if (!name) return cb(new Error(text.value.nameErrorMessageEmpty))
  else if (
    store.backups.find(backup => backup.type === backupFormState.type && backup.name === name)
  )
    return cb(new Error(text.value.nameErrorMessageDuplicate))
  else if (!/^.{3,36}$/.test(value)) return cb(new Error(text.value.nameErrorMessageLength))
  else if (/[\\/:*?"<>|]/.test(value)) return cb(new Error(text.value.nameErrorMessageIllegal))

  return cb()
}

const showBackUp = ref(false)
const backupFormRef = ref<FormInstance>()
const backupFormState = reactive<BackupData>({})

/** Close modal of backing up */
function closeBackUpModal() {
  backupFormRef.value.resetFields()
  showBackUp.value = false
}

/** Submit backing up form */
async function submitBackUp() {
  const isVerified = await backupFormRef.value.validate()
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
    ElMessageBox.confirm(text.value.quickBackUpMessage, {
      title: text.value.quickBackUp,
      type: 'warning',
      confirmButtonText: text.value.okText,
      cancelButtonText: text.value.cancelText
    })
  )
  if (canceled) return
  backUp({ type: currentGame.value })
}

/**
 * Back up an archive
 * @param data Current archived data and its naming and description by users
 */
async function backUp(data: BackupData) {
  const [err] = await to(storage.backUp(data))
  if (err) {
    ElMessage.error(text.value.backupFailed)
    return
  }
  ElMessage.success(text.value.backupSucceeded)
  store.backups = storage.store.backups
}

/**
 * Load backup and overwrite current archive
 * @param backup Backup to use
 */
async function loadBackup(backup: Backup) {
  const [canceled] = await to(
    ElMessageBox.confirm(text.value.loadMessage, {
      title: text.value.load,
      type: 'warning',
      confirmButtonText: text.value.okText,
      cancelButtonText: text.value.cancelText
    })
  )
  if (canceled) return
  const [err] = await to(storage.loadBackup(backup))
  if (err) {
    ElMessage.error(text.value.loadingFailed)
    return
  }
  ElMessage.success(text.value.loadingSucceeded)
}

const showUpdate = ref(false)
const updateFormRef = ref<FormInstance>()
const updateFormState = reactive<Backup>({} as Backup)

function showUpdateModal(backup: Backup) {
  Object.assign(updateFormState, backup)
  showUpdate.value = true
}

/** Close modal of updating */
function closeUpdateModal() {
  updateFormRef.value.resetFields()
  showUpdate.value = false
}

/** Submit updating form */
async function submitUpdate() {
  const isVerified = await updateFormRef.value.validate()
  if (!isVerified) return

  const [err] = await to(storage.updateBackup({ ...updateFormState }))
  if (err) {
    ElMessage.error(text.value.updateFailed)
    return
  }
  console.log(store.backups)
  ElMessage.success(text.value.updateSucceeded)
  store.backups = storage.store.backups
  closeUpdateModal()
}

/**
 * Remove backup
 * @param id Id of backup to remove
 */
async function removeBackup(id: string) {
  const [canceled] = await to(
    ElMessageBox.confirm(text.value.removeMessage, {
      title: text.value.remove,
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
      confirmButtonText: text.value.okText,
      cancelButtonText: text.value.cancelText
    })
  )
  if (canceled) return
  const [err] = await to(storage.removeBackup(id))
  if (err) {
    ElMessage.error(text.value.removalFailed)
    return
  }
  ElMessage.success(text.value.removalSucceeded)
  store.backups = storage.store.backups
}
</script>

<style lang="less">
body {
  --el-font-size-base: var(--font-size);
  --el-font-size-large: calc(var(--font-size) * 1.2);
  --el-border-radius-base: calc(var(--font-size) * 0.4);
  --el-message-close-size: calc(var(--font-size) * 1);
  --el-input-height: auto;

  font-size: var(--font-size);
  user-select: none;
}
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.el-button {
  padding: 0.5em 0.8em;
  height: auto;

  &.is-circle {
    width: auto;
  }
}
.el-input {
  line-height: 1.57;
}
.el-input__wrapper {
  padding: 0.4em 0.6em;
}
.el-input__inner {
  --el-input-inner-height: auto;
  line-height: inherit;
}
.el-input-number {
  line-height: 1.57;
}
.el-button + .el-button {
  margin-left: 0.5em;
}
.el-form--default.el-form--label-top .el-form-item .el-form-item__label {
  margin-bottom: 0.5em;
  line-height: 1.57;
}
</style>

<style lang="less" scoped>
.header {
  margin-bottom: 1em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.game-select {
  width: 11em;
}
.container {
  width: 50em;
  max-width: 90%;
  margin: 0 auto;
  padding: 1em;
}
.icon-btn {
  padding: 0.5em;

  svg {
    width: 1.5em;
    height: 1.5em;
  }
}
.language svg {
  fill: var(--el-text-color-primary);
}
.settings svg {
  stroke: var(--el-text-color-primary);
}
.list {
  margin-top: 1em;
  padding-bottom: 2em;

  li {
    padding: 0.8em 1em;
    display: flex;
    flex-direction: column;
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
      align-items: center;
      gap: 0.6em;
    }
    .actions {
      flex-shrink: 0;
    }
    .name {
      font-size: 1.2em;
      font-weight: bold;
      user-select: text;
      margin-right: 0.5em;
    }
    .description {
      color: #666;
      font-size: 0.8em;
      margin-top: 1em;
    }
  }
}
.empty {
  padding: 3em 0;
  text-align: center;
  color: var(--el-text-color-secondary);
}
</style>
