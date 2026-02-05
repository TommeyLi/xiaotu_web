<script setup lang='tsx'>
import type { ProLayoutMode } from 'pro-naive-ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import logo from '@/assets/icon/logo.png'
import titlePng from '@/assets/images/title.png'
import { useLayoutStore } from '@/store/use-layout-store'

interface LogoProps {
  /**
   * 是否在移动端使用侧边栏抽屉
   */
  usingMobileSidebarDrawer?: boolean
}

const {
  usingMobileSidebarDrawer = false,
} = defineProps<LogoProps>()

const {
  mode,
  mobile,
  collapsed,
} = storeToRefs(useLayoutStore())

const enablePaddingLeft = computed(() => {
  const layoutMode = mode.value as ProLayoutMode
  if (usingMobileSidebarDrawer) {
    return !collapsed.value
  }
  if (mobile.value) {
    return true
  }
  return layoutMode === 'horizontal'
    || layoutMode === 'sidebar'
    || layoutMode === 'mixed-sidebar'
    || (layoutMode === 'vertical' && !collapsed.value)
})
</script>

<template>
  <a
    href="javascript: void 0;"
    class="flex items-center h-full"
    :class="{
      'justify-center': !enablePaddingLeft,
    }"
    @click="$router.push('/')"
  >
    <img
      :src="logo"
      class="truncate logo-img"
    >
    <img
      :src="titlePng"
      class="h-20px truncate"
    >
  </a>
</template>

<style scoped lang="scss">
.logo-img {
  width: 1.625rem;
  height: 1.625rem;
}
.flex {
  gap: 0.5rem;
}
</style>
