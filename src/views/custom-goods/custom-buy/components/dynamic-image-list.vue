<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import headTemplateImage from '@/assets/images/head-template.png'

export interface ReplaceImageItem {
  imageUrl: string
  imageFile: File | string
  maskImage: string
}

interface Props {
  replaceImageList: ReplaceImageItem[]
  replaceText: {
    label: string
    value: string
  }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'updateImage', index: number): void
}>()

// 内部可修改副本
const localReplaceImageList = ref<ReplaceImageItem[]>([])
const localReplaceText = ref<{
  label: string
  value: string
}[]>([])

// 初始化
localReplaceImageList.value = JSON.parse(JSON.stringify(props.replaceImageList))
localReplaceText.value = JSON.parse(JSON.stringify(props.replaceText))

function cloneReplaceImageList(list: ReplaceImageItem[] = []) {
  return list.map(item => ({
    imageUrl: item.imageUrl,
    imageFile: item.imageFile || '',
    maskImage: item.maskImage,
  }))
}

function cloneTextList(list: {
  label: string
  value: string
}[] = []) {
  return list.map(item => ({
    label: item.label,
    value: item.value,
  }))
}

function init() {
  localReplaceImageList.value = cloneReplaceImageList(props.replaceImageList)
  localReplaceText.value = cloneTextList(props.replaceText)
}

watch(
  () => [props.replaceImageList, props.replaceText],
  init,
  { immediate: true, deep: true },
)

// 图片选择
async function onSelectImage(index: number) {
  // 给父组件上传逻辑自由度，将来你可直接改成 useJSBridge 调用
  // const file = await openFilePicker()

  // if (file) {
  // const url = URL.createObjectURL(file)
  // localReplaceImageList.value[index].imageUrl = url
  // localReplaceImageList.value[index].imageFile = file
  emit('updateImage', index)
  // }
}

function onDelete(index: number) {
  localReplaceImageList.value[index].imageUrl = props.replaceImageList[index].imageUrl
}

const isAllReplaced = computed(() =>
  localReplaceImageList.value.every((item, idx) => item.imageUrl !== props.replaceImageList[idx].imageUrl),
)

// 简易的文件选择
// function openFilePicker(): Promise<File | null> {
//   return new Promise((resolve) => {
//     const input = document.createElement('input')
//     input.type = 'file'
//     input.accept = 'image/*'
//     input.onchange = () => resolve(input.files?.[0] || null)
//     input.click()
//   })
// }

// 对外暴露，父组件通过 ref 拿到状态
defineExpose({
  getValue: () => {
    return {
      replaceImageList: localReplaceImageList.value,
      replaceText: localReplaceText.value,
    }
  },
  setReplaceImageListValue: (value: any) => {
    localReplaceImageList.value = value
  },
  isAllReplaced,
})
</script>

<template>
  <div class="dynamic-image-list-container">
    <!-- 图片替换区 -->
    <div class="img-box">
      <div
        v-for="(item, idx) in localReplaceImageList"
        :key="idx"
        class="relative overflow-hidden group cursor-pointer img-item"
        @click="onSelectImage(idx)"
      >
        <!-- 底图 -->
        <img
          :src="item.imageUrl"
          class="original-img"
        >

        <!-- mask 覆盖层 -->
        <img
          :src="item.maskImage || headTemplateImage"
          class="absolute inset-0 w-full h-full pointer-events-none"
        >

        <!-- 上传提示（可选） -->
        <label
          v-if="props.replaceImageList[idx].imageUrl === item.imageUrl"
          class="upload-prompt"
        >
          <span>上传更换图片</span>
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
    <!-- 文本替换区 -->
    <div class="text-box">
      <div
        v-for="(item, idx) in props.replaceText"
        :key="`text-${idx}`"
        class="text-item"
      >
        <div class="item-label">
          “{{ item.label }}” 修改为
        </div>

        <n-input
          v-model:value="localReplaceText[idx].value"
          type="text"
          class="item-input"
          :placeholder="`${item.label}修改为`"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dynamic-image-list-container {
  box-sizing: border-box;
  .img-box {
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    .img-item {
      width: calc((100% - 18px) / 2);
      aspect-ratio: 1;
      border-radius: 16px;
      overflow: hidden;
      .original-img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
      }
      .upload-prompt {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 34px;
        background: linear-gradient(270deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
        font-weight: bold;
        line-height: 12px;
        color: #ffffff;
        cursor: pointer;
      }
    }
  }
  .text-box {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    .text-item {
      .item-label {
        font-size: 16px;
        font-weight: bold;
        line-height: 24px;
        color: #111111;
        margin-bottom: 16px;
      }
      :deep(.item-input) {
        width: 100%;
        height: 52px;
        --n-border-radius: 12px !important;
        background: #f9fafb;
        box-sizing: border-box;
        --n-border: 1px solid #f3f4f6 !important;
        --n-border-hover: 1px solid #f3f4f6 !important;
        --n-border-focus: 1px solid #ffddcc !important;
        --n-box-shadow-focus: 0px 0px 30px 0px rgba(255, 246, 242) !important;
        .n-input__input-el {
          height: 100%;
          font-size: 14px;
          font-weight: bold;
          color: #111111;
        }
        .n-input__placeholder {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: normal;
          color: #757575;
        }
      }
      :deep(.n-input--focus) {
        background-color: #fff;
      }
    }
  }
}
</style>
