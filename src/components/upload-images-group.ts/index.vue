<script setup lang="ts">
import type { UploadFileInfo } from 'naive-ui'
import { computed, ref } from 'vue'

const props = defineProps<{
  max?: number
}>()

const emit = defineEmits<{
  (e: 'update:list', value: string[]): void
  (e: 'update:files', value: File[]): void
  (e: 'change', value: { list: string[], files: File[] }): void
}>()

const maxCount = computed(() => props.max ?? 6)

// 图片 URL
const images = ref<string[]>([])

// 原始文件 File
const files = ref<File[]>([])

// naive file list（内部用）
const uploadFileList = ref<UploadFileInfo[]>([])

/** 上传前校验 */
function beforeUpload(data: { file: UploadFileInfo }) {
  const file = data.file.file
  if (!file)
    return false

  return true
}

/** 上传变化 */
function handleFileChange(options: { file: UploadFileInfo }) {
  const rawFile = options.file.file
  if (!rawFile)
    return

  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string

    images.value.push(url)
    files.value.push(rawFile)

    emit('update:list', images.value)
    emit('update:files', files.value)
    emit('change', { list: images.value, files: files.value })
  }

  reader.readAsDataURL(rawFile)
}

/** 删除图片 */
function removeImage(index: number) {
  images.value.splice(index, 1)
  files.value.splice(index, 1)

  emit('update:list', images.value)
  emit('update:files', files.value)
  emit('change', { list: images.value, files: files.value })
}
</script>

<template>
  <div class="flex flex-wrap gap-12px items-start mt-8px">
    <!-- 图片列表 -->
    <div
      v-for="(img, idx) in images"
      :key="img"
      class="relative size-100px rounded-12px overflow-hidden cursor-pointer group"
    >
      <img
        :src="img"
        class="w-full h-full object-cover"
      >

      <!-- 遮罩删除按钮 -->
      <div
        class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
        @click="removeImage(idx)"
      >
        <img
          class="size-20px"
          src="@/assets/icon/trash.svg"
        >
      </div>
    </div>

    <!-- 上传按钮（始终跟在图片后面） -->
    <n-upload
      v-show="images.length < maxCount"
      class="order-last w-100px"
      multiple
      :max="maxCount"
      :default-upload="false"
      :show-file-list="false"
      :file-list="uploadFileList"
      accept=".jpg,.jpeg,.png,.webp"
      :on-change="handleFileChange"
      @before-upload="beforeUpload"
    >
      <div
        class="size-100px bg-#F5F5F5 rounded-12px flex flex-col items-center justify-center cursor-pointer text-gray-500"
      >
        <span class="text-32px">+</span>
        <span class="text-12px mt-4px">上传参考图</span>
      </div>
    </n-upload>
  </div>
</template>

<style scoped>
.size-100px {
  width: 100px;
  height: 100px;
}
</style>
