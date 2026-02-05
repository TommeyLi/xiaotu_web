<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { computed, ref } from 'vue'
import { $t } from '@/locales/locales'
import EditImageDrawer from './edit-image-drawer'

interface Props {
  modelValue: string | null
  blackWhiteUrl?: string | null
  originUrl: string | null
}

interface Emits {
  (e: 'update:modelValue', url: string | null): void
  (e: 'update:blackWhiteUrl', url: string | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()
const showDrawer = ref(false)
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

// 打开弹窗
function openDrawer() {
  if (!hasReferenceImage.value) {
    message.warning($t('components.redrawSelector.messages.uploadOriginalFirst'))
    return
  }
  showDrawer.value = true
}

// 保存蒙版
function handleSaveMask({ alaphaUrl, blackWhiteUrl }: { alaphaUrl: string, blackWhiteUrl: string }) {
  emit('update:modelValue', alaphaUrl)
  emit('update:blackWhiteUrl', blackWhiteUrl)
  message.success($t('components.redrawSelector.messages.selectSuccess'))
}
</script>

<template>
  <div
    class="h-227px w-full rounded-12px flex items-center justify-center bg-#F7F7F7 cursor-pointer relative"
    @click="openDrawer"
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
          {{ $t('components.redrawSelector.actions.select') }}
        </n-button>
      </div>
    </div>
  </div>

  <!-- 蒙版绘制弹窗 -->
  <edit-image-drawer
    v-model:visible="showDrawer"
    :src="originUrl || ''"
    :on-save-mask="handleSaveMask"
  />
</template>
