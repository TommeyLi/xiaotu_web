<script setup lang="ts">
import type { CustomRequestParams, SubmitParams } from './index.api'
import type { TaskInfo } from '@/store/use-user-store'
import { useMessage } from 'naive-ui'
import { ref } from 'vue'
import ExpressionControl from '@/components/expression-control/index.vue'
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
  // 头部控制
  rotatePitch: 0,
  rotateYaw: 0,
  // 眼部控制
  blink: 0,
  eyebrow: 0,
  pupilX: 0,
  pupilY: 0,
  // 表情控制
  smile: 0,
  mouthHorizontal: 0,
  mouthVertical: 0,

})

function validateAll() {
  // 1. 表单校验
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
    <div class="relative h-full w-360px border-x-2 box-border border-x-#F7F7F7 border-x-solid">
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

          <!-- 头部控制 -->
          <div class="font-bold text-16px mt-16px mb-8px">
            {{ $t('aiDraw.expressionOptimize.sections.head') }}
          </div>
          <div class="w-full flex flex-col gap-10px box-border">
            <!-- 抬头低头控制 -->
            <expression-control
              v-model:value="values.rotatePitch"
              :title="$t('aiDraw.expressionOptimize.controls.pitch')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.down'), value: 'down' },
                { label: $t('aiDraw.expressionOptimize.options.up'), value: 'up' },
              ]"
              up-key="up"
              down-key="down"
              :max="20"
            />

            <!-- 左转右转控制 -->
            <expression-control
              v-model:value="values.rotateYaw"
              :title="$t('aiDraw.expressionOptimize.controls.yaw')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.right'), value: 'right' },
                { label: $t('aiDraw.expressionOptimize.options.left'), value: 'left' },
              ]"
              up-key="left"
              down-key="right"
              :max="20"
            />
          </div>

          <!-- 眼部控制 -->
          <div class="font-bold text-16px mt-16px mb-8px">
            {{ $t('aiDraw.expressionOptimize.sections.eye') }}
          </div>
          <div class="w-full flex flex-col gap-10px">
            <!-- 睁眼/闭眼 -->
            <expression-control
              v-model:value="values.blink"
              :title="$t('aiDraw.expressionOptimize.controls.blink')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.open'), value: 'open' },
                { label: $t('aiDraw.expressionOptimize.options.close'), value: 'close' },
              ]"
              up-key="close"
              down-key="open"
              :up-max="20"
              :down-max="5"
            />

            <!-- 皱眉/舒缓 -->
            <expression-control
              v-model:value="values.eyebrow"
              :title="$t('aiDraw.expressionOptimize.controls.eyebrow')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.frown'), value: 'frown' },
                { label: $t('aiDraw.expressionOptimize.options.relax'), value: 'relax' },
              ]"
              up-key="relax"
              down-key="frown"
              :up-max="10"
              :down-max="15"
            />

            <!-- 左看/右看 -->
            <expression-control
              v-model:value="values.pupilX"
              :title="$t('aiDraw.expressionOptimize.controls.pupilX')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.lookRight'), value: 'right' },
                { label: $t('aiDraw.expressionOptimize.options.lookLeft'), value: 'left' },
              ]"
              up-key="left"
              down-key="right"
              :max="15"
            />

            <!-- 上看/下看 -->
            <expression-control
              v-model:value="values.pupilY"
              :title="$t('aiDraw.expressionOptimize.controls.pupilY')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.lookUp'), value: 'up' },
                { label: $t('aiDraw.expressionOptimize.options.lookDown'), value: 'down' },
              ]"
              up-key="down"
              down-key="up"
              :max="15"
            />
          </div>

          <!-- 表情控制 -->
          <div class="font-bold text-16px mt-16px mb-8px">
            {{ $t('aiDraw.expressionOptimize.sections.expression') }}
          </div>
          <div class="w-full flex flex-col gap-10px">
            <!-- 微笑/严肃 -->
            <expression-control
              v-model:value="values.smile"
              :title="$t('aiDraw.expressionOptimize.controls.smile')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.smile'), value: 'smile' },
                { label: $t('aiDraw.expressionOptimize.options.serious'), value: 'serious' },
              ]"
              up-key="serious"
              down-key="smile"
              :dynamic-max="true"
              :up-max="0.3"
              :down-max="1.3"
              :step="0.01"
              :precision="2"
            />

            <!-- 嘴巴水平调整 -->
            <expression-control
              v-model:value="values.mouthHorizontal"
              :title="$t('aiDraw.expressionOptimize.controls.mouthHorizontal')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.openWide'), value: 'open' },
                { label: $t('aiDraw.expressionOptimize.options.closeWide'), value: 'close' },
              ]"
              up-key="close"
              down-key="open"
              :up-max="20"
              :down-max="15"
            />

            <!-- 嘴巴垂直调整 -->
            <expression-control
              v-model:value="values.mouthVertical"
              :title="$t('aiDraw.expressionOptimize.controls.mouthVertical')"
              :mode-options="[
                { label: $t('aiDraw.expressionOptimize.options.openWide'), value: 'open' },
                { label: $t('aiDraw.expressionOptimize.options.closeWide'), value: 'close' },
              ]"
              up-key="close"
              down-key="open"
              :max="30"
            />
          </div>
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
    <div class="h-full w-[calc(100%-360px)] box-border draw-area p-y-103px p-x-24px">
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
