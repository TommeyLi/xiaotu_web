<script setup lang='tsx'>
import type { MenuOption } from 'naive-ui'
import { isNil } from 'lodash-es'
import { useLayoutMenu } from 'pro-naive-ui'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import addressSvg from '@/assets/icon/address.svg'
import balanceSvg from '@/assets/icon/balance.svg'
import orderSvg from '@/assets/icon/order.svg'
import photoSvg from '@/assets/icon/photo.svg'
import rabbitDotSvg from '@/assets/icon/rabbit-dot.svg'
import starSvg from '@/assets/icon/star.svg'
import washDryHangSvg from '@/assets/icon/wash-dry-hang.svg'
import { ProMenu } from '@/components/menu'
import { $t } from '@/locales/locales'

const route = useRoute()
const router = useRouter()

const menuOptions = computed<MenuOption[]>(() => [
  { label: $t('routes.myOrder'), key: '/personal-center/my-order', icon: renderIcon(orderSvg) },
  { label: $t('routes.addressManage'), key: '/personal-center/address-manage', icon: renderIcon(addressSvg) },
  { label: $t('routes.myCollect'), key: '/personal-center/my-collect', icon: renderIcon(starSvg) },
  { label: $t('routes.myDraft'), key: '/personal-center/my-draft', icon: renderIcon(washDryHangSvg) },
  { label: $t('routes.imageLibrary'), key: '/personal-center/image-library', icon: renderIcon(photoSvg) },
  { label: $t('routes.myPoint'), key: '/personal-center/my-point', icon: renderIcon(rabbitDotSvg) },
  { label: $t('routes.myBalance'), key: '/personal-center/my-balance', icon: renderIcon(balanceSvg) },
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
</script>

<template>
  <div class="flex h-full w-full ml--8px">
    <div class="flex flex-col h-full w-224px bg-#F2F2F2">
      <n-config-provider
        :theme-overrides="{
          common: { primaryColor: '#FFF' },
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
    <div class="flex-1 h-full w-[calc(100vw-224px)]">
      <router-view
        v-slot="{ Component }"
        :route="$router.resolveNestedRoute()"
      >
        <component
          :is="Component"
        />
      </router-view>
    </div>
  </div>
</template>
