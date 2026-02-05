<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { onBeforeUnmount, ref, watch } from 'vue'
import { VueCropper } from 'vue-cropper'

import { useUploadImage } from '@/composables/use-upload-image'
import { $t } from '@/locales/locales'

// props & emits
const props = defineProps<{
  modelValue: boolean
  imgUrl: string
  maskImageUrl: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', blob: Blob, url: string): void
  (e: 'cancel'): void
}>()

const message = useMessage()
// state
const visible = ref(props.modelValue)
watch(
  () => props.modelValue,
  v => (visible.value = v),
)

const cropperRef = ref<any>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref(false)
// 图片渲染加载状态（用于 v-loading）
const croppingLoading = ref(true)

// 蒙层图片尺寸
const maskImageSize = ref({ width: 211, height: 211 })

// 使用上传功能
const { upload } = useUploadImage()

// 获取蒙层图片尺寸，并进行等比例缩放
function getMaskImageSize(
  imageUrl: string,
): Promise<{ width: number, height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxSize = 260
      const originalWidth = img.naturalWidth
      const originalHeight = img.naturalHeight

      // 如果宽高都小于等于最大尺寸，直接返回原始尺寸
      if (originalWidth <= maxSize && originalHeight <= maxSize) {
        resolve({ width: originalWidth, height: originalHeight })
        return
      }

      // 计算等比例缩放
      const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight)
      const scaledWidth = Math.round(originalWidth * scale)
      const scaledHeight = Math.round(originalHeight * scale)

      resolve({ width: scaledWidth, height: scaledHeight })
    }
    img.onerror = () => {
      // 如果加载失败，使用默认尺寸
      resolve({ width: 211, height: 211 })
    }
    img.src = imageUrl
  })
}

// 监听蒙层图片变化，更新裁剪框尺寸
watch(
  () => props.maskImageUrl,
  async (newUrl) => {
    if (newUrl) {
      const size = await getMaskImageSize(newUrl)
      maskImageSize.value = size
    }
  },
  { immediate: true },
)

// 管理 objectURL 生命周期
let lastObjectUrl: string | null = null
function setPreview(blob: Blob) {
  if (lastObjectUrl)
    URL.revokeObjectURL(lastObjectUrl)
  lastObjectUrl = URL.createObjectURL(blob)
  previewUrl.value = lastObjectUrl
}
onBeforeUnmount(() => {
  if (lastObjectUrl)
    URL.revokeObjectURL(lastObjectUrl)
})

// 实时预览（加轻微节流）
function onRealTime() {
  try {
    cropperRef.value?.getCropBlob((blob: Blob) => {
      if (blob)
        setPreview(blob)
      croppingLoading.value = false
    })
  }
  catch {
    croppingLoading.value = false
  }
}

async function processCroppedImage(
  cropBlob: Blob,
  maskUrl: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(cropBlob)

    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!

      // 1. 白色背景
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 2. 绘制裁剪后的图
      ctx.drawImage(img, 0, 0)
      console.log(maskUrl)
      // 是否有蒙层
      // if (maskUrl) {
      //   const maskImg = new Image()
      //   maskImg.crossOrigin = 'anonymous'

      //   maskImg.onload = () => {
      //     // 3. 绘制蒙层（蒙层尺寸已经被你缩放到 maskImageSize）
      //     ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)

      //     canvas.toBlob((blob) => {
      //       URL.revokeObjectURL(url)
      //       if (blob)
      //         resolve(blob)
      //       else reject(new Error('生成合成图失败'))
      //     }, 'image/png')
      //   }

      //  maskImg.onerror = () => {
      //     URL.revokeObjectURL(url)
      //   reject(new Error('蒙层加载失败'))
      //  }

      //  maskImg.src = maskUrl
      // }
      // else {
      // 没有蒙层，直接生成
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (blob)
          resolve(blob)
        else reject(new Error('生成合成图失败'))
      }, 'image/png')
      // }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('裁剪图片加载失败'))
    }

    img.src = url
  })
}

// 确定（导出并上传）
async function onConfirm() {
  if (!cropperRef.value)
    return
  uploading.value = true
  cropperRef.value.getCropBlob(async (blob: Blob) => {
    if (!blob) {
      uploading.value = false
      return
    }
    try {
      const processedBlob = await processCroppedImage(blob, props.maskImageUrl)
      const file = new File([processedBlob], `crop-${Date.now()}.png`, {
        type: 'image/png',
      })

      // 使用真实的上传功能
      const { successList } = await upload([file], true)

      if (successList && successList.length > 0) {
        const uploadedImage = successList[0]
        // 返回上传后的服务器地址
        emit('confirm', processedBlob, uploadedImage.imageUrl)
        visible.value = false
      }
      else {
        throw new Error('上传失败')
      }
    }
    catch (e: any) {
      console.error('编辑图片失败', e)
      message.error(e)
      // 上传失败时仍然返回本地URL作为备用
      const fallbackWhiteBlob = await processCroppedImage(
        blob,
        props.maskImageUrl,
      )
      // const fallbackUrl = URL.createObjectURL(fallbackWhiteBlob)
      emit('confirm', fallbackWhiteBlob, '')
      visible.value = false
    }
    finally {
      uploading.value = false
    }
  })
}

// 取消
function onCancel() {
  visible.value = false
  emit('cancel')
}

// 关闭弹窗时清空预览并重置加载状态
watch(visible, (v) => {
  emit('update:modelValue', v)
  if (!v) {
    if (lastObjectUrl)
      URL.revokeObjectURL(lastObjectUrl)
    lastObjectUrl = null
    previewUrl.value = null
    croppingLoading.value = true
  }
})

// 当图片地址变化时，进入加载中，等待首帧预览生成
watch(
  () => props.imgUrl,
  () => {
    croppingLoading.value = true
  },
)
</script>

<template>
  <n-modal
    v-model:show="visible"
    :title="$t('components.imageEditorModal.title')"
    preset="card"
    :bordered="false"
    class="w-620px bg-white rounded-24px"
  >
    <div class="flex gap-x-16px items-start clip-box">
      <!-- 左侧裁剪区 -->
      <div
        v-loading="croppingLoading"
        class="relative overflow-hidden"
        :style="{
          width: `${maskImageSize.width}px`,
          height: `${maskImageSize.height}px`,
        }"
      >
        <vue-cropper
          ref="cropperRef"
          :img="imgUrl"
          output-type="png"
          :auto-crop="true"
          :auto-crop-width="maskImageSize.width"
          :auto-crop-height="maskImageSize.height"
          :center-box="false"
          :fixed-box="true"
          :can-move="true"
          :can-scale="true"
          :can-move-box="false"
          :limit-min-size="1"
          :min-width="1"
          :min-height="1"
          fill-color="#fff"
          :style="{
            width: `${maskImageSize.width}px`,
            height: `${maskImageSize.height}px`,
          }"
          @real-time="onRealTime"
        />
        <!-- 蒙层图片 -->
        <div
          v-if="props.maskImageUrl"
          class="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <img
            :src="props.maskImageUrl"
            :style="{
              width: `${maskImageSize.width}px`,
              height: `${maskImageSize.height}px`,
              objectFit: 'contain',
            }"
            :alt="$t('components.imageEditorModal.alt.mask')"
          >
        </div>
      </div>

      <!-- 右侧预览 -->
      <div
        class="size-271px border border-gray-200 flex items-center justify-center relative overflow-hidden"
        :style="{
          width: `${maskImageSize.width}px`,
          height: `${maskImageSize.height}px`,
        }"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          :alt="$t('components.imageEditorModal.alt.preview')"
          class="size-full object-cover"
        >
        <div
          v-else
          class="text-gray-400"
        >
          {{ $t('components.imageEditorModal.noPreview') }}
        </div>
      </div>
    </div>
    <div class="hint-text">
      {{ $t('components.imageEditorModal.hint') }}
    </div>

    <template #footer>
      <div class="flex justify-end btn-box">
        <n-button
          class="btn return"
          type="tertiary"
          @click="onCancel"
        >
          {{ $t('components.imageEditorModal.actions.backToReselect') }}
        </n-button>
        <n-button
          class="btn confirm"
          type="primary"
          color="#000"
          :loading="uploading"
          @click="onConfirm"
        >
          {{ $t('common.often.confirm') }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
/* 裁剪框样式更清爽 */
:deep(.vue-cropper .cropper-view-box) {
  outline: 2px solid #fff !important;
}
:deep(.vue-cropper .cropper-line) {
  background-color: #fff !important;
}
:deep(.vue-cropper .cropper-point) {
  background-color: #fff !important;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
}
:deep(.vue-cropper .crop-info) {
  display: none !important;
}
.clip-box {
  justify-content: center;
  margin-top: 8px;
}
.hint-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  letter-spacing: 0.35px;
  color: #6b7280;
  margin-top: 32px;
  text-align: center;
}
.btn-box {
  margin-top: 20px;
  gap: 16px;
  .btn {
    height: 44.5px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    font-size: 15px;
    font-weight: bold;
    line-height: 22.5px;
  }
  .return {
    border: 1px solid #ff5500;
    color: #ff5500;
    width: 140px;
  }
  .return:hover {
    background: #fff7ed;
  }
  .confirm {
    width: 110px;
    background: #000000;
    box-shadow:
      0px 4px 6px -4px rgba(0, 0, 0, 0.1),
      0px 10px 15px -3px rgba(0, 0, 0, 0.1),
      0px 0px 0px 0px rgba(0, 0, 0, 0),
      0px 0px 0px 0px rgba(0, 0, 0, 0);
    color: #ffffff;
  }
  .confirm:hover {
    background: #1f2937;
  }
}
</style>
