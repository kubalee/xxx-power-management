<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PasswordRecovery from './PasswordRecovery.vue'
import { brandName } from '../branding.js'
import { currentDemoPassword, demoAccount, signIn } from '../mock/session.js'
import brandMark from '../assets/brand-mark.png'
import distributionRoom from '../assets/login-distribution-room.jpg'

const router = useRouter()
const route = useRoute()
const account = ref(demoAccount)
const password = ref(currentDemoPassword())
const remember = ref(true)
const recoveryOpen = ref(false)
const message = ref('')
const isError = ref(false)

function enter() {
  if (!signIn(account.value, password.value, remember.value)) {
    isError.value = true
    message.value = account.value && password.value ? '账号或密码错误' : '请输入账号和密码'
    return
  }
  const target = route.query.redirect
  if (typeof target === 'string' && target.startsWith('/') && router.resolve(target).meta.requiresSession) {
    router.replace(target)
    return
  }
  router.replace({ name: 'home' })
}

function onReset() {
  password.value = ''
  isError.value = false
  message.value = '演示密码已重置'
}
</script>

<template>
  <main class="login-page">
    <div class="login-layout">
      <div class="login-visual">
        <img class="login-photo" :src="distributionRoom" alt="" />
        <h1 class="login-title"><img :src="brandMark" alt="" /><span>{{ brandName }}</span></h1>
      </div>
      <section class="login-frame" aria-labelledby="login-heading">
        <form class="login-form" autocomplete="off" @submit.prevent="enter" @input="message = ''">
          <h2 id="login-heading">登录系统</h2>

          <label class="login-label" for="login-account">账号</label>
          <div class="login-field">
            <input id="login-account" v-model="account" placeholder="请输入账号" autocomplete="off" />
            <button v-if="account" type="button" class="field-clear" aria-label="清空账号" @click="account = ''"><span aria-hidden="true"></span></button>
          </div>

          <label class="login-label" for="login-password">密码</label>
          <div class="login-field">
            <input id="login-password" v-model="password" type="password" placeholder="请输入密码" autocomplete="new-password" />
            <button v-if="password" type="button" class="field-clear" aria-label="清空密码" @click="password = ''"><span aria-hidden="true"></span></button>
          </div>

          <div class="login-options">
            <label><input v-model="remember" type="checkbox" />保持登录</label>
            <button type="button" class="forgot-password" @click="recoveryOpen = true">忘记密码</button>
          </div>
          <button type="submit" class="login-submit">登录</button>
          <p v-if="message" :class="['login-message', { error: isError }]" role="status">{{ message }}</p>
        </form>
      </section>
    </div>

    <PasswordRecovery v-model="recoveryOpen" @reset="onReset" />
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  place-items: center;
  min-height: var(--stage-height);
  padding: 36px 24px;
  background: #edf2f8;
}
.login-layout {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  width: min(1220px, 100%);
  min-height: 650px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: 0 18px 55px rgb(25 40 61 / 10%);
}
.login-visual { position: relative; isolation: isolate; min-width: 0; background: var(--color-nav); color: #fff; }
.login-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 55%; z-index: -2; }
.login-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(150deg, rgb(10 23 41 / 62%), transparent 64%);
}
.login-title {
  display: inline-flex;
  align-items: center;
  gap: 13px;
  margin: 34px 30px;
  font-size: 25px;
  font-weight: 700;
}
.login-title img { width: 45px; height: 45px; }
.login-frame { display: grid; place-items: center; padding: 46px; min-width: 0; }
.login-form { width: min(390px, 100%); }
.login-form h2 { margin-bottom: 33px; font-size: 33px; font-weight: 700; line-height: 1.3; }
.login-label { display: block; margin: 18px 0 8px; color: var(--color-text); font-size: 14px; font-weight: 600; }
.login-field { position: relative; }
.login-field input {
  width: 100%;
  min-height: 49px;
  padding: 0 45px 0 13px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface-alt);
  color: var(--color-text);
  font-size: 16px;
}
.login-field input::placeholder { color: var(--color-placeholder); }
.login-field input:focus { border-color: var(--color-primary); outline: 0; box-shadow: 0 0 0 3px var(--color-primary-soft); }
.field-clear {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 7px;
  color: var(--color-placeholder);
}
.field-clear:hover { color: var(--color-text); }
.field-clear span::before { content: '\e6db'; font: 16px "Element Icons"; }
.login-options { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 13px 0 16px; color: var(--color-muted); }
.login-options label { display: flex; align-items: center; gap: 8px; min-height: 40px; cursor: pointer; }
.login-options input { width: 16px; height: 16px; margin: 0; accent-color: var(--color-primary); }
.forgot-password { min-height: 40px; color: var(--color-primary); font-weight: 550; }
.forgot-password:hover { text-decoration: underline; }
.login-submit {
  width: 100%;
  min-height: 49px;
  border-radius: var(--radius-control);
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 650;
}
.login-submit:hover { background: var(--color-primary-hover); }
.login-message { margin-top: 12px; color: var(--color-positive); font-size: 13px; }
.login-message.error { color: var(--color-danger); }

@media (max-width: 1023px) {
  .login-layout { min-height: 530px; }
  .login-frame { padding: 34px; }
}
@media (max-width: 680px) {
  .login-page { padding: 18px; }
  .login-layout { grid-template-columns: minmax(0, 1fr); width: min(430px, 100%); min-height: 0; border-radius: 19px; }
  .login-visual { min-height: 145px; }
  .login-photo { object-position: center 37%; }
  .login-title { margin: 21px 20px; gap: 9px; font-size: 20px; }
  .login-title img { width: 36px; height: 36px; }
  .login-frame { padding: 26px 21px 30px; }
  .login-form h2 { margin-bottom: 21px; font-size: 26px; }
  .login-options label, .forgot-password { min-height: 44px; }
}
</style>
