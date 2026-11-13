<script setup>
import { computed, ref, watch } from 'vue'
import AppDialog from '../components/AppDialog.vue'
import { updateDemoPassword } from '../mock/session.js'

const open = defineModel({ type: Boolean, required: true })
const emit = defineEmits(['reset'])

const step = ref(0)
const phone = ref('')
const code = ref('')
const newPassword = ref('')
const message = ref('')
const titles = ['忘记密码', '输入验证码', '重置密码']
const title = computed(() => titles[step.value])

watch(open, (value) => {
  if (value) return
  step.value = 0
  phone.value = ''
  code.value = ''
  newPassword.value = ''
  message.value = ''
})

function advance() {
  message.value = ''
  if (step.value === 0) {
    if (!/^1\d{10}$/.test(phone.value.trim())) {
      message.value = '请输入正确的手机号'
      return
    }
    step.value = 1
    return
  }
  if (step.value === 1) {
    if (code.value !== '123456') {
      message.value = '请输入正确验证码'
      return
    }
    step.value = 2
    return
  }
  if (newPassword.value.length < 6) {
    message.value = '密码至少需要6位'
    return
  }
  updateDemoPassword(newPassword.value)
  emit('reset')
  open.value = false
}
</script>

<template>
  <AppDialog v-model="open" :title="title" width="420px" light-backdrop>
    <form class="recovery-form" @submit.prevent="advance">
      <input
        v-if="step === 0"
        v-model="phone"
        type="tel"
        inputmode="numeric"
        autocomplete="off"
        maxlength="11"
        aria-label="手机号"
        placeholder="手机号"
      />
      <template v-else-if="step === 1">
        <p class="recovery-tip">本地演示验证码为 123456</p>
        <input v-model="code" inputmode="numeric" maxlength="6" aria-label="验证码" placeholder="验证码" />
      </template>
      <input
        v-else
        v-model="newPassword"
        type="password"
        autocomplete="new-password"
        aria-label="新密码"
        placeholder="密码"
      />
      <p v-if="message" class="recovery-error" role="alert">{{ message }}</p>
      <button type="submit" class="recovery-next">{{ step === 2 ? '确定' : '下一步' }}</button>
    </form>
  </AppDialog>
</template>

<style scoped>
.recovery-form { padding: 22px 24px 26px; }
.recovery-form input {
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding-inline: 12px;
  background: var(--color-surface-alt);
  color: var(--color-text);
  font-size: 16px;
}
.recovery-form input::placeholder { color: var(--color-placeholder); }
.recovery-form input:focus { outline: 0; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
.recovery-next {
  min-height: 42px;
  margin-top: 18px;
  padding: 0 18px;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.recovery-next:hover { background: var(--color-primary-hover); }
.recovery-tip { color: var(--color-muted); margin-bottom: 10px; }
.recovery-error { color: var(--color-danger); margin-top: 8px; }

@media (max-width: 1023px) {
  .recovery-form { padding-inline: 16px; }
  .recovery-next { min-height: 44px; }
}
</style>
