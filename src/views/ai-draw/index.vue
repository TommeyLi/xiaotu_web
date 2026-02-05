<script setup lang='tsx'>
import { isNil } from 'lodash-es'
import { useLayoutMenu } from 'pro-naive-ui'
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// import { ProMenu } from '@/components/menu'
import { provideCurrentRouteData } from './composables/useCurrentRouteData'

const route = useRoute()
const router = useRouter()

provideCurrentRouteData()

const {
  layout,
  fullKeys,
  activeKey,
} = useLayoutMenu({
  mode: 'two-column',
  menus: computed(() => router.buildMenus()),
})
console.log(router.buildMenus(), 'router.buildMenus()')

const menus = computed(() => router.buildMenus())
console.log(route, 'router')

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
  const failure = await router.push(path)
  if (failure) {
    // 跳转失败回退
    activeKey.value = route.path
  }
}

onMounted(() => {
  console.log('layout', layout)
})
</script>

<template>
  <div class="flex h-full">
    <div class="menu-box">
      <n-scrollbar content-class="scrollbar-box">
        <div
          v-for="(firstMenu, index) in menus"
          :key="firstMenu.key"
          class="menu-item"
        >
          <div
            class="first-menu-box"
            :class="firstMenu.key && route.path.includes(String(firstMenu.key)) ? 'first-menu-active' : ''"
            @click="pushTo(firstMenu.key as string)"
          >
            <div class="icon-box">
              <svg
                v-if="index === 0"
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon"
              ><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" /></svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon"
              ><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></svg>
            </div>
            <div class="menu-text">
              {{ firstMenu.label }}
            </div>
          </div>
          <div
            v-show="firstMenu.key && route.path.includes(String(firstMenu.key))"
            class="sub-menus-box"
          >
            <div
              v-for="subMenu in firstMenu.children"
              :key="subMenu.key"
              class="sub-menu-item"
              :class="route.path === subMenu.key ? 'sub-menu-active' : ''"
              @click="pushTo(subMenu.key as string)"
            >
              {{ subMenu.label }}
            </div>
          </div>
        </div>
      </n-scrollbar>
    </div>
    <div class="flex flex-1 rounded-16px bg-#FFF">
      <div class="h-[calc(var(--design-vh)-78px-16px)] w-full ">
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
  </div>
</template>

<style scoped lang="scss">
:deep(.menu-with-arrow .n-menu .n-menu-item-content.n-menu-item-content--selected) {
  position: relative;
  font-weight: 500 !important;
}

:deep(.menu-with-arrow .n-menu .n-menu-item-content.n-menu-item-content--selected::after) {
  content: '';
  position: absolute;
  right: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid #fff;
  pointer-events: none;
}

:deep(.extra-menu .n-menu .n-menu-item-content::before) {
  border: 1px solid #e7e7e7;
}

:deep(.extra-menu .n-menu .n-menu-item-content--selected::before) {
  border: 1px solid #000 !important;
}

:deep(.extra-menu .n-menu .n-menu-item-content--selected) {
  font-weight: 500 !important;
}

:deep(.n-menu-item-content-header) {
  text-align: center;
  font-size: 14px !important;
}

:deep(.n-menu-item-content__icon img) {
  width: 28px !important;
  height: 28px !important;
}
.menu-box {
  width: 8.9375rem;
  :deep(.n-scrollbar) {
    width: 8.9375rem !important;
  }
  .scrollbar-box {
    width: 8.9375rem;
  }
  .menu-item {
    margin: 2.5rem 1rem 0;
    padding-bottom: 4.0625rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    .first-menu-box {
      cursor: pointer;
      margin-bottom: 24;
      .icon-box {
        width: 3.625rem;
        height: 3.625rem;
        border-radius: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0.5938rem;
        .icon {
          width: 1.625rem;
          height: 1.625rem;
          display: block;
          color: #6b7280;
        }
      }
      .menu-text {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: 900;
        line-height: 1.125rem;
        color: #6b7280;
        text-align: center;
      }
    }
    .first-menu-box:hover {
      .icon-box {
        background-color: #f9fafb;
        .icon {
          color: #111111;
        }
      }
      .menu-text {
        color: #111111;
      }
    }
    .first-menu-active,
    .first-menu-active:hover {
      .icon-box {
        background: rgba(255, 85, 0, 0.05);
        border: 0.125rem solid rgba(255, 85, 0, 0.2);
        box-shadow:
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
          inset 0rem 0.125rem 0.25rem 0rem rgba(0, 0, 0, 0.05);
        .icon {
          color: #ff5500;
        }
      }
      .menu-text {
        color: #ff5500;
      }
    }
    .sub-menus-box {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      .sub-menu-item {
        width: 6.9375rem;
        height: 3.2188rem;
        border-radius: 1rem;
        background: #ffffff;
        box-sizing: border-box;
        border: 0.125rem solid rgba(229, 231, 235, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        font-size: 0.8125rem;
        font-weight: 900;
        color: #6b7280;
      }
      .sub-menu-item:hover {
        background-color: rgb(249 250 251 / 0.8);
        color: #ff5500;
        border: 0.125rem solid rgba(255, 85, 0, 0.2);
      }
      .sub-menu-active,
      .sub-menu-active:hover {
        border: 0.125rem solid #111111;
        box-shadow:
          0rem 0.0625rem 0.125rem 0rem rgba(0, 0, 0, 0.05),
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
        color: #111111;
        background: #ffffff;
      }
    }
  }
}
</style>
