<script setup lang="ts">
import type { CustomRequestParams, EffectDescItem, SubmitParams } from './index.api'
import type { TaskInfo } from '@/store/use-user-store'
import { useMessage } from 'naive-ui'
import { ref } from 'vue'
import ImageDisplay from '@/components/image-display/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import ImageSizeValidator from '@/components/image-size-validator/index.vue'
import { useUploadImage } from '@/composables/use-upload-image'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { useCurrentRouteData } from '../../composables/useCurrentRouteData'
import { useGenerateTask } from '../../composables/useGenerateTask'
import { Api } from './index.api'

const message = useMessage()
const { currentRouteData } = useCurrentRouteData()
console.log(currentRouteData.value, 'currentRouteData')
// 上传方法
const { upload } = useUploadImage()

const values = ref<CustomRequestParams>({
  // 原图
  url: null,
  // 风格图
  styleUrl: null,
  // 风格图文本描述
  text: null,
  // 尺寸
  size: '1024x1024',
})

const sizeOptions = [{
  label: '1:1',
  value: '1024x1024',
}, {
  label: '3:4',
  value: '3072x4096',
}, {
  label: '4:3',
  value: '4096x3072',
}]

// 风格图选择相关
const showStylePanel = ref(false) // 右侧风格图选择面板
const effectDescItems = ref<EffectDescItem[]>([])
const isHoveringStyleImage = ref(false)
const hoveredStyleItem = ref<{ text: string, styleUrl: string } | null>(null) // 当前悬停的风格图
const styleImageRefs = ref<Record<string, any>>({}) // 风格图预览引用

// 图片尺寸校验相关
const showSizeValidator = ref(false)
const pendingImageUrl = ref<string>('')

// 打开右侧风格图选择面板
function openStylePanel() {
  try {
    // 解析 effectDesc 字段获取分类数据
    const effectDesc = currentRouteData.value.effectDesc
    if (effectDesc) {
      effectDescItems.value = JSON.parse(effectDesc)
    }
    else {
      effectDescItems.value = []
    }
    showStylePanel.value = true
  }
  catch (error) {
    console.error($t('aiDraw.sketch.messages.parseStyleDataFail'), error)
    effectDescItems.value = []
    showStylePanel.value = true
  }
}

// 在右侧面板中选择风格图（直接选择）
function selectStyleImageFromPanel(styleItem: { text: string, styleUrl: string }) {
  values.value.styleUrl = styleItem.styleUrl
  values.value.text = styleItem.text
  showStylePanel.value = false
}

// 关闭右侧风格图选择面板
function closeStylePanel() {
  showStylePanel.value = false
}

// 删除选中的风格图
function deleteStyleImage() {
  values.value.styleUrl = null
  values.value.text = null
}

// 鼠标悬停处理
function handleStyleImageMouseEnter(styleItem: { text: string, styleUrl: string }) {
  hoveredStyleItem.value = styleItem
}

function handleStyleImageMouseLeave() {
  hoveredStyleItem.value = null
}

// 预览风格图
function previewStyleImage(styleItem: { text: string, styleUrl: string }) {
  const imageKey = `${styleItem.styleUrl}_${styleItem.text}`
  const imageRef = styleImageRefs.value[imageKey]
  if (imageRef) {
    imageRef.click()
  }
}

// 图片尺寸校验相关方法
function validateImageSize(imageUrl: string) {
  return new Promise<{ width: number, height: number }>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    img.src = imageUrl
  })
}

function handleImageConfirm(imageUrl: string | null) {
  if (!imageUrl)
    return

  // 校验图片尺寸
  validateImageSize(imageUrl).then(({ width, height }) => {
    console.log(width, height, '尺寸')
    if (width < 2048 || height < 2048) {
      message.error($t('aiDraw.sketch.messages.imageSizeTooSmall'))
      values.value.url = ''
      return
    }

    if (width > 4096 || height > 4096) {
      // 需要裁剪
      pendingImageUrl.value = imageUrl
      showSizeValidator.value = true
      values.value.url = ''
      return
    }

    // 尺寸合适，直接使用
    values.value.url = imageUrl
  }).catch((error) => {
    message.error($t('aiDraw.sketch.messages.imageLoadFail'))
    console.error('图片尺寸校验失败:', error)
  })
}

function handleSizeValidatorConfirm(croppedImageUrl: string) {
  showSizeValidator.value = false
  pendingImageUrl.value = ''
  values.value.url = croppedImageUrl
}

function handleSizeValidatorCancel() {
  showSizeValidator.value = false
  pendingImageUrl.value = ''
  // 清空选中的图片
  values.value.url = null
}

function handleSizeValidatorError(errorMessage: string) {
  message.error(errorMessage)
}

function validateAll() {
  if (!values.value.styleUrl) {
    message.warning($t('aiDraw.sketch.messages.addStyleImage'))
    return false
  }
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
          class="w-full w-360px p-y-22px p-x-16px box-border"
        >
          <div class="text-16px font-bold text-size-16px c-#000000 mb-8px">
            {{ $t('aiDraw.sketch.sections.styleImage') }}
          </div>
          <!-- 风格图选择区域 -->
          <div
            v-if="values.styleUrl"
            class="h-227px w-full rounded-12px flex items-center justify-center bg-#F7F7F7 cursor-pointer relative"
          >
            <div
              class="flex flex-col items-center justify-center relative size-full"
              @mouseenter="isHoveringStyleImage = true"
              @mouseleave="isHoveringStyleImage = false"
            >
              <img
                :src="values.styleUrl"
                :alt="$t('aiDraw.sketch.alt.selectedStyleImage')"
                class="max-w-full max-h-full object-contain rounded-8px"
              >
              <!-- 删除遮罩 -->
              <div
                v-if="isHoveringStyleImage"
                class="absolute inset-0 bg-#000 bg-opacity-50 rounded-12px flex items-center justify-center"
              >
                <div
                  class="w-40px h-40px flex items-center justify-center"
                  @click.stop="deleteStyleImage"
                >
                  <img
                    src="@/assets/icon/trash.svg"
                    class="size-32px"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 选择模板按钮 -->
          <div
            v-else
            class="w-full"
          >
            <n-button
              class="w-full"
              @click="openStylePanel"
            >
              <template #icon>
                <img
                  src="@/assets/icon/select-style-phone.svg"
                  class="size-20px"
                >
              </template>
              {{ $t('aiDraw.sketch.actions.selectTemplate') }}
            </n-button>
          </div>
        </div>
        <div
          class="w-full w-360px border-x-2 box-border border-x-#F7F7F7 border-x-solid p-y-22px p-x-16px box-border"
        >
          <div class="text-16px font-bold text-size-16px c-#000000 mb-8px">
            {{ $t('aiDraw.sketch.sections.originalImage') }} <span class="text-15px c-red-6 font-400">（{{ $t('aiDraw.sketch.sections.originalImageHint') }}）</span>
          </div>
          <image-gallery-selector
            v-model="values.url"
            @confirm="handleImageConfirm"
          />
        </div>
        <div
          class="w-full w-360px border-x-2 box-border border-x-#F7F7F7 border-x-solid p-y-22px p-x-16px box-border pb-104px"
        >
          <div class="text-16px font-bold text-size-16px c-#000000 mb-8px">
            {{ $t('aiDraw.sketch.sections.outputSize') }}
          </div>
          <div class="flex items-center gap-16px">
            <div
              v-for="item in sizeOptions"
              :key="item.value"
              class="w-155px h-48px box-border rounded-12px flex items-center justify-center cursor-pointer text-16px c-#000000 font-500 border-1px border-solid border-#E7E7E7"
              :class="[
                (item.value === values.size) && 'border-#000000!',
              ]"
              @click="values.size = item.value"
            >
              {{ item.label }}
            </div>
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

    <!-- 右侧风格图选择面板 -->
    <div
      v-show="showStylePanel"
      class="h-full flex-1 flex flex-col"
    >
      <!-- 面板头部 -->
      <div class="flex items-center justify-end h-60px px-20px border-b-1px border-b-#E7E7E7">
        <n-button
          quaternary
          circle
          @click="closeStylePanel"
        >
          <template #icon>
            <n-icon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                />
              </svg>
            </n-icon>
          </template>
        </n-button>
      </div>

      <!-- 图片网格 -->
      <div class="flex-1 pt-0">
        <template v-if="effectDescItems.length">
          <n-scrollbar class="h-[calc(var(--design-vh)-78px-19px)]">
            <div class="p-20px">
              <div class="space-y-24px">
                <div
                  v-for="(item, categoryIndex) in effectDescItems"
                  :key="categoryIndex"
                  class="space-y-12px"
                >
                  <!-- 分类标题 -->
                  <div class="text-16px font-bold text-#000">
                    {{ item.them }}
                  </div>

                  <!-- 该分类下的图片 -->
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-12px">
                    <div
                      v-for="(styleItem, styleIndex) in item.style"
                      :key="styleIndex"
                      class="relative cursor-pointer"
                      @click="selectStyleImageFromPanel(styleItem)"
                      @mouseenter="() => handleStyleImageMouseEnter(styleItem)"
                      @mouseleave="handleStyleImageMouseLeave"
                    >
                      <!-- 图片容器 -->
                      <div class="relative w-full aspect-square rounded-8px overflow-hidden bg-#F7F7F7">
                        <n-image
                          :ref="(el) => { styleImageRefs[`${styleItem.styleUrl}_${styleItem.text}`] = el }"
                          lazy
                          :src="`${styleItem.styleUrl}?imageMogr2/thumbnail/204x204`"
                          :preview-src="`${styleItem.styleUrl}${styleItem.styleUrl.includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                          :alt="styleItem.text"
                          :render-toolbar="createImageToolbar(styleItem.styleUrl)"
                          class="size-full flex justify-center"
                          object-fit="contain"
                        />

                        <!-- 悬停遮罩 -->
                        <div
                          v-if="hoveredStyleItem === styleItem"
                          class="absolute inset-0 bg-#000 bg-opacity-50 rounded-8px flex items-end justify-end pb-4px"
                        >
                          <div
                            class="w-32px h-32px flex items-center justify-center cursor-pointer"
                            @click.stop="previewStyleImage(styleItem)"
                          >
                            <img
                              src="@/assets/icon/zoom-in.svg"
                              class="size-20px"
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </template>
        <template v-else>
          <div class="w-full min-h-200px h-full flex items-center justify-center">
            <img
              src="@/assets/images/data-null.png"
              class="w-240px"
            >
          </div>
        </template>
      </div>
    </div>
    <div
      v-show="!showStylePanel"
      class="h-full w-[calc(100%-360px)] box-border draw-area p-y-103px  p-x-24px"
    >
      <div class="size-full rounded-16px bg-#FFF relative overflow-hidden">
        <!-- 图片展示区域 -->
        <image-display
          :generate-status="generateStatus"
          :result-url="resultUrl"
        />
      </div>
    </div>
  </div>

  <!-- 图片尺寸校验弹窗 -->
  <image-size-validator
    v-model:show="showSizeValidator"
    :image-url="pendingImageUrl"
    :upload="upload"
    @confirm="handleSizeValidatorConfirm"
    @cancel="handleSizeValidatorCancel"
    @error="handleSizeValidatorError"
  />
</template>

<style scoped>
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
