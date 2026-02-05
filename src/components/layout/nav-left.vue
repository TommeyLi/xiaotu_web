<script setup lang="ts">
import { isNil } from 'lodash-es'
import { useLayoutMenu } from 'pro-naive-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProRequest } from '@/composables/use-pro-request'
import { Api } from '@/views/custom-goods/index.api'

const router = useRouter()
const route = useRoute()
const {
  layout,
  fullKeys,
  activeKey,
} = useLayoutMenu({
  mode: 'horizontal',
  menus: computed(() => router.buildMenus()),
})

const {
  data: categoryInfoList,
} = useProRequest(async () => {
  const result = await Api.getCategoryList()
  return (result.data ?? []).sort((a, b) => a.sort - b.sort)
})

const categoryOptions = computed(() => {
  const options = (categoryInfoList.value ?? []).map((item) => {
    return {
      label: item.categoryName,
      key: `/custom-goods?categoryId=${item.categoryId}`,
    }
  })
  const finalOptions = [
    {
      label: '小兔文创',
      key: '/custom-goods',
      children: options,
    },
  ]
  return finalOptions
})

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
  console.log(path)
  const failure = await router.push(path)
  if (failure) {
    // 跳转失败回退
    activeKey.value = route.path
  }
}

// function renderMenuLabel(text: string, hasChildren = false) {
//   return () =>
//     h(
//       'span',
//       {
//         class: [
//           'menu-label',
//           hasChildren && 'menu-label--has-children',
//         ],
//       },
//       [
//         h('span', { class: 'menu-label__text' }, text),

//         hasChildren
//         && h(
//           'i',
//           {
//             class: 'menu-label__arrow',
//             innerHTML: `
//         <svg
//           width="16"
//           height="16"
//           viewBox="0 0 24 24"
//           fill="none"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <path
//             d="M6 9l6 6 6-6"
//             stroke="currentColor"
//             stroke-width="2"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//           />
//         </svg>
//       `,
//           },
//         ),
//       ],
//     )
// }

const menuOptions = computed(() => {
  const options = layout.value.horizontalMenuProps.options ?? []
  const finalOptions = [
    {
      label: '首页',
      key: '/home',
    },
    {
      label: '小兔精工',
      key: '/waste-film-rescue',
      children: options,
    },
    ...categoryOptions.value,
  ]
  console.log(finalOptions)
  return finalOptions
})

const hoveredKey = ref<string | null>(null)
const dropdownVisibleKey = ref<string | null>(null)

const HIDE_DELAY = 200
let hideTimer: number | null = null

function clearHideTimer() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function openDropdown(key: string) {
  clearHideTimer()
  hoveredKey.value = key
  dropdownVisibleKey.value = key
}

function delayCloseDropdown() {
  clearHideTimer()
  hideTimer = window.setTimeout(() => {
    dropdownVisibleKey.value = null
    hoveredKey.value = null
  }, HIDE_DELAY) as unknown as number
}

function onNavEnter(nav: any) {
  if (!nav.children) {
    return
  }
  openDropdown(nav.key as string)
}

function onNavLeave() {
  delayCloseDropdown()
}

function onDropdownEnter(nav: any) {
  if (!nav.children) {
    return
  }
  openDropdown(nav.key as string)
}

function onDropdownLeave() {
  delayCloseDropdown()
}

onBeforeUnmount(() => {
  clearHideTimer()
})
</script>

<template>
  <div class="flex justify-start items-center h-full text-14px lg:text-16px line-height-22px c-#000 min-w-145px">
    <n-config-provider
      :theme-overrides="{
        common: {
          primaryColorHover: '#FF5500',
        },
      }"
    >
      <!-- <pro-menu
        v-bind="layout.horizontalMenuProps"
        :indent="18"
        :collapsed-width="80"
        :collapsed-show-title="true"
        :options="menuOptions"
        @update:value="pushTo"
      /> -->
      <div class="navigation-list">
        <div
          v-for="(nav) in menuOptions"
          :key="nav.key"
          class="navigation-item"
          :class="{
            'navigation-item--has-children': nav.children,
            'navigation-item--active': dropdownVisibleKey === nav.key || hoveredKey === nav.key,
          }"
          @mouseenter="onNavEnter(nav)"
          @mouseleave="onNavLeave"
          @click="nav.label === '首页' ? pushTo(nav.key as string) : ''"
        >
          <span>{{ nav.label }}</span>
          <svg
            v-if="nav.children"
            class="item-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div
            v-if="nav.children && dropdownVisibleKey === nav.key"
            :class="nav.label === '小兔精工' ? 'nav-dropdown' : 'nav-dropdown-noChildren'"
            @mouseenter.stop="onDropdownEnter(nav)"
            @mouseleave.stop="onDropdownLeave"
          >
            <div
              v-for="it in nav.children"
              :key="it.key"
              class="nav-dropdown-column"
            >
              <div
                class="nav-dropdown-title"
                @click="nav.label === '小兔精工' ? '' : pushTo(it.key as string)"
              >
                {{ it.label }}
              </div>
              <div
                v-for="child in (it as any).children || []"
                :key="child.key"
                class="nav-dropdown-item"
                @click="pushTo(child.key as string)"
              >
                {{ child.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-config-provider>
    <!-- <div
      v-for="(breadcrumb, index) in $router.buildBreadcrumbs()"
      :key="breadcrumb.path"
    >
      <div
        class="flex items-center justify-center"
      >
        <img
          v-show="index !== $router.buildBreadcrumbs().length - 1"
          src="@/assets/icon/chevron-left.svg"
          class="size-16px lg:size-26px c-#999!"
        >
        <img
          v-show="index === $router.buildBreadcrumbs().length - 1"
          src="@/assets/icon/chevron-left-black.svg"
          class="size-16px lg:size-26px c-#999!"
        >
        <span
          :class="{
            'c-#999!': index !== $router.buildBreadcrumbs().length - 1,
          }"
          class="font-medium"
        >
          {{ breadcrumb.title }}
        </span>
      </div>
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
:deep(.n-menu-item-content__icon) {
  display: none !important;
}

:deep(.n-menu-item-content) {
  font-family: 'Inter', sans-serif;
  font-size: 1rem !important;
  font-weight: 700;
  color: #000 !important;
  padding: 0 1.25rem !important;
}

:deep(.menu-label) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 1rem !important;
}

:deep(.menu-label__arrow) {
  transition: transform 0.2s ease;
  margin-top: 6px;
  display: block;
  color: #a0a0a0;
}

:deep(.n-menu-item-content--hover .menu-label__arrow svg) {
  transform: rotate(180deg) !important;
  .menu-label__arrow {
    color: #ff5500;
  }
}
:deep(.n-menu-item-content--hover) {
  .menu-label__arrow {
    color: #ff5500;
  }
}
.navigation-list {
  display: flex;
  gap: 2.5rem;
  margin-right: 1rem;
  .navigation-item {
    position: relative;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.5rem;
    text-align: center;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    text-wrap: nowrap;
    .item-icon {
      width: 1rem;
      height: 1rem;
      color: #9ca3af;
    }
  }
  .navigation-item:hover {
    color: #ff5500;
  }
  .navigation-item--active {
    color: #ff5500;
    .item-icon {
      color: #ff5500;
      transform: rotate(180deg);
    }
  }
}

.nav-dropdown {
  position: absolute;
  top: 160%;
  left: 0;
  margin-top: 1rem;
  padding: 2rem 2rem;
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 0.625rem 1.875rem rgba(15, 23, 42, 0.15);
  display: flex;
  gap: 4rem;
  z-index: 50;
  white-space: nowrap;

  .nav-dropdown-column {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .nav-dropdown-title {
    font-family: 'Inter', sans-serif;
    font-size: 1.125rem;
    font-weight: bold;
    color: #111111;
    text-align: left;
    cursor: auto;
  }

  .nav-dropdown-item {
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #9ca3af;
    text-align: left;
  }

  .nav-dropdown-item:hover {
    color: #ff5500;
  }
}
.nav-dropdown-noChildren {
  position: absolute;
  top: 160%;
  left: 0;
  margin-top: 1rem;
  padding: 2rem 2rem;
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 0.625rem 1.875rem rgba(15, 23, 42, 0.15);
  display: flex;
  gap: 18px;
  z-index: 50;
  white-space: nowrap;
  flex-direction: column;
  .nav-dropdown-title {
    width: 8.375rem;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5rem;
    color: #111111;
    text-align: left;
  }
  .nav-dropdown-title:hover {
    color: #ff5500;
  }
}
</style>
