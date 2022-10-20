<template>
  <div class="container">
    <!-- Header buttons -->
    <header class="header">
      <el-button type="primary" @click="quickBackup">Quick Backup</el-button>
      <el-button type="primary" @click="showBackup = true">Backup</el-button>
    </header>

    <!-- Search -->
    <el-input v-model="search" autocomplete="false" placeholder="Search here..." />

    <!-- List -->
    <ul class="list">
      <li v-for="save in filteredSaves">
        <header>
          <!-- Title of item -->
          <div class="name">{{ save.name }}</div>

          <!-- Action buttons -->
          <div class="actions">
            <el-button type="primary" @click="loadSave(save.id)">Load</el-button>
            <el-button type="danger" @click="removeSave(save.id)">Remove</el-button>
          </div>
        </header>

        <!-- Description of item -->
        <div class="description">{{ save.description }}</div>
      </li>

      <!-- Empty block -->
      <div class="empty" v-if="!filteredSaves.length">No save found</div>
    </ul>
  </div>

  <!-- Backup dialog -->
  <el-dialog
    v-model="showBackup"
    title="Backup"
    draggable
    align-center
    @close="closeBackupModal"
    @submit.prevent="submitBackup"
  >
    <!-- Form -->
    <el-form :model="backupFormState" ref="formRef" label-position="top">
      <!-- Name -->
      <el-form-item
        label="name"
        prop="name"
        :rules="[{ required: true, validator: nameValidator }]"
      >
        <el-input v-model="backupFormState.name" placeholder="Save name..." />
      </el-form-item>

      <!-- Description -->
      <el-form-item label="description" prop="description">
        <el-input
          class="textarea"
          v-model="backupFormState.description"
          type="textarea"
          placeholder="Some description..."
          rows="5"
          resize="none"
        />
      </el-form-item>

      <!-- Buttons -->
      <el-button type="primary" native-type="submit">Submit</el-button>
      <el-button @click="closeBackupModal">Cancel</el-button>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import debounce from 'lodash.debounce'
import { to } from './utils'
import { Save, BackupData } from '../electron/saves'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

const { rendererInvoke } = window.electron

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

function closeBackupModal() {
  backupFormState.name = undefined
  backupFormState.type = undefined
  backupFormState.description = undefined
  showBackup.value = false
}

function nameValidator(_, value: string | undefined, cb: Function) {
  if (!value?.trim()) return cb(new Error('name is required'))
  if (!/^.{3,36}$/.test(value))
    return cb(new Error('The length of the name should be between 3 and 36'))
  if (/[\\/:*?"<>|]/.test(value))
    return cb(new Error('Save name can not include \\ / : * ? " < > |'))
  cb()
}

async function submitBackup() {
  const form = formRef.value
  if (!form) return
  if (!(await form.validate())) return
  backup({ ...backupFormState })
}

async function quickBackup() {
  const [err] = await to(
    ElMessageBox.confirm('This will craete a backup named by timestamp', {
      title: 'Quick back?',
      type: 'warning'
    })
  )
  if (err) return
  backup({})
}

async function backup(data: BackupData) {
  const [reason, save] = await rendererInvoke<[false, Save] | [string]>('BACKUP', data)
  if (reason) {
    ElMessage.error('Backup failed, please try later')
    return false
  }

  ElMessage.success('Backup success!')
  saves.value.push(save)
  closeBackupModal()
}

async function getSaves() {
  const [failed, data] = await rendererInvoke<[false, Save[]] | [true]>('GET_SAVE_LIST')
  if (failed) {
    // modal error: Get save list failed
    return
  }

  saves.value = data
}

async function loadSave(id: string) {
  const [err] = await to(
    ElMessageBox.confirm(
      `This will overwrite your current archive and it's irreversible, please confirm that you have backed up`,
      {
        title: 'Load Save',
        type: 'warning'
      }
    )
  )
  if (err) return
  const result = await rendererInvoke<boolean>('LOAD', id)
  ElMessage({
    message: result ? 'Load success!' : 'Load failed, please try later',
    type: result ? 'success' : 'error'
  })
}

async function removeSave(id: string) {
  const [err] = await to(
    ElMessageBox.confirm('Remove this archive (irreversible)', {
      title: 'Remove backup',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
  )
  if (err) return
  const result = await rendererInvoke('REMOVE', id)
  if (result) {
    ElMessage({
      message: 'Remove success!',
      type: 'error'
    })
    getSaves()
  } else {
    ElMessage({
      message: 'Remove failed, please try later',
      type: 'error'
    })
  }
}
</script>

<style>
body {
  font-size: var(--font-size);
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
