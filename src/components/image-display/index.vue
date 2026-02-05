<script setup lang="ts">
import type { GenerateStatus } from './types'
import { Icon, loadIcon } from '@iconify/vue'
import { useDialog, useMessage } from 'naive-ui'
import { onMounted, ref, watch } from 'vue'
import fallbackImg from '@/assets/images/generated-failed-bg.png'
import notification from '@/components/notification/index.vue'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { downloadJpgTypeImage } from '@/utils/file'
import { GenerateStatusEnum } from './types'

interface Props {
  /** 生成状态 */
  generateStatus: GenerateStatus
  /** 结果图片URL */
  resultUrl: string
}

const props = defineProps<Props>()

const dialog = useDialog()
const message = useMessage()

const imageRef = ref()
const isImageHovering = ref(false)
// 是否显示通知框
const isShowNotification = ref(false)

// 放大图片
function handleZoomImage() {
  if (imageRef.value) {
    imageRef.value.click()
  }
}

// 删除图片
function handleDeleteImage() {
  // 显示确认弹框
  dialog.warning({
    title: $t('components.imageDisplay.dialogs.deleteTitle'),
    content: $t('components.imageDisplay.dialogs.deleteContent'),
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: () => {
      message.success($t('components.imageDisplay.messages.deleteSuccess'))
    },
  })
}

// 下载图片
function handleDownloadImage() {
  downloadJpgTypeImage(props.resultUrl, `generated-image-${Date.now()}`)
}

function isVideoUrl(url: string): boolean {
  return /\.(?:mp4|webm|ogg|mov|m3u8|flv)(?:\?.*)?$/i.test(url)
}

const videoRef = ref<HTMLVideoElement | null>(null)

const isPlaying = ref(false)
const showControls = ref(false)

function handleClickPlay() {
  showControls.value = true
  videoRef.value?.play()
}

function handlePlay() {
  isPlaying.value = true
}

function handlePause() {
  isPlaying.value = false
}

watch(() => props.generateStatus, (val) => {
  if (val === GenerateStatusEnum.GENERATING) {
    isShowNotification.value = true
  }
  else if (val === GenerateStatusEnum.FAILED) {
    message.warning($t('components.imageDisplay.messages.generationFailedWarning'), {
      closable: true,
      duration: 5000,
    })
  }
})

onMounted(() => {
  loadIcon('icon-park-solid:play')
})
</script>

<template>
  <div
    class="size-full relative cursor-pointer flex items-center justify-center img-display-box"
    @mouseenter="isImageHovering = true"
    @mouseleave="isImageHovering = false"
  >
    <notification v-if="isShowNotification" />
    <!-- 生成中状态  -->
    <div
      v-if="generateStatus === GenerateStatusEnum.GENERATING"
      class="generating-box"
    >
      <div class="generating-content">
        <div class="loading-box">
          <img
            class="generating-icon1"
            src="@/assets/icon/generating1.png"
          >
          <img
            class="generating-icon2"
            src="@/assets/icon/generating2.png"
          >
        </div>
        <div class="generating-headline">
          {{ $t('components.imageDisplay.generating') }}
        </div>
        <!-- <div class="generating-description">
          {{ $t('components.imageDisplay.description') }}
        </div> -->
      </div>
    </div>

    <!-- 生成失败状态 -->
    <div
      v-else-if="generateStatus === GenerateStatusEnum.FAILED"
      class="failed-box"
    >
      <div class="failed-box-content">
        <img
          class="failed-img"
          src="@/assets/images/failed.png"
        >
        <div class="failed-headline">
          {{ $t('components.imageDisplay.failed') }}
        </div>
        <div class="failed-description">
          {{ $t('components.imageDisplay.failedDescription') }}
        </div>
      </div>
    </div>
    <div
      v-else-if="isVideoUrl(resultUrl)"
      class="relative w-full video-box"
    >
      <video
        ref="videoRef"
        :src="resultUrl"
        :controls="showControls"
        preload="metadata"
        class="w-full h-full object-contain video"
        @play="handlePlay"
        @pause="handlePause"
      />

      <!-- 播放按钮遮罩（未播放时显示） -->
      <div
        v-if="!isPlaying"
        class="
      absolute inset-0
      flex items-center justify-center
      cursor-pointer
      bg-#00000000
      transition-opacity duration-200
    "
        @click="handleClickPlay"
      >
        <icon
          icon="icon-park-solid:play"
          class="text-72px"
        />
      </div>
    </div>
    <!-- 正常图片显示 -->
    <n-image
      v-else
      ref="imageRef"
      :src="resultUrl"
      :fallback-src="fallbackImg"
      :preview-src="resultUrl"
      class="max-w-full h-full object-cover"
      fit="cover"
      :render-toolbar="createImageToolbar(resultUrl)"
    />

    <!-- 悬浮遮罩 - 只在生成成功状态显示 -->
    <div
      v-if="generateStatus === GenerateStatusEnum.FINISHED && isImageHovering"
      class="absolute inset-0 bg-gradient-to-t from-#000 via-#000 via-50% to-transparent flex flex-col items-center justify-between p-24px transition-all duration-100 ease-in-out animate-fade-in"
    >
      <!-- 顶部放大按钮 -->
      <div class="flex-1 flex items-center justify-center">
        <div
          class="w-60px h-60px flex items-center justify-center cursor-pointer"
          @click.stop="handleZoomImage"
        >
          <img
            class="size-32px"
            src="@/assets/icon/magnify.svg"
          >
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="flex items-center gap-16px">
        <div
          class="w-120px h-48px rounded-12px bg-#FFFFFF c-#000 flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out hover:bg-#F5F5F5"
          @click.stop="handleDeleteImage"
        >
          <img
            class="size-20px mr-8px"
            src="@/assets/icon/black-trash.svg"
          >
          <span class="text-14px font-500">{{ $t('common.often.delete') }}</span>
        </div>

        <div
          class="w-120px h-48px rounded-12px bg-#000 text-#fff flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out hover:bg-#333333"
          @click.stop="handleDownloadImage"
        >
          <img
            class="size-20px mr-8px"
            src="@/assets/icon/download.svg"
          >
          <span class="text-14px font-500">{{ $t('components.imageDisplay.actions.download') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.generate {
  background-image: url('@/assets/images/generated-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bg-gradient-to-t {
  background: linear-gradient(to top, #0000006d 0%, #00000007 30%, transparent 60%, transparent 100%);
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
.generating-box {
  cursor: initial;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .generating-content {
    width: 100%;
    max-width: 56rem;
    padding: 20px;
    aspect-ratio: 896 / 672;
    border-radius: 3rem;
    background: linear-gradient(137deg, rgba(255, 232, 209, 0.4) 20%, #fff9f5 79%);
    box-sizing: border-box;
    border: 0.0625rem solid #ffffff;

    backdrop-filter: blur(0.25rem);
    box-shadow:
      0rem 2.5rem 6.25rem -1.25rem rgba(255, 150, 0, 0.1),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .loading-box {
      width: 4rem;
      height: 4rem;
      position: relative;
      margin-bottom: 1.4688rem;
      .generating-icon1,
      .generating-icon2 {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      .generating-icon2 {
        animation: rotate 2s linear infinite;
      }
      @keyframes rotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
    .generating-headline {
      font-family: 'Inter', sans-serif;
      font-size: 1.5rem;
      font-weight: 900;
      line-height: 2.25rem;
      letter-spacing: -0.0375rem;
      color: #ff5500;
      margin-bottom: 0.5313rem;
    }
    .generating-description {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: bold;
      line-height: 1.3125rem;
      letter-spacing: 0.0219rem;
      color: #6b7280;
    }
  }
}
.failed-box {
  cursor: initial;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .failed-box-content {
    width: 100%;
    max-width: 56rem;
    aspect-ratio: 576 / 324;
    border-radius: 40px;
    background: #f9fafb;
    box-sizing: border-box;
    border: 2px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: 'Inter', sans-serif;
    .failed-img {
      width: 128px;
      height: 128px;
      display: block;
    }
    .failed-headline {
      margin: 20px 0 3.5px;
      font-size: 16px;
      font-weight: 900;
      line-height: 24px;
      color: #9ca3af;
    }
    .failed-description {
      font-size: 12px;
      font-weight: bold;
      line-height: 18px;
      color: #d1d5db;
    }
  }
}
.video-box {
  .video {
    border-radius: 48px;
  }
}
</style>
