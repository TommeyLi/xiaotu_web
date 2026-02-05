<script setup lang="ts">
import agreementHtml from './user-agreement.html?raw'
</script>

<template>
  <div class="max-w-1760px px-12 box-border 2xl:px-20 pt-15px m-[0_auto]">
    <div
      v-html="agreementHtml"
    />
  </div>
</template>
