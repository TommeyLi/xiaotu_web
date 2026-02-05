<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  status: string
}

const _props = defineProps<Props>()

const statusList = ref([{
  label: '编辑态',
  value: 'idle',
  className: 'idle',
}, {
  label: '生成中',
  value: 'generating',
  className: 'generating',
}, {
  label: '成功',
  value: 'finished',
  className: 'finished',
}, {
  label: '失败',
  value: 'failed',
  className: 'failed',
}])
</script>

<template>
  <div class="status-container">
    <div
      v-for="item in statusList"
      :key="item.value"
      class="status-item"
      :class="[item.value === status ? item.className : '', item.value === status ? 'activity' : '']"
    >
      {{ item.label }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.status-container {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1;
  padding: 0.5625rem;
  height: 3.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.8);
  box-sizing: border-box;
  border: 0.0625rem solid #f3f4f6;
  display: flex;
  gap: 0.25rem;
  backdrop-filter: blur(0.75rem);
  box-shadow:
    0rem 0.5rem 0.625rem -0.375rem rgba(0, 0, 0, 0.1),
    0rem 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.1),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
  .status-item {
    box-sizing: border-box;
    height: 2.125rem;
    padding: 0 1rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    color: #9ca3af;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 900;
  }
  .activity {
    color: #ffffff;
  }
  .idle {
    background: #111111;
  }
  .generating {
    background: #ff5500;
  }
  .finished {
    background: #16a34a;
  }
  .failed {
    background: #dc2626;
  }
}
</style>
