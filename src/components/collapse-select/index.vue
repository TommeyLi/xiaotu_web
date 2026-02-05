<script setup lang="ts">
import { nextTick, ref } from 'vue'

interface Props {
  title: string
  subTitle?: string
  tooltipUrl?: string
  type?: string
}

const props = defineProps<Props>()

const expanded = ref(false)
const contentRef = ref<HTMLElement | null>(null)

function toggle() {
  expanded.value = !expanded.value
  if (expanded.value) {
    nextTick(() => {
      contentRef.value?.scrollIntoView({
        behavior: 'smooth',
      })
    })
  }
}
</script>

<template>
  <div
    ref="contentRef"
    class="w-full"
    :class="{
      'setting-item': props.type === '1',
      'setting-item1': props.type !== '1',
      'setting-item1-activity': props.type !== '1' && expanded,
    }"
  >
    <!-- Header -->
    <div
      class="setting-item-title"
      :class="expanded ? 'activity' : ''"
      @click="toggle"
    >
      <div class="title-box">
        {{ title }}
        <a
          v-if="tooltipUrl"
          target="_blank"
          :href="tooltipUrl"
          class="inline-block ml-2px flex items-center"
        >
          <img
            class="icon"
            src="@/assets/icon/help.png"
            alt="Question Icon"
          >
        </a>
        <span class="subTitle">({{ subTitle }})</span>
      </div>

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

    <!-- Content Slot -->
    <transition name="fade">
      <div
        v-show="expanded"
        class="option-list"
      >
        <!-- 用户完全自定义内容 -->
        <slot />
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.setting-item,
.setting-item1 {
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
    .title-box {
      display: flex;
      align-items: center;
      .icon {
        margin-left: 0.5rem;
        width: 14px;
        height: 14px;
      }
      .subTitle {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        margin-left: 0.5rem;
      }
    }
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
        0px 15px 40px -10px rgba(255, 85, 0, 0.35),
        0px 0px 0px 0px rgba(0, 0, 0, 0),
        0px 0px 0px 0px rgba(0, 0, 0, 0);
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
.setting-item1 {
  .setting-item-title {
    border-radius: 1rem;
  }
  .activity,
  .activity:hover {
    background: #f9fafb;
    border: none;
    box-shadow: none;
    .icon {
      color: #9ca3af;
    }
  }
  .option-list {
    padding: 0 25px 31px;
  }
}
.setting-item1-activity {
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  box-sizing: border-box;
  border-radius: 16px;
}
</style>

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
