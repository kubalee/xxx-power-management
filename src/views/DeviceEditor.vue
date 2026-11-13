<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import AppDialog from '../components/AppDialog.vue'
import FieldControl from '../components/FieldControl.vue'
import { demoUnit, devices } from '../mock/platform.js'

const open = defineModel({ type: Boolean, required: true })
const props = defineProps({
  title: { type: String, required: true },
  device: { type: Object, default: null },
})
const emit = defineEmits(['save'])
const draft = reactive({ name: '', imei: '', unit: '', enabled: true, sim: '', remark: '', photoName: '' })
const error = ref('')
const photoUrl = ref('')

function releasePhoto() {
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photoUrl.value = ''
}

watch(open, (value) => {
  releasePhoto()
  if (!value) return
  const device = props.device
  Object.assign(draft, {
    name: device?.name ?? '', imei: device?.imei ?? '', unit: device?.unit ?? '',
    enabled: device?.enabled !== '停用', sim: device?.sim ?? '', remark: device?.remark ?? '',
    photoName: device?.photoName ?? '',
  })
  error.value = ''
})
onBeforeUnmount(releasePhoto)

function attachPhoto(event) {
  const photo = event.target.files[0]
  if (!photo) return
  releasePhoto()
  draft.photoName = photo.name
  photoUrl.value = URL.createObjectURL(photo)
}

function submit() {
  const name = draft.name.trim()
  const imei = draft.imei.trim()
  if (!name || !imei || !draft.unit) {
    error.value = '请填写设备名称、设备imei和所属单位'
    return
  }
  if (devices.some((device) => device.id !== props.device?.id && device.imei.toLowerCase() === imei.toLowerCase())) {
    error.value = '设备imei已存在'
    return
  }
  emit('save', { ...draft, name, imei, enabled: draft.enabled ? '启用' : '停用' })
  open.value = false
}
</script>

<template>
  <AppDialog v-model="open" :title="title" width="576px" light>
    <form id="device-editor" class="mg-form device-form" @submit.prevent="submit">
      <FieldControl v-model="draft.name" label="设备名称" required />
      <FieldControl v-model="draft.imei" label="设备imei" required />
      <FieldControl v-model="draft.unit" type="select" label="所属单位" placeholder="请选择" :options="[demoUnit]" required />
      <label class="mg-field switch-field">
        <span class="mg-field-label">启停</span>
        <input v-model="draft.enabled" class="device-switch" type="checkbox" role="switch" />
      </label>
      <FieldControl v-model="draft.sim" label="物联网卡号" />
      <FieldControl v-model="draft.remark" label="备注" type="textarea" />
      <label class="mg-field upload-field">
        <span class="mg-field-label">照片上传</span>
        <span class="device-upload">
          <img v-if="photoUrl" :src="photoUrl" alt="照片预览" />
          <span v-else class="upload-zoom" aria-hidden="true"></span>
          <input type="file" accept="image/*" aria-label="选择照片" @change="attachPhoto" />
        </span>
      </label>
      <p v-if="draft.photoName" class="photo-name">{{ draft.photoName }}</p>
      <p v-if="error" class="mg-error" role="alert">{{ error }}</p>
    </form>
    <template #actions>
      <button type="submit" form="device-editor" class="mg-button primary">确 定</button>
      <button type="button" class="mg-button" @click="open = false">取 消</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.device-form { padding: 12px 20px 14px; }
.device-form :deep(.mg-field-label) { width: 70px; }
.device-form :deep(.mg-field) { margin-bottom: 12px; }
.switch-field { min-height: 36px; }
.device-switch {
  appearance: none;
  width: 40px;
  height: 22px;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-muted);
  padding: 2px;
  cursor: pointer;
}
.device-switch::before { content: ''; display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--color-surface); }
.device-switch:checked { background: var(--color-positive); border-color: var(--color-positive); }
.device-switch:checked::before { margin-left: auto; }
.upload-field { align-items: start; }
.upload-field .mg-field-label { padding-top: 8px; }
.device-upload {
  position: relative;
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  overflow: hidden;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-canvas);
  color: var(--color-muted);
}
.device-upload:hover { border-color: var(--color-primary); color: var(--color-primary); }
.device-upload:focus-within { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.upload-zoom::before { content: '\e777'; font: 22px "Element Icons"; }
.device-upload img { width: 100%; height: 100%; object-fit: cover; }
.device-upload input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.photo-name { margin: -4px 0 8px 82px; color: var(--color-muted); overflow-wrap: anywhere; }

@media (max-width: 1023px) {
  .device-form { padding-inline: 14px; }
  .device-form :deep(.mg-field-label) { width: 68px; }
  .device-upload { width: 96px; height: 96px; }
}
</style>
