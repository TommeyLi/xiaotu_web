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
    <div class="relative h-full w-360px border-x-2 box-border border-x-#F7F7F7 border-x-solid ">
      <n-scrollbar
        :x-scrollable="false"
        class="h-full w-full"
      >
        <div
          class="w-full w-360px p-y-22px p-x-16px box-border pb-104px"
        >
          <span class="text-16px font-bold text-size-16px c-#000000 mb-8px">
            {{ $t('aiDraw.common.sections.originalImage') }}
          </span>
          <image-gallery-selector v-model="values.url" />
        </div>
      </n-scrollbar>

      <!-- 固定底部按钮 -->
      <div
        class="absolute bottom-0 left-0 right-0 h-104px box-border p-y-24px p-x-16px bg-#FFF border-t-1px border-t-#E7E7E7"
      >
        <n-button
          class="w-full h-56px"
          color="#FF6A00"
          :disabled="isButtonDisabled"
          size="large"
          @click="handleGenerate"
        >
          <span class="text-#FFF text-16px font-500">{{ buttonText }}</span>
          <span class="pl-4px pt-7px text-12px h-16px c-#fbfbfbfc">{{ $t('aiDraw.common.costPoints', { points: currentRouteData.point }) }}</span>
        </n-button>
      </div>
    </div>
    <div class="h-full w-[calc(100%-360px)] box-border draw-area p-y-103px  p-x-24px">
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

<style scoped>
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
