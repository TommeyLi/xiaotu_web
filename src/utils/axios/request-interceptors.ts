import type { AxiosInstance } from 'axios'
import { useAppStore } from '@/store/use-app-store'

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * 是否需要携带 token
     * @default true
     */
    addToken?: boolean
  }
}

export function setupRequestInterceptor(http: AxiosInstance) {
  http.interceptors.request.use((config) => {
    if (config.addToken !== false) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // 添加语言头配置
    const language = useAppStore().isZhCN ? 'zh_CN' : 'en_US'
    config.headers['Content-Language'] = language

    return config
  })
}
