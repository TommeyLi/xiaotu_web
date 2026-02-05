<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

interface StyleItem {
  num: number
  styleUrl: string
  images: string[]
  background: string
}

const props = defineProps<{
  style: StyleItem
  defaultUrlList?: string[]
  defaultFileList?: (File | null)[]
}>()

const emit = defineEmits<{
  (e: 'updateImage', index: number): void
}>()

// -------------------------------------------------------
// 内部状态：URL 列表 + file 列表
// -------------------------------------------------------
const urlList = ref<string[]>([])
const fileList = ref<(File | null)[]>([])

// 初始化
function init() {
  const num = props.style.num
  const images = props.style.images ?? []

  urlList.value = Array.from({ length: num }, (_, i) => {
    return (
      images[i] ?? ''
    )
  })
  fileList.value = Array.from({ length: num }, (_, i) => {
    return props.defaultFileList?.[i] ?? null
  })
}

onMounted(init)

// 当 style 变化时需要重新初始化（换模板）
watch(
  () => [props.style, props.defaultUrlList, props.defaultFileList],
  () => init(),
  { deep: true },
)

// -------------------------------------------------------
// 计算：是否全部替换完成
// -------------------------------------------------------
const isAllReplaced = computed(() =>
  urlList.value.every((url, idx) => url !== props.style.images[idx]),
)

// -------------------------------------------------------
// 上传
// -------------------------------------------------------
function onSelectImage(index: number) {
  // urlList.value[index] = url
  emit('updateImage', index)
}

// -------------------------------------------------------
// 删除：恢复为背景图
// -------------------------------------------------------
function onDelete(index: number) {
  urlList.value[index] = props.style.images[index]
  fileList.value[index] = null
}

function isDefaultImage(index: number) {
  return urlList.value[index] === props.style.images[index]
}

// -------------------------------------------------------
// 暴露给父组件的数据
// -------------------------------------------------------
defineExpose({
  urlList,
  fileList,
  isAllReplaced,
  reset: init,
  setUrlList: (value: any) => {
    urlList.value = value
  },
})
</script>

<template>
  <div class="upload-list">
    <div
      v-for="(_, idx) in urlList"
      :key="idx"
      class="relative overflow-hidden group cursor-pointer upload-img"
      style="background-size: cover; background-position: center"
      :style="{ backgroundImage: `url(${urlList[idx]})` }"
    >
      <!-- 背景图：显示上传蒙版 -->
      <label
        v-if="isDefaultImage(idx)"
        class="absolute bottom-0 left-0 right-0 flex items-end justify-center
               bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_70%,#00000075_100%)]
               text-white  h-full cursor-pointer"
        @click="onSelectImage(idx)"
      >
        <span class="pb-4px text-13px">上传更换图片</span>
      </label>

      <!-- 替换后的图片：悬浮删除 -->
      <div
        v-else
        class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
               flex items-center justify-center transition cursor-pointer"
        @click.stop="onDelete(idx)"
      >
        <img
          class="size-20px"
          src="@/assets/icon/trash.svg"
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.upload-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.125rem;
  .upload-img {
    width: calc((100% - 1.125rem) / 2);
    aspect-ratio: 1;
    box-sizing: border-box;
    border-radius: 1rem;
    overflow: hidden;
  }
}
</style>
