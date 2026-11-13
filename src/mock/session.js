export const demoAccount = 'demo'
export const defaultDemoPassword = 'demo2026'
export const demoUser = '演'

const sessionKey = 'xxx-power-management-session'
let demoPassword = defaultDemoPassword
let signedIn = false

export function currentDemoPassword() {
  return demoPassword
}

export function updateDemoPassword(password) {
  demoPassword = password
}

export function hasSession() {
  return signedIn
    || sessionStorage.getItem(sessionKey) === 'active'
    || localStorage.getItem(sessionKey) === 'active'
}

export function signIn(account, password, remember) {
  if (account.trim() !== demoAccount || password !== demoPassword) return false

  signedIn = true
  localStorage.removeItem(sessionKey)
  sessionStorage.removeItem(sessionKey)
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(sessionKey, 'active')
  return true
}

export function signOut() {
  signedIn = false
  sessionStorage.removeItem(sessionKey)
  localStorage.removeItem(sessionKey)
}
