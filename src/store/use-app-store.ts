import type { LangType } from '@/locales/locales'
import { preferenceConfig } from '@root/preference'
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs, watch } from 'vue'
import { i18n, Lang } from '@/locales/locales'

// 检测浏览器语言
function detectBrowserLanguage(): LangType {
  const browserLang = navigator.language || (navigator as any).userLanguage
  console.log(browserLang, 'browserLang')
  // 检查是否是中文（包括 zh-CN, zh-TW, zh-HK 等）
  if (browserLang.startsWith('zh')) {
    return Lang.ZH_CN
  }
  // 默认返回英文
  return Lang.EN_US
}

export const useAppStore = defineStore('app', () => {
  const showPreferenceDrawer = ref(false)

  // 如果用户没有手动设置过语言，则使用浏览器语言
  const initialLang = detectBrowserLanguage()
  const app = reactive({
    ...preferenceConfig.app,
    lang: initialLang,
  })

  const isZhCN = computed(() => {
    return app.lang === Lang.ZH_CN
  })

  watch(() => app.lang, (newLang) => {
    i18n.global.locale.value = newLang as LangType
  }, { immediate: true })

  return {
    isZhCN,
    ...toRefs(app),
    showPreferenceDrawer,
  }
}, {
  preference: {
    pick: [Object.keys(preferenceConfig.app), 'app'],
  },
})
