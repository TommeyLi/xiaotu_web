import type { Ref } from 'vue'
import type { AiEffectVo } from '../types'
import { inject, onUnmounted, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const CURRENT_ROUTE_DATA_KEY = 'currentRouteData'

/**
 * 提供当前路由数据给子组件
 * @param initialData 初始数据
 */
export function provideCurrentRouteData(initialData?: AiEffectVo) {
  const route = useRoute()
  const currentRouteData = ref<AiEffectVo>(initialData || route.meta.data as AiEffectVo)

  // 监听路由变化，自动更新数据
  const stopWatcher = watch(() => route.meta.data, (newData) => {
    if (newData) {
      currentRouteData.value = newData as AiEffectVo
    }
  }, { immediate: true })

  // 组件卸载时停止监听
  onUnmounted(() => {
    stopWatcher()
  })

  // 提供响应式数据给子组件
  provide(CURRENT_ROUTE_DATA_KEY, currentRouteData)

  return {
    currentRouteData,
    updateRouteData: (data: AiEffectVo) => {
      currentRouteData.value = data
    },
  }
}

/**
 * 注入当前路由数据
 * @returns 当前路由数据的响应式引用
 */
export function useCurrentRouteData() {
  const currentRouteData = inject<Ref<AiEffectVo>>(CURRENT_ROUTE_DATA_KEY)

  if (!currentRouteData) {
    console.warn('useCurrentRouteData: 未找到提供的路由数据，请确保在父组件中调用了 provideCurrentRouteData')
    return {
      currentRouteData: ref<AiEffectVo>({} as AiEffectVo),
      hasData: false,
    }
  }

  return {
    currentRouteData,
    hasData: true,
  }
}
