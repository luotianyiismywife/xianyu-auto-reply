/**
 * 关于页面
 *
 * 功能：
 * 1. 显示系统信息与当前版本
 * 2. 显示主要功能介绍
 * 3. 显示贡献者和相关链接
 */
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowUpCircle, BarChart3, Bell, Bot, Code, Github,
  Globe, Loader2, MessageSquare, RefreshCw, Truck,
  UserCheck,
} from 'lucide-react'
import { checkUpdate, type VersionCheckResult } from '@/api/version'
import { useUIStore } from '@/store/uiStore'
import { useVersionStore } from '@/store/versionStore'
import { UpdateModal } from './UpdateModal'

export function About() {
  const { addToast } = useUIStore()
  // 版本号统一由 versionStore 提供，与侧边栏共享同一取值
  const { currentVersion, setCurrentVersion, fetchCurrentVersion } = useVersionStore()

  const [totalUsers, setTotalUsers] = useState(0)

  // 版本检测状态
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResult | null>(null)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  /**
   * 检查是否有新版本
   *
   * @param silent 静默模式。true=页面挂载时自动检查不弹 toast；false=用户手动点击需弹提示
   */
  const handleCheckUpdate = useCallback(async (silent = false) => {
    setCheckingUpdate(true)
    try {
      const result = await checkUpdate()
      const data = result.data

      // 无论成功或失败，后端都会返回 current_version，优先更新本地显示
      if (data?.current_version) {
        setCurrentVersion(data.current_version)
      }

      if (!result.success) {
        if (!silent) {
          addToast({ type: 'error', message: result.message || '检查更新失败' })
        }
        return
      }

      if (!data) {
        if (!silent) {
          addToast({ type: 'error', message: '更新服务器未返回有效数据' })
        }
        return
      }

      if (data.has_update) {
        setUpdateInfo(data)
        setHasUpdate(true)
        if (!silent) {
          setShowUpdateModal(true)
        }
      } else {
        setHasUpdate(false)
        setUpdateInfo(null)
        if (!silent) {
          addToast({
            type: 'success',
            message: `当前已是最新版本 v${data.current_version}`,
          })
        }
      }
    } finally {
      setCheckingUpdate(false)
    }
  }, [addToast, setCurrentVersion])

  useEffect(() => {
    // 获取使用人数
    fetch('/project-stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.total_users) {
          setTotalUsers(data.total_users)
        }
      })
      .catch(() => {})

    // 先取本地版本号兜底（store 有缓存时不重复请求），保证远程检查更新失败时也能显示当前版本
    fetchCurrentVersion()

    // 页面挂载时静默检查版本（失败不弹 toast，避免无网环境干扰用户）
    handleCheckUpdate(true)
  }, [handleCheckUpdate, fetchCurrentVersion])

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-4 flex items-center justify-center shadow-md">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          闲鱼自动回复管理系统
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          智能管理您的闲鱼店铺，提升客服效率
        </p>
        {/* 版本和使用人数 */}
        <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
          {currentVersion && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>v{currentVersion}</span>
            </div>
          )}
          {hasUpdate && updateInfo && (
            <button
              type="button"
              onClick={() => setShowUpdateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:from-amber-500/20 dark:to-orange-500/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/30 hover:from-amber-500/20 hover:to-orange-500/20 transition-all cursor-pointer"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>有更新 v{updateInfo.remote_version}</span>
            </button>
          )}
          {totalUsers > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:from-blue-500/20 dark:to-cyan-500/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/30">
              <Globe className="w-3.5 h-3.5" />
              <span>{totalUsers.toLocaleString()} 人使用</span>
            </div>
          )}
        </div>
        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => handleCheckUpdate(false)}
            disabled={checkingUpdate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingUpdate ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{checkingUpdate ? '检查中...' : '检查更新'}</span>
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="vben-card">
        <div className="vben-card-header">
          <h2 className="vben-card-title">主要功能</h2>
        </div>
        <div className="vben-card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { title: '多账号管理', desc: '同时管理多个账号', icon: UserCheck, color: 'text-blue-500' },
              { title: '智能回复', desc: '关键词自动回复', icon: MessageSquare, color: 'text-green-500' },
              { title: 'AI 助手', desc: '智能处理复杂问题', icon: Bot, color: 'text-purple-500' },
              { title: '自动发货', desc: '支持卡密发货', icon: Truck, color: 'text-orange-500' },
              { title: '消息通知', desc: '多渠道推送', icon: Bell, color: 'text-pink-500' },
              { title: '数据统计', desc: '订单商品分析', icon: BarChart3, color: 'text-cyan-500' },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{feature.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Contributors */}
      <div className="vben-card">
        <div className="vben-card-header">
          <h2 className="vben-card-title">
            <Code className="w-4 h-4" />
            贡献者
          </h2>
        </div>
        <div className="vben-card-body">
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/zhinianboke"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Github className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">zhinianboke</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">项目作者</span>
            </a>
            <a
              href="https://github.com/legeling"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Github className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">legeling</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">前端重构</span>
            </a>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="vben-card">
        <div className="vben-card-header">
          <h2 className="vben-card-title">相关链接</h2>
        </div>
        <div className="vben-card-body">
          <div className="flex gap-3">
            <a
              href="https://pan.quark.cn/s/deaafecd8824"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
            >
              <span>Windows本地版</span>
            </a>
            <a
              href="https://github.com/zhinianboke/xianyu-auto-reply"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* 更新详情弹窗（组件内已处理仅关闭按钮退出） */}
      {showUpdateModal && updateInfo && (
        <UpdateModal info={updateInfo} onClose={() => setShowUpdateModal(false)} />
      )}
    </div>
  )
}
