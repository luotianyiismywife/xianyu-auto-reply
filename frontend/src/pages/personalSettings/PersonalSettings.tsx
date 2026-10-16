/**
 * 个人设置页面
 *
 * 功能：
 * 1. 显示账户信息（用户名/角色）
 * 2. 联系方式设置
 * 3. 重发货触发关键字
 * 4. 修改登录密码
 * 5. 位置聊天远程URL配置
 */
import { useState, useEffect } from 'react'
import { User, RefreshCw, Key, Save, Package, Link2 } from 'lucide-react'
import { getUserSetting, updateUserSetting, changePassword, testLocationChatRemoteApi } from '@/api/settings'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { PageLoading, ButtonLoading } from '@/components/common/Loading'

const CONTACT_WECHAT_KEY = 'contact_wechat'
const CONTACT_QQ_KEY = 'contact_qq'
const REDELIVERY_TRIGGER_KEYWORD_KEY = 'redelivery_trigger_keyword'
const LOCATION_CHAT_REMOTE_URL_KEY = 'location_chat.remote_url'
const LOCATION_CHAT_REMOTE_SECRET_KEY = 'location_chat.remote_secret_key'
const DEFAULT_LOCATION_CHAT_REMOTE_URL = 'https://api.xianyushop.shop/api/external/invoke'

export function PersonalSettings() {
  const { addToast } = useUIStore()
  const { isAuthenticated, token, _hasHydrated, user, clearAuth } = useAuthStore()
  const [loading, setLoading] = useState(true)

  // 联系方式状态
  const [contactWechat, setContactWechat] = useState('')
  const [contactQQ, setContactQQ] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  // 重发货触发关键字状态
  const [redeliveryKeyword, setRedeliveryKeyword] = useState('')
  const [savingRedeliveryKeyword, setSavingRedeliveryKeyword] = useState(false)

  // 密码修改状态
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'remote'>('basic')
  const [locationRemoteUrl, setLocationRemoteUrl] = useState('')
  const [locationRemoteSecretKey, setLocationRemoteSecretKey] = useState('')
  const [testingLocationRemote, setTestingLocationRemote] = useState(false)
  const [savingLocationRemote, setSavingLocationRemote] = useState(false)

  // 加载个人设置
  const loadSettings = async () => {
    if (!_hasHydrated || !isAuthenticated || !token) return
    try {
      setLoading(true)
      // 加载重发货触发关键字
      const redeliveryResult = await getUserSetting(REDELIVERY_TRIGGER_KEYWORD_KEY)
      if (redeliveryResult.success && redeliveryResult.value !== undefined) {
        setRedeliveryKeyword(redeliveryResult.value)
      }
      // 加载联系方式
      const wechatResult = await getUserSetting(CONTACT_WECHAT_KEY)
      if (wechatResult.success && wechatResult.value !== undefined) {
        setContactWechat(wechatResult.value)
      }
      const qqResult = await getUserSetting(CONTACT_QQ_KEY)
      if (qqResult.success && qqResult.value !== undefined) {
        setContactQQ(qqResult.value)
      }
      const locationUrlResult = await getUserSetting(LOCATION_CHAT_REMOTE_URL_KEY)
      setLocationRemoteUrl(locationUrlResult.value || DEFAULT_LOCATION_CHAT_REMOTE_URL)
      const locationSecretResult = await getUserSetting(LOCATION_CHAT_REMOTE_SECRET_KEY)
      setLocationRemoteSecretKey(locationSecretResult.value || '')
    } catch {
      // 静默失败
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [_hasHydrated, isAuthenticated, token])

  // 保存重发货触发关键字
  const handleSaveRedeliveryKeyword = async () => {
    try {
      setSavingRedeliveryKeyword(true)
      const trimmed = redeliveryKeyword.trim()
      await updateUserSetting(REDELIVERY_TRIGGER_KEYWORD_KEY, trimmed, '重发货触发关键字')
      setRedeliveryKeyword(trimmed)
      addToast({ type: 'success', message: '重发货触发关键字保存成功' })
    } catch {
      addToast({ type: 'error', message: '保存失败' })
    } finally {
      setSavingRedeliveryKeyword(false)
    }
  }

  // 保存联系方式
  const handleSaveContact = async () => {
    try {
      setSavingContact(true)
      await updateUserSetting(CONTACT_WECHAT_KEY, contactWechat, '微信联系方式')
      await updateUserSetting(CONTACT_QQ_KEY, contactQQ, 'QQ联系方式')
      addToast({ type: 'success', message: '联系方式保存成功' })
    } catch {
      addToast({ type: 'error', message: '保存联系方式失败' })
    } finally {
      setSavingContact(false)
    }
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (!currentPassword) {
      addToast({ type: 'warning', message: '请输入当前密码' })
      return
    }
    if (!newPassword) {
      addToast({ type: 'warning', message: '请输入新密码' })
      return
    }
    if (newPassword !== confirmPassword) {
      addToast({ type: 'warning', message: '两次输入的密码不一致' })
      return
    }
    if (newPassword.length < 6) {
      addToast({ type: 'warning', message: '新密码长度不能少于6位' })
      return
    }
    try {
      setChangingPassword(true)
      const result = await changePassword({ current_password: currentPassword, new_password: newPassword })
      if (result.success) {
        addToast({ type: 'success', message: '密码修改成功，即将退出登录' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        // 延迟1秒后退出登录
        setTimeout(() => {
          clearAuth()
          window.location.href = '/login'
        }, 1000)
      } else {
        addToast({ type: 'error', message: result.message || '密码修改失败' })
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || '密码修改失败'
      addToast({ type: 'error', message: errorMsg })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleTestLocationRemote = async () => {
    const url = locationRemoteUrl.trim()
    const secretKey = locationRemoteSecretKey.trim()
    if (!url || !secretKey) {
      addToast({ type: 'warning', message: '请输入远程URL和秘钥' })
      return
    }
    try {
      setTestingLocationRemote(true)
      const result = await testLocationChatRemoteApi(url, secretKey)
      if (result.success || result.data?.status_code === 200) {
        addToast({ type: 'success', message: '测试成功' })
      } else {
        addToast({ type: 'error', message: result.message || '测试失败' })
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      addToast({ type: 'error', message: err?.response?.data?.detail || err?.response?.data?.message || err?.message || '测试失败' })
    } finally {
      setTestingLocationRemote(false)
    }
  }

  const handleSaveLocationRemote = async () => {
    const url = locationRemoteUrl.trim()
    const secretKey = locationRemoteSecretKey.trim()
    if (!url || !secretKey) {
      addToast({ type: 'warning', message: '请输入远程URL和秘钥' })
      return
    }
    try {
      setSavingLocationRemote(true)
      const [urlResult, secretResult] = await Promise.all([
        updateUserSetting(LOCATION_CHAT_REMOTE_URL_KEY, url, '位置聊天远程URL'),
        updateUserSetting(LOCATION_CHAT_REMOTE_SECRET_KEY, secretKey, '位置聊天远程秘钥'),
      ])
      if (!urlResult.success || !secretResult.success) {
        addToast({ type: 'error', message: urlResult.message || secretResult.message || '保存失败' })
        return
      }
      setLocationRemoteUrl(url)
      setLocationRemoteSecretKey(secretKey)
      addToast({ type: 'success', message: '位置聊天远程配置已保存' })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      addToast({ type: 'error', message: err?.response?.data?.detail || err?.response?.data?.message || err?.message || '保存失败' })
    } finally {
      setSavingLocationRemote(false)
    }
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="page-header flex-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">个人设置</h1>
          <p className="page-description">管理个人账户信息和偏好设置</p>
        </div>
        <button onClick={loadSettings} className="btn-ios-secondary">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        <button type="button" onClick={() => setActiveTab('basic')} className={`border-b-2 px-4 py-2 text-sm font-medium transition ${activeTab === 'basic' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
          基础设置
        </button>
        <button type="button" onClick={() => setActiveTab('remote')} className={`border-b-2 px-4 py-2 text-sm font-medium transition ${activeTab === 'remote' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
          远程URL配置
        </button>
      </div>

      <div className={activeTab === 'basic' ? 'space-y-4' : 'hidden'}>
        {/* 账户信息 */}
        <div className="vben-card">
          <div className="vben-card-header">
            <h2 className="vben-card-title">
              <User className="w-4 h-4" />
              账户信息
            </h2>
          </div>
          <div className="vben-card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">用户名</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="input-ios bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="input-label">角色</label>
                <input
                  type="text"
                  value={user?.is_admin ? '管理员' : '普通用户'}
                  disabled
                  className="input-ios bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="vben-card">
          <div className="vben-card-header">
            <h2 className="vben-card-title">
              <User className="w-4 h-4" />
              联系方式
            </h2>
          </div>
          <div className="vben-card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">微信</label>
                <input
                  type="text"
                  value={contactWechat}
                  onChange={(e) => setContactWechat(e.target.value)}
                  placeholder="请输入微信号"
                  className="input-ios"
                />
              </div>
              <div>
                <label className="input-label">QQ</label>
                <input
                  type="text"
                  value={contactQQ}
                  onChange={(e) => setContactQQ(e.target.value)}
                  placeholder="请输入QQ号"
                  className="input-ios"
                />
              </div>
            </div>
            <button
              onClick={handleSaveContact}
              disabled={savingContact}
              className="btn-ios-primary mt-3"
            >
              {savingContact ? <ButtonLoading /> : <Save className="w-4 h-4" />}
              保存联系方式
            </button>
          </div>
        </div>

        {/* 重发货触发关键字 */}
        <div className="vben-card">
          <div className="vben-card-header">
            <h2 className="vben-card-title">
              <Package className="w-4 h-4" />
              重发货触发关键字
            </h2>
          </div>
          <div className="vben-card-body space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              设置后，在闲鱼聊天中自己发送「关键字+订单号」即可触发自动重新发货。例如关键字为「重新触发」，发送「4502144774044041438重新触发」将提取订单号并自动发货。
              <br />
              <span className="text-amber-500 dark:text-amber-400">注意：关键字不包含前后空格；如果订单不在数据库中，系统会自动根据订单号获取订单信息后再发货。</span>
            </p>
            <div className="input-group">
              <label className="input-label">触发关键字</label>
              <input
                type="text"
                value={redeliveryKeyword}
                onChange={(e) => setRedeliveryKeyword(e.target.value)}
                placeholder="例如：重新触发"
                className="input-ios"
              />
              <p className="text-xs text-gray-400 mt-1">保存时会自动去除前后空格；留空则关闭此功能</p>
            </div>
            <button
              onClick={handleSaveRedeliveryKeyword}
              disabled={savingRedeliveryKeyword}
              className="btn-ios-primary"
            >
              {savingRedeliveryKeyword ? <ButtonLoading /> : <Save className="w-4 h-4" />}
              保存
            </button>
          </div>
        </div>

        {/* 修改密码 */}
        <div className="vben-card">
          <div className="vben-card-header">
            <h2 className="vben-card-title">
              <Key className="w-4 h-4" />
              修改密码
            </h2>
          </div>
          <div className="vben-card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">当前密码</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="请输入当前密码"
                  className="input-ios"
                />
              </div>
              <div />
              <div className="input-group">
                <label className="input-label">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少6位）"
                  className="input-ios"
                />
              </div>
              <div className="input-group">
                <label className="input-label">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  className="input-ios"
                />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="btn-ios-primary"
            >
              {changingPassword ? <ButtonLoading /> : <Key className="w-4 h-4" />}
              修改密码
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'remote' && (
        <div className="vben-card">
          <div className="vben-card-header">
            <h2 className="vben-card-title">
              <Link2 className="w-4 h-4" />
              位置聊天配置
            </h2>
          </div>
          <div className="vben-card-body space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              配置位置消息生成接口，用于测试远程服务是否能够正常生成位置聊天报文。
            </p>
            <div className="space-y-4">
              <div className="input-group">
                <label className="input-label">远程URL</label>
                <input type="url" value={locationRemoteUrl} onChange={(e) => setLocationRemoteUrl(e.target.value)} placeholder={DEFAULT_LOCATION_CHAT_REMOTE_URL} className="input-ios" />
              </div>
              <div className="input-group">
                <label className="input-label">秘钥</label>
                <input type="password" value={locationRemoteSecretKey} onChange={(e) => setLocationRemoteSecretKey(e.target.value)} placeholder="请输入远程接口秘钥" className="input-ios" autoComplete="off" />
                <p className="text-xs text-red-500 mt-2">
                  秘钥请到 <a className="underline" href="https://api.xianyushop.shop" target="_blank" rel="noopener noreferrer">https://api.xianyushop.shop</a> 网站的接口列表 “通过定位进行聊天” 接口获取
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleTestLocationRemote} disabled={testingLocationRemote || savingLocationRemote} className="btn-ios-secondary">
                  {testingLocationRemote ? <ButtonLoading /> : <RefreshCw className="w-4 h-4" />}
                  测试
                </button>
                <button type="button" onClick={handleSaveLocationRemote} disabled={savingLocationRemote || testingLocationRemote} className="btn-ios-primary">
                  {savingLocationRemote ? <ButtonLoading /> : <Save className="w-4 h-4" />}
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
