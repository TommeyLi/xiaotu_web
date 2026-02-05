<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { computed, ref } from 'vue'
import { VueCropper } from 'vue-cropper'
import { useUploadImage } from '@/composables/use-upload-image'
import { $t } from '@/locales/locales'

interface Props {
  modelValue: string | null
  originUrl: string | null
}

interface Emits {
  (e: 'update:modelValue', url: string | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { upload } = useUploadImage()
const message = useMessage()
const showGalleryModal = ref(false)
const isHoveringSelectedImage = ref(false)

// 计算属性：当前显示的图片URL（优先显示选中的重绘图片，否则显示原图）
const currentDisplayImageUrl = computed(() => {
  if (props.modelValue) {
    return props.modelValue
  }
  if (props.originUrl) {
    return props.originUrl
  }
  return null
})

// 是否有原图
const hasReferenceImage = computed(() => !!props.originUrl)

// 悬浮处理
function handleMouseEnter() {
  isHoveringSelectedImage.value = true
}

function handleMouseLeave() {
  isHoveringSelectedImage.value = false
}

const cropperRef = ref<InstanceType<typeof VueCropper> | null>(null)
const cropperKey = ref(0) // 用于强制重新渲染 vue-cropper

function handleConfirm() {
  if (!cropperRef.value)
    return

  cropperRef.value.getCropBlob(async (blob: Blob) => {
    // 将 Blob 转为 file，添加随机数确保文件名唯一
    const randomNum = Math.floor(Math.random() * 1000000)
    const file = new File([blob], `cropped-image-${randomNum}.png`, { type: 'image/png' })
    const result = await upload(file, true)
    // 直接更新 modelValue 为图片 URL
    emit('update:modelValue', result.successList[0].imageUrl)
    showGalleryModal.value = false
    // 重置裁剪器，下次打开时重新初始化
    cropperKey.value++
    message.success($t('components.redrawSelector.messages.selectSuccess'))
  })
}

// 打开弹窗时重置裁剪器
function openGalleryModal() {
  if (!hasReferenceImage.value) {
    message.warning($t('components.redrawSelector.messages.uploadOriginalFirst'))
    return
  }
  // 每次打开时重置 key，强制重新渲染组件
  cropperKey.value++
  showGalleryModal.value = true
}
</script>

<template>
  <div
    class="h-227px w-full rounded-12px flex items-center justify-center bg-#F7F7F7 cursor-pointer relative"
    @click="openGalleryModal"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 有图片时显示图片 -->
    <div
      v-if="currentDisplayImageUrl"
      class="flex flex-col items-center justify-center relative w-full h-full"
    >
      <img
        :src="currentDisplayImageUrl"
        :alt="$t('components.redrawSelector.alt.redrawImage')"
        class="max-w-full max-h-full object-contain rounded-8px"
      >
    </div>
    <!-- 没有图片时显示添加按钮和文案 -->
    <div
      v-else
      class="flex flex-col items-center"
    >
      <img src="@/assets/icon/no-image-icon.svg">
      <div class="text-14px text-#666 mt-8px">
        {{ $t('components.redrawSelector.actions.select') }}
      </div>
    </div>

    <!-- 悬浮遮罩 -->
    <div
      v-if="currentDisplayImageUrl && isHoveringSelectedImage"
      class="absolute inset-0 bg-#000 bg-opacity-50 rounded-12px flex items-center justify-center"
    >
      <div class="flex flex-col items-center">
        <n-button
          color="#FFF"
          ghost
        >
          {{ $t('components.redrawSelector.actions.reselect') }}
        </n-button>
      </div>
    </div>
  </div>

  <!-- 图库选择弹窗 -->
  <n-modal
    v-model:show="showGalleryModal"
    :bordered="false"
    :title="$t('components.redrawSelector.modal.title')"
    preset="card"
    :auto-focus="false"
    class="w-539px h-515px bg-#FFF rounded-24px"
  >
    <div class="w-full h-375px">
      <vue-cropper
        :key="cropperKey"
        ref="cropperRef"
        :img="props.originUrl"
        :output-size="1"
        output-type="png"
        :fixed="true"
        :fixed-box="false"
        :can-move="false"
        cross-origin="anonymous"
        referrerpolicy="no-referrer"
        :can-move-box="true"
        :fixed-number="[1, 1]"
        :info-true="true"
        :limit-min-size="[100, 100]"
        :center-box="true"
        :auto-crop="true"
        :auto-crop-width="200"
        :auto-crop-height="200"
        :info="false"
        :full="false"
        :min-width="100"
        :min-height="100"
        class="w-491px! h-340px!"
      />
      <div class="mt-16px w-full text-align-center c-#666">
        {{ $t('components.redrawSelector.modal.hint') }}
      </div>
    </div>

    <template #footer>
      <div class="w-full flex justify-end gap-x-8px">
        <n-button
          type="tertiary"
          @click="showGalleryModal = false"
        >
          {{ $t('common.often.cancel') }}
        </n-button>
        <n-button
          color="#000"
          @click="handleConfirm"
        >
          {{ $t('common.often.confirm') }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style lang="scss" scoped>
:deep(.search-input .n-input-wrapper) {
  width: 280px !important;
}
:deep(.n-upload-trigger) {
  width: 100%;
  height: 100%;
}
:deep(.vue-cropper) {
  .cropper-view-box {
    outline: 1px solid #fff !important; /* 白色边框 */
  }
  .cropper-line {
    background-color: #fff !important; /* 边框四条线 */
  }
  .crop-point {
    background-color: #fff !important; /* 八个缩放点 */
  }
}
</style>
