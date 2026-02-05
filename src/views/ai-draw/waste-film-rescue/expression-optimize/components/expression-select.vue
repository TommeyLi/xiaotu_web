<script setup lang="ts">
import type { EffectDescOption } from '../index.api'
import { nextTick, ref } from 'vue'

interface Props {
  title: string
  options: EffectDescOption[]
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'delete', value: string): void
}>()

const expanded = ref(false)
const contentRef = ref<HTMLElement | null>(null)

function toggle(isScroll: boolean | undefined = true) {
  expanded.value = !expanded.value
  if (expanded.value && isScroll) {
    nextTick(() => {
      contentRef.value?.scrollIntoView({
        behavior: 'smooth',
      })
    })
  }
}

function onSelect(value: string) {
  const newValue = value === props.modelValue ? '' : value
  console.log(newValue, 'newValue')
  emit('update:modelValue', newValue)
  emit('change', value)
}

function onDelete(value: string) {
  emit('delete', value)
}

defineExpose({
  toggle,
})
</script>

<template>
  <div
    ref="contentRef"
    class="w-full setting-item"
  >
    <div
      class="setting-item-title"
      :class="expanded ? 'activity' : ''"
      @click="() => toggle()"
    >
      <span>{{ title }}</span>

      <span
        class="text-gray-600 transition-transform duration-200 flex items-center"
        :class="expanded ? 'rotate-180' : ''"
      >
        <!-- 下拉箭头 SVG -->
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          class="icon"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <!-- Content -->
    <transition name="fade">
      <div
        v-show="expanded"
        class="option-list"
      >
        <div
          v-for="(item, index) in options"
          :key="item.label"
          class="relative group flex overflow-hidden option-item"
          :class="{
            'custom': item.label === '自定义',
            'option-activity': item.label === modelValue,

          }"
          @click="onSelect(item.label)"
        >
          <!-- 文案部分 -->
          <span :class="(index === options.length - 1 && item.label !== '自定义') && 'group-hover:-translate-x-16px'">
            {{ item.label }}
          </span>

          <!-- 右侧删除按钮（仅自定义项显示） -->
          <div
            v-if="index === options.length - 1 && item.label !== '自定义'"
            class="absolute right-0 top-0 h-full w-30px bg-black/50
           opacity-0 group-hover:opacity-100 transition-all
           flex items-center justify-center cursor-pointer
           rounded-r-xl"
            @click.stop="onDelete(item.label)"
          >
            <!-- delete 图标（SVG） -->
            <img
              class="size-16px"
              src="@/assets/icon/trash.svg"
            >
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.setting-item {
  margin-bottom: 0.75rem;
  .setting-item-title {
    width: 100%;
    height: 3.5313rem;
    border-radius: 624.9375rem;
    padding: 0 1.5625rem;
    background: #f9fafb;
    box-sizing: border-box;
    border: 0.0625rem solid rgba(0, 0, 0, 0);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    font-weight: bold;
    color: #111111;
    .icon {
      color: #9ca3af;
      width: 1.125rem;
      height: 1.125rem;
    }
  }
  .setting-item-title:hover {
    background: #f3f4f6;
  }
  .activity,
  .activity:hover {
    background: #ffffff;
    border: 0.0625rem solid #e5e7eb;
    box-shadow:
      0rem 0.125rem 0.25rem -0.125rem rgba(0, 0, 0, 0.1),
      0rem 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    .icon {
      color: #ff5500;
    }
  }
  .option-list {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    .option-item {
      padding: 0.9375rem 1.125rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: bold;
      line-height: 1.3125rem;
      color: #6b7280;
      border: 1px solid #f9fafb;
      background: #f9fafb;
      border-radius: 0.75rem;
      cursor: pointer;
      box-sizing: border-box;
    }
    .option-item:hover,
    .option-activity {
      background-color: #ff5500;
      color: #ffffff;
      box-shadow:
        0 0.625rem 0.9375rem -0.1875rem rgb(255 85 0 / 0.2),
        0 0.25rem 0.375rem -0.25rem rgb(255 85 0 / 0.2);
    }
    .custom,
    .custom:hover {
      background: #ffffff;
      border: 0.0625rem solid #111111;
      box-shadow:
        0rem 0.0625rem 0.125rem 0rem rgba(0, 0, 0, 0.05),
        0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
        0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
      color: #111111;
    }
  }
}
</style>

<!-- Tailwind / UnoCSS 动画：只提供 name，类由系统自动生成 -->
<style>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
