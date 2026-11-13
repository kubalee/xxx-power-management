import { shallowRef } from 'vue'

export const notification = shallowRef(null)
let timeout

export function notify(message, tone = 'success') {
  clearTimeout(timeout)
  notification.value = { message, tone }
  timeout = setTimeout(() => { notification.value = null }, 2800)
}
