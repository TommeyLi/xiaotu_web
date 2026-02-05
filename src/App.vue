<script setup lang="ts">
import AppProvider from '@/components/app-provider/index.vue'
import LoginModal from '@/components/login-modal/index.vue'
</script>

<template>
  <app-provider>
    <router-view v-slot="{ Component }">
      <transition v-bind="$router.currentRouteTransitionProps.value">
        <component :is="Component" />
      </transition>
    </router-view>
    <login-modal />
  </app-provider>
</template>
