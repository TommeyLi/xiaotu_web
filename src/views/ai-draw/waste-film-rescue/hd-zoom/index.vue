<script setup lang="ts">
import type { CustomRequestParams, SubmitParams } from './index.api'
import type { TaskInfo } from '@/store/use-user-store'
import { useMessage } from 'naive-ui'
import { ref } from 'vue'
import ImageDisplay from '@/components/image-display/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import { $t } from '@/locales/locales'
import { useCurrentRouteData } from '../../composables/useCurrentRouteData'
import { useGenerateTask } from '../../composables/useGenerateTask'
import { Api } from './index.api'

const message = useMessage()
const { currentRouteData } = useCurrentRouteData()
console.log(currentRouteData.value, 'currentRouteData')

const values = ref<CustomRequestParams>({
  // 原图
  url: null,
})

function validateAll() {
  if (!values.value.url) {
    message.warning($t('aiDraw.common.messages.addOriginalImage'))
    return false
  }
  return true
}

const {
  resultUrl,
  generateStatus,
  buttonText,
  isButtonDisabled,
  handleGenerate,
} = useGenerateTask<SubmitParams, TaskInfo>({
  validateAll,
  values,
  api: Api,
  currentRouteData,
})
</script>

<template>
  <div class="w-full h-full flex">
    <div class="setting-list relative">
      <n-scrollbar
        :x-scrollable="false"
        class="h-full w-full"
      >
        <div class="scrollbar-content">
          <span class="headline">
            {{ $t('aiDraw.common.sections.originalImage') }}
          </span>
          <image-gallery-selector v-model="values.url" />
        </div>
      </n-scrollbar>

      <!-- 固定底部按钮 -->
      <div class="absolute bottom-0 left-0 box-border generate-box">
        <n-button
          class="generate-btn"
          :class="isButtonDisabled ? 'generate-activity' : ''"
          color="#FF6A00"
          :disabled="isButtonDisabled"
          size="large"
          @click="handleGenerate"
        >
          <div class="generate-text">
            <span>{{ buttonText }}</span>
            <img
              class="arrow-right"
              src="@/assets/icon/arrow-right.png"
            >
          </div>

          <div class="generate-tip">
            {{ $t('aiDraw.common.costPoints', { points: currentRouteData.point }) }}
          </div>
        </n-button>
      </div>
    </div>
    <div class="h-full w-[calc(100%-360px)] box-border p-y-103px  p-x-24px relative">
      <div class="size-full rounded-16px bg-#FFF relative overflow-hidden">
        <!-- 图片展示区域 -->
        <image-display
          :generate-status="generateStatus"
          :result-url="resultUrl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.setting-list {
  :deep(.n-scrollbar) {
    width: 27.4375rem;
  }
  width: 27.4375rem;
  border: 0.0625rem solid #e5e7eb;
  border-width: 0rem 0.0625rem 0rem 0.0625rem;
  .scrollbar-content {
    width: 100%;
    padding: 2.5rem 2.5rem 9.0625rem;
    box-sizing: border-box;
  }
}

.headline {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: bold;
  line-height: 1.3125rem;
  color: #111111;
  display: block;
  padding-bottom: 0.875rem;
}
.generate-box {
  width: 100%;
  padding: 2rem 2.5rem;
  background: #ffffff;
  box-shadow:
    0rem -0.625rem 1.875rem -0.9375rem rgba(0, 0, 0, 0.05),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
  border-top: 0.0625rem solid #e5e7eb;
  z-index: 12;
  .generate-btn {
    width: 100%;
    height: 4rem;
    border-radius: 624.9375rem;
    box-sizing: border-box;
    background: #ff5500;
    box-shadow:
      0rem 0.9375rem 2.5rem -0.625rem rgba(255, 85, 0, 0.35),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    cursor: pointer;
    :deep(.n-button__content) {
      display: flex;
      flex-direction: column;
    }
    .generate-text {
      height: 1.6875rem;
      display: flex;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 900;
      line-height: 1.6875rem;
      letter-spacing: -0.0281rem;
      color: #ffffff;
      .arrow-right {
        width: 1.125rem;
        height: 1.125rem;
        margin-left: 0.325rem;
        transition: transform 0.3s ease-out;
      }
    }
    .generate-tip {
      font-family: 'Inter', sans-serif;
      font-size: 0.6875rem;
      font-weight: bold;
      line-height: 1.0313rem;
      letter-spacing: -0.0175rem;
      color: #ffddcc;
    }
  }
  .generate-btn:hover {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    background-position: -200% 0;
    animation: sweep 4s infinite linear;

    /* 基础背景色 */
    background-color: #ea580c;
    background-blend-mode: overlay;
    .generate-text {
      .arrow-right {
        transform: translateX(0.3125rem);
      }
    }
  }
  .generate-activity,
  .generate-activity:hover {
    cursor: not-allowed;
    .generate-text {
      .arrow-right {
        transform: none;
      }
    }
  }

  @keyframes sweep {
    100% {
      background-position: -200% 0;
    }
    0% {
      background-position: 200% 0;
    }
  }
}
</style>
