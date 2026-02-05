<script setup lang='tsx'>
import type { MenuOption } from 'naive-ui'
import { isNil } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { useLayoutMenu } from 'pro-naive-ui'
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeSvg from '@/assets/icon/home.svg'
import photoSvg from '@/assets/icon/photo.svg'
import washDryHangSvg from '@/assets/icon/wash-dry-hang.svg'
import { ProMenu } from '@/components/menu'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'

const route = useRoute()
const router = useRouter()
const {
  isLogined,
  showLoginModal,
} = storeToRefs(useUserStore())

const menuOptions = computed<MenuOption[]>(() => [
  { label: $t('routes.home'), key: '/home', icon: renderIcon(HomeSvg) },
  { label: $t('routes.drafts'), key: '/drafts', icon: renderIcon(washDryHangSvg) },
  { label: $t('routes.imageLibrary'), key: '/image-library', icon: renderIcon(photoSvg) },
])

const {
  layout,
  fullKeys,
  activeKey,
} = useLayoutMenu({
  mode: 'vertical',
  menus: menuOptions.value,
})

function findAvailableMenuKey() {
  const keys = fullKeys.value
  for (let i = route.matched.length - 1; i >= 0; i--) {
    const item = route.matched[i]
    if (keys.includes(item.path)) {
      return item.path
    }
  }
}

async function pushTo(path: string) {
  const failure = await router.push(path)
  if (failure) {
    // 跳转失败回退
    activeKey.value = route.path
  }
}

function renderIcon(src: string) {
  return () => <img src={src} class="size-full truncate" />
}

watch(() => route.path, (path) => {
  if (activeKey.value === path) {
    return
  }
  const key = findAvailableMenuKey()
  if (isNil(key) && __DEV__) {
    console.warn('This looks like a bug, please open an issue to report this problem')
    return
  }
  activeKey.value = key!
}, { immediate: true })

onMounted(() => {
  if (!isLogined.value) {
    showLoginModal.value = true
  }
})
</script>

<template>
  <div class="flex h-full w-full ml--8px">
    <div class="flex flex-col h-full w-208px bg-#F2F2F2">
      <n-config-provider
        :theme-overrides="{
          common: { primaryColor: '#FFF', borderRadius: '9px' },
          Menu: {
            itemColorActive: '#FFF',
            itemColorActiveHover: '#FFF',
            itemTextColor: '#000',
            itemTextColorHover: '#000',
            itemTextColorActive: '#000',
            itemTextColorActiveHover: '#000',
            itemColorHover: '#fefefe96',
          } }"
      >
        <n-scrollbar class="flex-[1_0_0]">
          <pro-menu
            v-bind="layout.verticalMenuProps"
            :indent="18"
            :options="layout.verticalMenuProps.options"
            class="w-200px"
            @update:value="pushTo"
          />
        </n-scrollbar>
      </n-config-provider>
    </div>
    <div class="flex-1 box-border h-[calc(var(--design-vh)-78px-16px)]">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
:deep(.n-menu-item-content) {
  font-family:
    PingFang HK,
    PingFang HK;
  font-weight: 600;
}
</style>
