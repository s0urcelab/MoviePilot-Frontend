import type { Plugin } from '@/api/types'

const RECENT_PLUGINS_KEY = 'moviepilot_recent_plugins'
const MAX_RECENT_PLUGINS = 5

interface RecentPlugin {
  id: string
  plugin_name: string
  plugin_icon?: string
  has_page: boolean
  state: boolean
  plugin_id: string
  access_time: number
}

// 将Plugin转换为RecentPlugin
function pluginToRecentPlugin(plugin: Plugin): RecentPlugin {
  return {
    id: plugin.id || '',
    plugin_name: plugin.plugin_name || '',
    plugin_icon: plugin.plugin_icon,
    has_page: plugin.has_page || false,
    state: plugin.state || false,
    plugin_id: plugin.plugin_id || '',
    access_time: Date.now(),
  }
}

// 将RecentPlugin转换为Plugin
function recentPluginToPlugin(recentPlugin: RecentPlugin): Plugin {
  return {
    id: recentPlugin.id,
    plugin_name: recentPlugin.plugin_name,
    plugin_icon: recentPlugin.plugin_icon,
    has_page: recentPlugin.has_page,
    state: recentPlugin.state,
    plugin_id: recentPlugin.plugin_id,
  } as Plugin
}

export function useRecentPlugins() {
  // 获取最近访问的插件
  function getRecentPlugins(): Plugin[] {
    try {
      const stored = localStorage.getItem(RECENT_PLUGINS_KEY)
      if (!stored) return []

      const recentPlugins: RecentPlugin[] = JSON.parse(stored)

      // 按访问时间倒序排列
      return recentPlugins.sort((a, b) => b.access_time - a.access_time).map(recentPluginToPlugin)
    } catch (error) {
      console.error('获取最近访问插件失败:', error)
      return []
    }
  }

  // 添加插件到最近访问
  function addRecentPlugin(plugin: Plugin) {
    try {
      if (!plugin.id || !plugin.has_page) return

      const stored = localStorage.getItem(RECENT_PLUGINS_KEY)
      let recentPlugins: RecentPlugin[] = stored ? JSON.parse(stored) : []

      // 移除已存在的相同插件（如果有的话）
      recentPlugins = recentPlugins.filter(p => p.id !== plugin.id)

      // 添加新的插件到开头
      recentPlugins.unshift(pluginToRecentPlugin(plugin))

      // 限制最大数量
      if (recentPlugins.length > MAX_RECENT_PLUGINS) {
        recentPlugins = recentPlugins.slice(0, MAX_RECENT_PLUGINS)
      }

      localStorage.setItem(RECENT_PLUGINS_KEY, JSON.stringify(recentPlugins))
    } catch (error) {
      console.error('保存最近访问插件失败:', error)
    }
  }

  // 清除所有最近访问记录
  function clearRecentPlugins() {
    try {
      localStorage.removeItem(RECENT_PLUGINS_KEY)
    } catch (error) {
      console.error('清除最近访问插件失败:', error)
    }
  }

  // 移除特定插件
  function removeRecentPlugin(pluginId: string) {
    try {
      const stored = localStorage.getItem(RECENT_PLUGINS_KEY)
      if (!stored) return

      let recentPlugins: RecentPlugin[] = JSON.parse(stored)
      recentPlugins = recentPlugins.filter(p => p.id !== pluginId)

      localStorage.setItem(RECENT_PLUGINS_KEY, JSON.stringify(recentPlugins))
    } catch (error) {
      console.error('移除最近访问插件失败:', error)
    }
  }

  return {
    getRecentPlugins,
    addRecentPlugin,
    clearRecentPlugins,
    removeRecentPlugin,
  }
}
