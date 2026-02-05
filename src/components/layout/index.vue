<script setup lang='tsx'>
import { loadIcon } from '@iconify/vue'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Logo from '@/components/layout/logo.vue'
import NavLeft from '@/components/layout/nav-left.vue'
import NavRight from '@/components/layout/nav-right.vue'
import { useContactServiceModal } from '@/composables/use-contact-service-modal'

document.documentElement.style.setProperty('--design-vh', `100vh`)

const { openContactServiceModal } = useContactServiceModal()
const route = useRoute()

const isWasteFilmRescuePath = computed(() => {
  return route.path.includes('waste-film-rescue') || route.path.includes('custom-buy') || route.path.includes('photo-shoot')
})

const navBorderBottom = computed(() => {
  return isWasteFilmRescuePath.value ? 'none' : '1px solid #e5e7eb'
})

const headerBorderBottom = computed(() => {
  return isWasteFilmRescuePath.value ? '1px solid #e5e7eb' : 'none'
})

onMounted(() => {
  loadIcon('ion:download-outline')
})
</script>

<template>
  <pro-layout
    mode="horizontal"
    :show-tabbar="false"
    :show-sidebar="false"
    :show-footer="false"
    :footer-height="90"
    :nav-height="76"
    content-class="pro-layout__content--embedded "
    :class="{ 'no-nav-border': isWasteFilmRescuePath }"
  >
    <template #logo>
      <logo />
    </template>
    <template #nav-left>
      <nav-left />
    </template>
    <template #nav-center>
      <div
        class="flex items-center h-full"
      />
    </template>
    <template #nav-right>
      <nav-right />
    </template>
    <template #default>
      <div
        class="box-border h-full"
        :class="$route.name === 'Home' ? 'bg-#FFF rounded-16px' : ''"
      >
        <router-view />
      </div>
    </template>
    <template #footer>
      <!-- <footer-box /> -->
    </template>
  </pro-layout>
  <!-- </div> -->
  <!-- <n-float-button
    v-show="$route.name !== 'GoodsDetail'"
    position="fixed"
    right="0"
    bottom="20%"
    shape="square"
    width="71px"
    class="bg-transparent shadow-none hover:shadow-none z-100"
  >
    <div class="w-71px h-72px flex flex-col items-center box-border py-8px px-4px c-#000000 text-14px gap-8px bg-#717171 rounded-l-16px">
      <div
        data-contact-service
        class="flex flex-col items-center justify-center h-64px box-border rounded-8px cursor-pointer"
        tabindex="0"
        :auto-focus="false"
        @click="openContactServiceModal"
      >
        <img
          src="@/assets/icon/contact-service-white.png"
          class="size-24px"
        >
        <span class="c-#FFFFFF text-14px font-['PingFang_SC']">{{ $t('common.contactService.title') }}</span>
      </div>
    </div>
  </n-float-button> -->
  <div
    class="floating-button"
    @click="openContactServiceModal"
  >
    <img
      class="floating-button-icon"
      src="@/assets/icon/floating-button.png"
    >
  </div>
</template>

<style scoped lang="scss">
:deep(.n-pro-layout__content.pro-layout__content--embedded) {
  background-color: #ffffff;
  overflow-x: auto;
  margin-top: 4.0625rem;
}

:deep(.extra-menu .n-menu-item-content--selected::before) {
  border-radius: 10px;
  border: 1px solid #000000;
}

:deep(.extra-menu .n-menu-item-content) {
  grid-template-columns: none !important;
}
:deep(.n-pro-layout__header) {
  background-color: #ffffff;
  width: 100%;
  padding: 0 6.25rem;
  border-bottom: v-bind('headerBorderBottom');
  .n-pro-layout__nav {
    height: 4.0625rem;
    width: 100%;
    max-width: 120rem;
    min-width: 80rem;
    margin: 0 auto;
    border-bottom: v-bind('navBorderBottom');
    padding: 0 4.6875rem;
  }
}
:deep(.n-pro-layout__logo) {
  width: auto !important;
  margin-right: 2.9169rem;
}
.floating-button {
  position: fixed;
  right: 2.5rem;
  bottom: 2.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 624.9375rem;
  background: #111111;
  box-shadow:
    0rem 0.25rem 1.25rem 0rem rgba(0, 0, 0, 0.25),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease;
  .floating-button-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
}
.floating-button:hover {
  transform: scale(1.1) rotate(-20deg);
  background-color: #ff5500;
}
</style>
