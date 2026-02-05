<script setup lang="ts">
import type { CustomRequestParams, EchoData, EffectDescItem, StyleDescription, SubmitParams } from './index.api'
import type { TaskInfo } from '@/store/use-user-store'
import { useMessage } from 'naive-ui'
import { computed, ref } from 'vue'
import CollapseSelect from '@/components/collapse-select/index.vue'
import ImageDisplayGroups from '@/components/image-display-groups/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { useCurrentRouteData } from '../../composables/useCurrentRouteData'
import { useGenerateTaskPolling } from '../../composables/useGenerateTaskPolling'
import { getImageRatio, getResolutionFromRatioLabel } from '../../utils/getImageRatio'
import { Api } from './index.api'

const message = useMessage()
const { currentRouteData } = useCurrentRouteData()
console.log(currentRouteData.value, 'currentRouteData')

const values = ref<CustomRequestParams>({
  // 原图
  url: null,
  // 比例
  size: '16:9',
  // 尺寸
  imageSize: '2K',
  //  参考图列表
  styleUrl: [],
})

const customText = ref('') // 高级自定义文案
// 添加图片选择器的 ref
const imageGallerySelectorRef = ref()

function handleImageConfirm(value: string | null) {
  if (!value)
    return
  values.value.styleUrl.push(value)
}

function removeImage(index: number) {
  values.value.styleUrl.splice(index, 1)
}

const originListData = ref<EffectDescItem[]>([])
const filterListData = ref<EffectDescItem[]>([])
const showActionPanel = ref(false) // 右侧动作图选择面板
const selectReferenceInfo = ref<StyleDescription>({
  text: [],
  name: '',
  styleUrl: '',
})
const filterName = ref('')

function validateAll() {
  // 1. 表单校验
  if (!values.value.url) {
    message.warning($t('aiDraw.common.messages.addOriginalImage'))
    return false
  }
  // TODO：请选择/输入优化内容
  if (!selectReferenceInfo.value.name && !(values.value.styleUrl.length || customText.value)) {
    message.warning('请选择/输入主题内容')
    return false
  }
  return true
}

const inputBinding = computed({
  get: () => customText.value,
  set: (val: string) => {
    if (selectReferenceInfo.value.styleUrl.length) {
      message.warning('请先删除选择的主题')
      return
    }
    customText.value = val
  },
})

function getFilterList() {
  filterListData.value = originListData.value.filter((item) => {
    return item.style.some((s) => {
      return s.name.includes(filterName.value)
    })
  })
}

function uploadRefrenceImage() {
  if (selectReferenceInfo.value.styleUrl.length) {
    message.warning('请先删除选择的主题')
    return
  }
  imageGallerySelectorRef.value.openGalleryModal()
}

// 打开右侧动作图选择面板
function openActionPanel() {
  if (values.value.styleUrl.length || customText.value) {
    message.warning('请先删除高级自定义的内容')
    return
  }
  try {
    // 解析 effectDesc 字段获取分类数据
    const effectDesc = currentRouteData.value.effectDesc
    if (effectDesc) {
      originListData.value = JSON.parse(effectDesc)
    }
    else {
      originListData.value = []
    }

    showActionPanel.value = true
  }
  catch (error) {
    console.error($t('aiDraw.sketch.messages.parseStyleDataFail'), error)
    originListData.value = []
    showActionPanel.value = true
  }
  finally {
    filterListData.value = originListData.value
  }
}

function closeActionPanel() {
  showActionPanel.value = false
  filterName.value = ''
}

function removeRefrenceImage() {
  selectReferenceInfo.value = {
    text: [],
    name: '',
    styleUrl: '',
  }
}

function selectActionImageFromPanel(value: StyleDescription) {
  selectReferenceInfo.value = value
  closeActionPanel()
}

function getImageKey(c: number, s: number) {
  return `${c}-${s}`
}

const imageRefs = ref<Record<string, any>>({})

function openPreview(categoryIndex: number, styleIndex: number) {
  const key = getImageKey(categoryIndex, styleIndex)
  imageRefs.value[key]?.showPreview?.()
}

async function preGenerateHandler() {
  closeActionPanel()
  const pollingValues = []
  if (selectReferenceInfo.value.styleUrl) {
    const size = await getImageRatio(selectReferenceInfo.value.styleUrl)
    for (let i = 0; i < 4; i++) {
      const value = {
        text: selectReferenceInfo.value.text[i],
        // styleUrl: selectReferenceInfo.value.styleUrl,
        imageSize: values.value.imageSize,
        sizex: getResolutionFromRatioLabel(size),
        size,
        url: values.value.url,
      }
      pollingValues.push(value)
    }
  }
  else {
    const size = values.value.url ? await getImageRatio(values.value.url) : values.value.size
    pollingValues.push({
      size,
      imageSize: values.value.imageSize,
      url: values.value.url,
      sizex: getResolutionFromRatioLabel(size),
      text: customText.value,
      // styleUrl: values.value.styleUrl.join(','),
    })
  }

  return pollingValues
}

const context = computed<EchoData>(() => {
  return {
    selectReferenceInfo: selectReferenceInfo.value,
    customText: customText.value,
    url: values.value.url,
    styleUrl: values.value.styleUrl,
    imageSize: values.value.imageSize,
    size: values.value.size,
  }
})

function handleEchoData(context: EchoData) {
  selectReferenceInfo.value = context.selectReferenceInfo
  customText.value = context.customText
  values.value = {
    url: context.url,
    styleUrl: context.styleUrl,
    imageSize: context.imageSize,
    size: context.size,
  }
}

const {
  resultUrl,
  generateStatus,
  buttonText,
  isButtonDisabled,
  handleGenerate,
  generateDataList,
} = useGenerateTaskPolling<SubmitParams, TaskInfo>({
  values,
  context,
  api: Api,
  validateAll,
  handleEchoData,
  currentRouteData,
  preGenerateHandler,
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
          <div class="text-16px line-height-24px font-medium flex items-center">
            选择主题
            <span class="c-#666 text-14px font-400">（每个主题生成四张图）</span>
          </div>
          <div class="flex flex-wrap gap-12px items-start mt-8px mb-16px h-359px">
            <div
              v-show="selectReferenceInfo.styleUrl.length"
              class="relative size-full min-h-327px flex items-center rounded-12px overflow-hidden cursor-pointer group"
            >
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                @click="removeRefrenceImage()"
              >
                <img
                  class="size-20px"
                  src="@/assets/icon/trash.svg"
                >
              </div>
              <div class="size-full flex flex-col items-center gap-8px">
                <div class="flex-1 box-border flex flex-wrap items-center w-245px h-327px">
                  <img
                    :src="selectReferenceInfo.styleUrl"
                    class="size-full object-fill"
                  >
                </div>
                <div class="text-16px line-height-24px w-full pl-10px box-border">
                  {{ selectReferenceInfo.name }}
                </div>
              </div>
            </div>

            <div
              v-show="!selectReferenceInfo.styleUrl.length"
              class="size-327px bg-#F5F5F5 rounded-12px flex flex-col items-center justify-center cursor-pointer text-gray-500"
              @click="openActionPanel"
            >
              <span class="text-32px">+</span>
              <span class="text-16px mt-4px">选择上传</span>
            </div>
          </div>

          <div class="text-16px font-bold text-size-16px c-#000000 mb-8px">
            人物图片
          </div>
          <image-gallery-selector
            v-model="values.url"
          />
          <collapse-select
            title="高级自定义"
            sub-title="支持上传6张"
            tooltip-url="https://www.baidu.com/"
          >
            <image-gallery-selector
              ref="imageGallerySelectorRef"
              :model-value="null"
              @confirm="handleImageConfirm"
            >
              <div class="flex flex-wrap gap-12px items-start mt-8px">
                <!-- 图片列表 -->
                <div
                  v-for="(img, idx) in values.styleUrl"
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

                <div
                  v-show="values.styleUrl.length < 6"
                  class="size-100px bg-#F5F5F5 rounded-12px flex flex-col items-center justify-center cursor-pointer text-#666"
                  @click="uploadRefrenceImage"
                >
                  <img
                    src="@/assets/icon/add.svg"
                    class="size-24px mb-4px"
                  >
                  <span class="text-12px mt-4px">上传参考图</span>
                </div>
              </div>
            </image-gallery-selector>
            <n-input
              v-model:value="inputBinding"
              type="textarea"
              maxlength="2000"
              show-count
              placeholder="输入提示词"
              class="mt-12px"
              rows="7"
            />
          </collapse-select>
          <div class="text-16px line-height-24px font-medium flex items-center mt-16px">
            分辨率
            <span class="c-#666 text-14px font-400">（分辨率越大，生成时间越长）</span>
          </div>
          <div class="flex items-center gap-16px mt-8px">
            <div
              v-for="item in [
                { label: '2K', value: '2K' },
                { label: '4K', value: '4K' },
              ]"
              :key="item.value"
              class="w-155px h-48px box-border rounded-12px flex items-center justify-center cursor-pointer text-16px c-#000000 font-500 border-1px border-solid border-#E7E7E7"
              :class="[
                (item.value === values.imageSize) && 'border-#000000!',
              ]"
              @click="values.imageSize = item.value"
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
          <span class="pl-4px pt-7px text-12px h-16px c-#fbfbfbfc">{{ $t('aiDraw.common.costPoints', { points: currentRouteData.point * 4 }) }}</span>
        </n-button>
      </div>
    </div>
    <div
      v-show="showActionPanel"
      class="h-full flex-1 flex flex-col"
    >
      <!-- 面板头部 -->
      <div class="flex items-center justify-between h-30px px-20px pt-22px border-b-1px border-b-#E7E7E7">
        <div class="font-medium text-16px line-height-22px c-#000">
          主题库
        </div>
        <n-input
          v-model:value="filterName"
          size="large"
          clearable
          placeholder="搜索"
          class="bg-#F7F7F7 rounded-12px w-280px! h-44px flex items-center justify-center search-input"
          :theme-overrides="{
            border: 'none',
            borderHover: '0px solid transparent',
            borderFocus: '1px solid #000',
            boxShadowFocus: '0 0 0 0px #eeeeee',
          }"
          @update:value="getFilterList()"
        >
          <template #prefix>
            <img
              src="@/assets/icon/search.svg"
              class="size-20px"
            >
          </template>
        </n-input>
      </div>
      <!-- 图片网格 -->
      <div class="flex-1 pt-16px">
        <template v-if="filterListData.length">
          <n-scrollbar class="h-[calc(var(--design-vh)-160px-28px)]">
            <div class="p-20px">
              <div class="space-y-24px">
                <div
                  v-for="(item, categoryIndex) in filterListData"
                  :key="categoryIndex"
                  class="space-y-12px"
                >
                  <div class="text-16px font-medium text-#000 mb-8px">
                    {{ item.them }}
                  </div>

                  <div class="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-16px">
                    <div
                      v-for="(styleItem, styleIndex) in item.style"
                      :key="styleIndex"
                      class="relative cursor-pointer flex flex-col"
                      @click="selectActionImageFromPanel(styleItem)"
                    >
                      <div
                        class="relative w-full flex flex-1 min-h-340px flex-wrap aspect-square rounded-12px overflow-hidden bg-#F7F7F7 group"
                      >
                        <!-- 图片 -->
                        <n-image
                          :ref="el => imageRefs[getImageKey(categoryIndex, styleIndex)] = el"
                          lazy
                          :src="`${styleItem.styleUrl}?imageMogr2/thumbnail/404x404`"
                          :preview-src="`${styleItem.styleUrl}${styleItem.styleUrl.includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                          :alt="styleItem.name"
                          class="size-full flex justify-center"
                          width="100%"
                          height="100%"
                          object-fit="contain"
                          :render-toolbar="createImageToolbar(styleItem.styleUrl)"
                        />

                        <!-- 悬浮遮罩 -->
                        <div
                          class="absolute inset-0 bg-black/40 opacity-0
           group-hover:opacity-100 transition
           flex items-end justify-end p-12px"
                        >
                          <div
                            class="size-32px rounded-8px
             flex items-center justify-center
             cursor-pointer  transition"
                            @click.stop="openPreview(categoryIndex, styleIndex)"
                          >
                            <img
                              src="@/assets/icon/zoom-in.svg"
                              class="size-20px"
                            >
                          </div>
                        </div>
                      </div>

                      <div class="mt-10px text-17px c-#000 line-height-24px">
                        {{ styleItem.name }}
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
      v-show="!showActionPanel"
      class="h-full w-[calc(100%-360px)] box-border draw-area p-y-103px p-x-24px"
    >
      <div class="size-full rounded-16px bg-#FFF relative overflow-hidden">
        <!-- 图片展示区域 -->
        <image-display-groups
          :generate-status="generateStatus"
          :result-url="resultUrl"
          :generate-data-list="generateDataList"
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
