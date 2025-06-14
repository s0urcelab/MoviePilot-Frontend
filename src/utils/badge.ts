/**
 * PWA 徽章管理工具
 */

// 全局事件类型
interface UnreadMessageEvent extends CustomEvent {
  detail: { count: number }
}

// 发送全局未读消息事件
export function emitUnreadMessageEvent(count: number) {
  const event = new CustomEvent('unreadMessage', { detail: { count } }) as UnreadMessageEvent
  window.dispatchEvent(event)
}

// 监听全局未读消息事件
export function onUnreadMessage(callback: (count: number) => void) {
  const handler = (event: Event) => {
    const unreadEvent = event as UnreadMessageEvent
    callback(unreadEvent.detail.count)
  }
  window.addEventListener('unreadMessage', handler)
  return () => window.removeEventListener('unreadMessage', handler)
}

// 等待Service Worker准备就绪
export async function waitForServiceWorker(): Promise<ServiceWorker | null> {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  // 如果已经有激活的Service Worker，直接返回
  if (navigator.serviceWorker.controller) {
    return navigator.serviceWorker.controller
  }

  // 等待Service Worker注册和激活，最多等待10秒
  return new Promise(resolve => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let resolved = false

    const resolveOnce = (sw: ServiceWorker | null) => {
      if (resolved) return
      resolved = true
      if (timeoutId) clearTimeout(timeoutId)
      resolve(sw)
    }

    const checkServiceWorker = () => {
      if (navigator.serviceWorker.controller) {
        resolveOnce(navigator.serviceWorker.controller)
      } else {
        setTimeout(checkServiceWorker, 200)
      }
    }

    // 监听Service Worker变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      resolveOnce(navigator.serviceWorker.controller)
    })

    // 设置超时，10秒后返回null
    timeoutId = setTimeout(() => {
      resolveOnce(null)
    }, 10000)

    checkServiceWorker()
  })
}

// 应用启动时检查未读消息数量
export async function checkUnreadOnStartup(): Promise<number> {
  try {
    // 检查Service Worker是否可用
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return 0
    }

    // 获取未读消息数量
    const unreadCount = await getUnreadCount()
    return unreadCount
  } catch (error) {
    return 0
  }
}

// 应用启动检查并触发事件
export async function checkAndEmitUnreadMessages() {
  try {
    const count = await checkUnreadOnStartup()
    if (count > 0) {
      emitUnreadMessageEvent(count)
    }
  } catch (error) {
    // 静默处理错误
  }
}

// 清除桌面图标徽章
export async function clearAppBadge(): Promise<boolean> {
  try {
    // 如果浏览器支持原生Badge API，直接调用
    if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge()
    }

    // 向service worker发送清除徽章消息
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()

      return new Promise(resolve => {
        messageChannel.port1.onmessage = event => {
          resolve(event.data.success)
        }

        navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_BADGE' }, [messageChannel.port2])
      })
    }

    return true
  } catch (error) {
    console.error('Failed to clear app badge:', error)
    return false
  }
}

// 更新桌面图标徽章数量
export async function updateAppBadge(count: number): Promise<boolean> {
  try {
    // 如果浏览器支持原生Badge API，直接调用
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await navigator.setAppBadge(count)
      } else {
        await navigator.clearAppBadge()
      }
    }

    // 向service worker发送更新徽章消息
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()

      return new Promise(resolve => {
        messageChannel.port1.onmessage = event => {
          resolve(event.data.success)
        }

        navigator.serviceWorker.controller?.postMessage({ type: 'UPDATE_BADGE', count }, [messageChannel.port2])
      })
    }

    return true
  } catch (error) {
    console.error('Failed to update app badge:', error)
    return false
  }
}

// 获取Service Worker中的未读消息数量
export async function getUnreadCount(): Promise<number> {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()

      return new Promise(resolve => {
        messageChannel.port1.onmessage = event => {
          resolve(event.data.count || 0)
        }

        navigator.serviceWorker.controller?.postMessage({ type: 'GET_UNREAD_COUNT' }, [messageChannel.port2])
      })
    }

    return 0
  } catch (error) {
    console.error('Failed to get unread count:', error)
    return 0
  }
}

// 检查浏览器是否支持Badge API
export function supportsBadgeAPI(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator
}
