<template>
  <div class="container">
    <!-- Header buttons -->
    <header class="header">
      <el-button type="primary" @click="quickBackup">{{ text.quickBackUp }}</el-button>
      <el-button type="primary" @click="showBackup = true">{{ text.backUp }}</el-button>
      <el-button type="primary" @click="changeLanguage">
        <icon-english v-if="lang === 'en'" />
        <icon-chinese v-else-if="lang === 'zh'" />
      </el-button>
    </header>

    <!-- Search -->
    <el-input v-model="search" autocomplete="false" :placeholder="text.searchPlaceholder" />

    <!-- List -->
    <ul class="list">
      <li v-for="save in filteredSaves">
        <header>
          <!-- Title of item -->
          <div class="name">{{ save.name }}</div>

          <!-- Action buttons -->
          <div class="actions">
            <el-button type="primary" @click="loadSave(save)">{{ text.load }}</el-button>
            <el-button type="danger" @click="removeSave(save.id)">{{ text.remove }}</el-button>
          </div>
        </header>

        <!-- Description of item -->
        <div class="description">{{ save.description }}</div>
      </li>

      <!-- Empty block -->
      <div class="empty" v-if="!filteredSaves.length">{{ text.empty }}</div>
    </ul>
  </div>

  <!-- handleBackingUp dialog -->
  <el-dialog
    v-model="showBackup"
    :title="text.backUp"
    draggable
    align-center
    @close="closeBackupModal"
    @submit.prevent="submitBackup"
  >
    <!-- Form -->
    <el-form :model="backupFormState" ref="formRef" label-position="top">
      <!-- Name -->
      <el-form-item
        :label="text.nameLabel"
        prop="name"
        :rules="[{ required: true, validator: nameValidator }]"
      >
        <el-input v-model="backupFormState.name" :placeholder="text.namePlaceholder" />
      </el-form-item>

      <!-- Description -->
      <el-form-item :label="text.descriptionLabel" prop="description">
        <el-input
          v-model="backupFormState.description"
          type="textarea"
          :placeholder="text.descriptionPlaceholder"
          rows="5"
          resize="none"
        />
      </el-form-item>

      <!-- Buttons -->
      <el-button type="primary" native-type="submit">{{ text.submitText }}</el-button>
      <el-button @click="closeBackupModal">{{ text.cancelText }}</el-button>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import IconChinese from './components/IconChinese.vue'
import IconEnglish from './components/IconEnglish.vue'
import { to } from './utils'
import { SaveManager, Save, BackupData } from './utils/SaveManager'
import { getText, Lang } from './i18n'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

const lang = ref<Lang>('en')
const text = computed(() => getText(lang.value))

const search = ref<string>('')
const saves = ref<Save[]>([])
const filteredSaves = computed(() =>
  saves.value.filter(save =>
    save.name.toLowerCase().includes(search.value.trim().toLocaleLowerCase())
  )
)

const showBackup = ref<boolean>(false)
const formRef = ref<FormInstance>()
const backupFormState = reactive<BackupData>({})

onMounted(() => {
  const defaultRootFontSize = 16
  const rootFontSize = localStorage.getItem('rootFontSize') || defaultRootFontSize
  document.body.style.setProperty('--font-size', `${rootFontSize}px`)

  getSaves()
})

function changeLanguage() {
  lang.value = lang.value === 'en' ? 'zh' : 'en'
}

function closeBackupModal() {
  showBackup.value = false
  formRef.value?.resetFields()
}

function nameValidator(_, value: string | undefined, cb: Function) {
  if (!value?.trim()) return cb(new Error(text.value.nameErrorMessageEmpty))
  if (!/^.{3,36}$/.test(value)) return cb(new Error(text.value.nameErrorMessageLength))
  if (/[\\/:*?"<>|]/.test(value)) return cb(new Error(text.value.nameErrorMessageIllegal))
  cb()
}

async function submitBackup() {
  const form = formRef.value
  if (!form) return
  if (!(await form.validate())) return
  handleBackingUp({ ...backupFormState })
}

async function quickBackup() {
  const [err] = await to(
    ElMessageBox.confirm(text.value.quickBackUpMessage, {
      title: text.value.quickBackUp,
      type: 'warning',
      confirmButtonText: text.value.okText,
      cancelButtonText: text.value.cancelText
    })
  )
  if (err) return
  handleBackingUp({})
}

async function handleBackingUp(data: BackupData) {
  const [err, save] = await to(SaveManager.backup(saves.value, data))
  if (err) {
    ElMessage.error(text.value.backupFailed)
    return false
  }
  ElMessage.success(text.value.backupSucceeded)
  saves.value.push(save)
  closeBackupModal()
}

async function getSaves() {
  const [err, data] = await to(SaveManager.getAll())
  if (err) {
    ElMessage.error(text.value.gettingSavesFailed)
    return
  }
  saves.value = data
}

async function loadSave(save: Save) {
  const [canceled] = await to(
    ElMessageBox.confirm(text.value.loadMessage, {
      title: text.value.load,
      type: 'warning',
      confirmButtonText: text.value.okText,
      cancelButtonText: text.value.cancelText
    })
  )
  if (canceled) return
  const [err] = await to(SaveManager.load(save))
  ElMessage({
    message: text.value[err ? 'loadingFailed' : 'loadingSucceeded'],
    type: err ? 'error' : 'success'
  })
}

async function removeSave(id: string) {
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
  const [err, nextSaves] = await to(SaveManager.remove(saves.value, id))
  if (err) {
    ElMessage({
      message: text.value.removalFailed,
      type: 'error'
    })
  } else {
    ElMessage({
      message: text.value.removalSucceeded,
      type: 'success'
    })
    saves.value = nextSaves
  }
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
svg {
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
