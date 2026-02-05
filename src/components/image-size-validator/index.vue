<script setup lang="ts">
import { NButton, NModal } from 'naive-ui'
import { computed, nextTick, ref, watch } from 'vue'
import { $t } from '@/locales/locales'

interface Props {
  show: boolean
  imageUrl: string
  upload?: UploadFunction
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'confirm', croppedImageUrl: string): void
  (e: 'cancel'): void
  (e: 'error', message: string): void
}

// 上传方法类型定义
interface UploadFunction {
  (files: File[], isTemp: boolean): Promise<{ failedList: any[], successList: any[] }>
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

// 图片相关
const previewImageRef = ref<HTMLImageElement>()
const cropBoxRef = ref<HTMLDivElement>()
const imageNaturalSize = ref({ width: 0, height: 0 })
const imageDisplaySize = ref({ width: 0, height: 0 })

// 裁剪相关
const showCropBox = ref(false)
const cropBox = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})

// 拖拽相关
const isDragging = ref(false)
const dragType = ref<'move' | 'resize' | null>(null)
const dragStart = ref({ x: 0, y: 0 })
const cropStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// 加载状态
const loading = ref(false)
const isConfirming = ref(false) // 标记是否为确认操作

// 计算属性
const originalSize = computed(() => {
  if (imageNaturalSize.value.width && imageNaturalSize.value.height) {
    return `${imageNaturalSize.value.width} × ${imageNaturalSize.value.height}`
  }
  return $t('components.imageSizeValidator.loading')
})

const cropSize = computed(() => {
  if (cropBox.value.width && cropBox.value.height) {
    const scaleX = imageNaturalSize.value.width / imageDisplaySize.value.width
    const scaleY = imageNaturalSize.value.height / imageDisplaySize.value.height

    const actualWidth = Math.round(cropBox.value.width * scaleX)
    const actualHeight = Math.round(cropBox.value.height * scaleY)

    return `${actualWidth} × ${actualHeight}`
  }
  return '0 × 0'
})

const cropBoxStyle = computed(() => ({
  left: `${cropBox.value.x}px`,
  top: `${cropBox.value.y}px`,
  width: `${cropBox.value.width}px`,
  height: `${cropBox.value.height}px`,
}))

const errorMessage = computed(() => {
  if (!imageNaturalSize.value.width || !imageNaturalSize.value.height)
    return ''

  const { width, height } = imageNaturalSize.value

  if (width < 2048 || height < 2048) {
    return $t('components.imageSizeValidator.errors.tooSmall')
  }

  if (width > 4096 || height > 4096) {
    return $t('components.imageSizeValidator.errors.tooLarge')
  }

  return ''
})

// 监听图片URL变化
watch(() => props.imageUrl, (newUrl) => {
  if (newUrl) {
    nextTick(() => {
      // 设置跨域属性
      if (previewImageRef.value) {
        previewImageRef.value.crossOrigin = 'anonymous'
      }
      handleImageLoad()
    })
  }
})

// 监听弹窗关闭
watch(() => props.show, (newShow) => {
  if (!newShow) {
    // 只有在非确认操作时才清空选中的值
    if (!isConfirming.value) {
      resetSelection()
    }
    // 重置确认标志
    isConfirming.value = false
  }
})

// 图片加载完成
function handleImageLoad() {
  if (!previewImageRef.value)
    return

  const img = previewImageRef.value
  imageNaturalSize.value = {
    width: img.naturalWidth,
    height: img.naturalHeight,
  }

  imageDisplaySize.value = {
    width: img.offsetWidth,
    height: img.offsetHeight,
  }

  // 检查是否需要裁剪
  const { width, height } = imageNaturalSize.value

  if (width > 4096 || height > 4096) {
    // 需要裁剪
    showCropBox.value = true
    initCropBox()
  }
  else if (width < 2048 || height < 2048) {
    // 尺寸太小
    showCropBox.value = false
  }
  else {
    // 尺寸合适
    showCropBox.value = false
  }
}

// 初始化裁剪框
function initCropBox() {
  const { width, height } = imageDisplaySize.value
  const maxSize = Math.min(width, height)
  const cropSize = Math.min(maxSize, 400) // 初始裁剪框大小

  cropBox.value = {
    x: (width - cropSize) / 2,
    y: (height - cropSize) / 2,
    width: cropSize,
    height: cropSize,
  }
}

// 开始拖拽
function startDrag(event: MouseEvent) {
  event.preventDefault()
  isDragging.value = true

  const rect = cropBoxRef.value!.getBoundingClientRect()
  const imgRect = previewImageRef.value!.getBoundingClientRect()

  dragStart.value = {
    x: event.clientX - imgRect.left,
    y: event.clientY - imgRect.top,
  }

  cropStart.value = { ...cropBox.value }

  // 判断拖拽类型
  const { offsetX, offsetY } = getOffset(event, rect)
  if (offsetX < 10 && offsetY < 10) {
    dragType.value = 'resize' // 左上角
  }
  else if (offsetX > rect.width - 10 && offsetY < 10) {
    dragType.value = 'resize' // 右上角
  }
  else if (offsetX < 10 && offsetY > rect.height - 10) {
    dragType.value = 'resize' // 左下角
  }
  else if (offsetX > rect.width - 10 && offsetY > rect.height - 10) {
    dragType.value = 'resize' // 右下角
  }
  else {
    dragType.value = 'move' // 中心移动
  }

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 处理拖拽
function handleDrag(event: MouseEvent) {
  if (!isDragging.value || !previewImageRef.value)
    return

  const imgRect = previewImageRef.value.getBoundingClientRect()
  const currentX = event.clientX - imgRect.left
  const currentY = event.clientY - imgRect.top

  const deltaX = currentX - dragStart.value.x
  const deltaY = currentY - dragStart.value.y

  if (dragType.value === 'move') {
    // 移动裁剪框
    const newX = Math.max(0, Math.min(imageDisplaySize.value.width - cropBox.value.width, cropStart.value.x + deltaX))
    const newY = Math.max(0, Math.min(imageDisplaySize.value.height - cropBox.value.height, cropStart.value.y + deltaY))

    cropBox.value.x = newX
    cropBox.value.y = newY
  }
  else if (dragType.value === 'resize') {
    // 调整裁剪框大小
    const newWidth = Math.max(50, Math.min(imageDisplaySize.value.width - cropBox.value.x, cropStart.value.width + deltaX))
    const newHeight = Math.max(50, Math.min(imageDisplaySize.value.height - cropBox.value.y, cropStart.value.height + deltaY))

    cropBox.value.width = newWidth
    cropBox.value.height = newHeight
  }
}

// 停止拖拽
function stopDrag() {
  isDragging.value = false
  dragType.value = null

  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 获取相对偏移
function getOffset(event: MouseEvent, rect: DOMRect) {
  return {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  }
}

// 创建代理图片以解决跨域问题
function createProxyImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // 如果跨域失败，尝试不使用跨域
      const img2 = new Image()
      img2.onload = () => resolve(img2)
      img2.onerror = () => reject(new Error($t('components.imageSizeValidator.errors.imageLoadFail')))
      img2.src = src
    }
    img.src = src
  })
}

// 确认裁剪
async function handleCrop() {
  if (!previewImageRef.value)
    return
  loading.value = true
  // 计算实际裁剪尺寸
  const scaleX = imageNaturalSize.value.width / imageDisplaySize.value.width
  const scaleY = imageNaturalSize.value.height / imageDisplaySize.value.height

  const cropX = cropBox.value.x * scaleX
  const cropY = cropBox.value.y * scaleY
  const cropWidth = cropBox.value.width * scaleX
  const cropHeight = cropBox.value.height * scaleY

  // 验证裁剪尺寸是否在范围内
  if (cropWidth < 2048 || cropWidth > 4096 || cropHeight < 2048 || cropHeight > 4096) {
    loading.value = false
    emit('error', $t('components.imageSizeValidator.errors.cropOutOfRange', {
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    }))
    return
  }

  isConfirming.value = true // 标记为确认操作

  try {
    // 创建代理图片
    const proxyImg = await createProxyImage(props.imageUrl)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error($t('components.imageSizeValidator.errors.canvasContextFail'))
    }

    // 设置画布尺寸
    canvas.width = cropWidth
    canvas.height = cropHeight

    // 绘制裁剪后的图片
    ctx.drawImage(
      proxyImg,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    )

    // 转换为blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        }
        else {
          reject(new Error($t('components.imageSizeValidator.errors.cropFail')))
        }
      }, 'image/jpeg', 0.9)
    })

    // 如果有上传方法，则上传到服务器
    if (props.upload) {
      const random = Math.random().toString(36).substring(2, 15)
      const file = new File([blob], `cropped-image-${random}.jpg`, { type: 'image/jpeg' })
      const result = await props.upload([file], true)
      console.log(result, 'result')
      if (result.successList.length > 0) {
        // 上传成功，使用服务器返回的URL
        emit('confirm', result.successList[0].imageUrl)
      }
      else {
        // 上传失败，使用blob URL
        const croppedUrl = URL.createObjectURL(blob)
        emit('confirm', croppedUrl)
      }
    }
    else {
      // 否则使用blob URL
      const croppedUrl = URL.createObjectURL(blob)
      emit('confirm', croppedUrl)
    }

    showModal.value = false
  }
  catch (error) {
    console.error('裁剪失败:', error)
    // 如果裁剪失败，尝试使用原图
    emit('confirm', props.imageUrl)
    showModal.value = false
  }
  finally {
    loading.value = false
  }
}

// 确认使用原图
function handleConfirm() {
  isConfirming.value = true // 标记为确认操作
  emit('confirm', props.imageUrl)
  showModal.value = false
}

// 取消
function handleCancel() {
  // 清空选中的值
  resetSelection()
  emit('cancel')
  showModal.value = false
}

// 重置选择状态
function resetSelection() {
  cropBox.value = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }
  showCropBox.value = false
  loading.value = false
}
</script>

<template>
  <n-modal
    v-model:show="showModal"
    v-loading="loading"
    preset="card"
    :title="$t('components.imageSizeValidator.title')"
    style="width: 600px; border-radius: 16px;"
    :mask-closable="false"
  >
    <div class="space-y-4">
      <!-- 图片预览 -->
      <div class="flex justify-center">
        <div class="relative">
          <img
            ref="previewImageRef"
            :src="imageUrl"
            :alt="$t('components.imageSizeValidator.alt.imagePreview')"
            class="max-w-full max-h-400px object-contain rounded-lg"
            crossorigin="anonymous"
            @load="handleImageLoad"
          >
          <!-- 裁剪框 -->
          <div
            v-if="showCropBox"
            ref="cropBoxRef"
            class="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
            :style="cropBoxStyle"
            @mousedown="startDrag"
          >
            <div class="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-nw-resize" />
            <div class="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-ne-resize" />
            <div class="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-sw-resize" />
            <div class="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-se-resize" />
          </div>
        </div>
      </div>

      <!-- 图片信息 -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">{{ $t('components.imageSizeValidator.labels.originalSize') }}</span>
            <span class="font-medium">{{ originalSize }}</span>
          </div>
          <div>
            <span class="text-gray-600">{{ $t('components.imageSizeValidator.labels.cropSize') }}</span>
            <span class="font-medium">{{ cropSize }}</span>
          </div>
        </div>
        <div class="mt-2 text-sm text-gray-600">
          {{ $t('components.imageSizeValidator.requirement') }}
        </div>
      </div>

      <!-- 操作提示 -->
      <div
        v-if="showCropBox"
        class="bg-blue-50 p-4 rounded-lg"
      >
        <div class="text-sm text-blue-800">
          <div class="font-medium mb-2">
            {{ $t('components.imageSizeValidator.cropOperation.title') }}
          </div>
          <div class="space-y-1 text-xs flex flex-col">
            <div>{{ $t('components.imageSizeValidator.cropOperation.dragCenter') }}</div>
            <div>{{ $t('components.imageSizeValidator.cropOperation.dragCorners') }}</div>
            <div>{{ $t('components.imageSizeValidator.cropOperation.ensureRange') }}</div>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="errorMessage"
        class="bg-red-50 p-4 rounded-lg"
      >
        <div class="text-sm text-red-800">
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <n-button @click="handleCancel">
          {{ $t('components.imageSizeValidator.actions.cancel') }}
        </n-button>
        <n-button
          v-if="showCropBox"
          type="primary"
          :loading="loading"
          :disabled="loading"
          @click="handleCrop"
        >
          {{ $t('components.imageSizeValidator.actions.confirmCrop') }}
        </n-button>
        <n-button
          v-else
          type="primary"
          :loading="loading"
          :disabled="loading"
          @click="handleConfirm"
        >
          {{ $t('components.imageSizeValidator.actions.confirmUse') }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>
