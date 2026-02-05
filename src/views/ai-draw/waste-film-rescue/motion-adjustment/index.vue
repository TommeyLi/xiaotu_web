<script setup lang="ts">
import type { CustomRequestParams, EchoData, StyleDescription, SubmitParams } from './index.api'
import type { TaskInfo } from '@/store/use-user-store'
import { Icon } from '@iconify/vue'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CollapseSelect from '@/components/collapse-select/index.vue'
import ImageDisplayGroups from '@/components/image-display-groups/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import MasonryGrid from '@/components/masonry-grid/index.vue'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { useCurrentRouteData } from '../../composables/useCurrentRouteData'
import { useGenerateTaskPolling } from '../../composables/useGenerateTaskPolling'
import { Api as DrawApi } from '../../index.api'
import { getImageRatio, getResolutionFromRatioLabel } from '../../utils/getImageRatio'
import { Api } from './index.api'

const message = useMessage()
const route = useRoute()
const { currentRouteData } = useCurrentRouteData()
console.log(currentRouteData.value, 'currentRouteData')

const values = ref<CustomRequestParams>({
  // 原图
  url: null,
  //  参考图列表
  styleUrl: [],
  // 比例
  size: '16:9',
  // 尺寸
  imageSize: '2K',
})
const customText = ref('') // 高级自定义文案
// 添加图片选择器的 ref
const imageGallerySelectorRef = ref()
// 特效列表查询参数
const query = ref({
  pageNum: '1',
  pageSize: '32',
})
const loading = ref(false)
const hasMore = ref(true)
const total = ref(0)

function handleImageConfirm(value: string | null) {
  if (!value)
    return
  values.value.styleUrl.push(value)
}

function removeImage(index: number) {
  values.value.styleUrl.splice(index, 1)
}

const originListData = ref<StyleDescription[]>([])
const showActionPanel = ref(false) // 右侧动作图选择面板
const selectReferenceList = ref<StyleDescription[]>([])
// const filterOptions = ref<FilterOptions>({
//   props: null,
//   gender: null,
//   costume: null,
// })

const generatePoints = computed(() => {
  const basicPoint = currentRouteData.value.point
  return basicPoint * (selectReferenceList.value.length || 1)
})

const inputBinding = computed({
  get: () => customText.value,
  set: (val: string) => {
    if (selectReferenceList.value.length > 0) {
      message.warning('请先删除选择的动作')
      return
    }
    customText.value = val
  },
})

function validateAll() {
  // 1. 表单校验
  if (!values.value.url) {
    message.warning($t('aiDraw.common.messages.addOriginalImage'))
    return false
  }
  // TODO：请选择/输入优化内容
  if (selectReferenceList.value.length <= 0 && !(values.value.styleUrl.length || customText.value)) {
    message.warning('请选择/输入动作内容')
    return false
  }
  return true
}

function generateSelectList(data: StyleDescription[]) {
  const propsSet = new Set<string>()
  const genderSet = new Set<string>()
  const costumeSet = new Set<string>()

  data.forEach((item) => {
    if (item.props)
      propsSet.add(item.props)
    if (item.gender)
      genderSet.add(item.gender)
    if (item.costume)
      costumeSet.add(item.costume)
  })

  const propsList = [...propsSet].map(v => ({ label: v, value: v }))
  const genderList = [...genderSet].map(v => ({ label: v, value: v }))
  const costumeList = [...costumeSet].map(v => ({ label: v, value: v }))

  return { propsList, genderList, costumeList }
}

const actionsSearchOptions = ref<{ propsList: any[], genderList: any[], costumeList: any[] }>({
  propsList: [],
  genderList: [],
  costumeList: [],
})

// 打开右侧动作图选择面板
function openActionPanel() {
  if (values.value.styleUrl.length || customText.value) {
    message.warning('请先删除高级自定义的内容')
    return
  }
  try {
    showActionPanel.value = true
  }
  catch (error) {
    console.error($t('aiDraw.sketch.messages.parseStyleDataFail'), error)
    originListData.value = []
    showActionPanel.value = true
  }
  finally {
    actionsSearchOptions.value = generateSelectList(originListData.value)
    // filterListData.value = originListData.value
  }
}

// function filterData() {
//   const { props, gender, costume } = filterOptions.value
//   filterListData.value = originListData.value.filter((item) => {
//     return item.style.some((s) => {
//       const matchProps = props ? s.props === props : true
//       const matchGender = gender ? s.gender === gender : true
//       const matchCostume = costume ? s.costume === costume : true

//       return matchProps && matchGender && matchCostume
//     })
//   })
// }

function closeActionPanel() {
  showActionPanel.value = false
  // filterOptions.value = { props: null, gender: null, costume: null }
}

function removeRefrenceImage(index: number) {
  selectReferenceList.value.splice(index, 1)
}

function selectActionImageFromPanel(value: StyleDescription) {
  if (selectReferenceList.value.length === 4) {
    message.warning('动作参考最多添加4张图片')
    closeActionPanel()
    return
  }
  if (selectReferenceList.value.some(t => t.styleUrl === value.styleUrl)) {
    closeActionPanel()
    return
  }
  selectReferenceList.value = selectReferenceList.value.concat(value)
  closeActionPanel()
}

function uploadRefrenceImage() {
  if (selectReferenceList.value.length) {
    message.warning('请先删除选择的动作')
    return
  }
  imageGallerySelectorRef.value.openGalleryModal()
}

const imageRefs = ref<Record<string, any>>({})

function openPreview(id: string) {
  imageRefs.value[id]?.showPreview?.()
}

async function preGenerateHandler() {
  let pollingValues = []
  closeActionPanel()
  if (selectReferenceList.value.length) {
    pollingValues.push(
      ...await Promise.all(selectReferenceList.value.map(async (t) => {
        const size = await getImageRatio(t.styleUrl)
        return {
          text: customText.value + t.text,
          // styleUrl: [t.styleUrl, ...values.value.styleUrl].join(','),
          url: values.value.url,
          size,
          imageSize: values.value.imageSize,
          sizex: getResolutionFromRatioLabel(size),
        }
      })),
    )
  }
  else {
    const size = values.value.url ? await getImageRatio(values.value.url) : values.value.size
    pollingValues = [
      {
        text: customText.value,
        // styleUrl: values.value.styleUrl.join(','),
        url: values.value.url,
        size,
        imageSize: values.value.imageSize,
        sizex: getResolutionFromRatioLabel(size),
      },
    ]
  }
  return pollingValues
}

const context = computed<EchoData>(() => {
  return {
    selectReferenceList: selectReferenceList.value,
    url: values.value.url,
    styleUrl: values.value.styleUrl,
    customText: customText.value,
    imageSize: values.value.imageSize,
    size: values.value.size,
    styleId: selectReferenceList.value.map(t => t.id) || [],
  }
})

function handleEchoData(context: EchoData) {
  selectReferenceList.value = context.selectReferenceList
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

const filterOptions = ref<{ items: [], value: string, type: string }[]>([])

async function getTemplateInfo(loadMore = false) {
  if (loading.value)
    return
  loading.value = true
  try {
    const valueList = filterOptions.value.map(t => t.value).filter(Boolean)
    const exart = valueList.length ? { dictIds: valueList } : {}
    const { data } = await DrawApi.getEffectListv2({
      id: currentRouteData.value.effectId,
      ...exart,
      ...query.value,
    })

    if (loadMore) {
      // 加载更多时追加数据
      originListData.value = [...originListData.value, ...(data.list ?? [])]
    }
    else {
      // 重新加载时替换数据
      originListData.value = data.list ?? []
    }

    // 更新总数和是否有更多数据
    total.value = data.total ?? 0
    hasMore.value = originListData.value.length < total.value

    console.log('data.list', data.list)
    console.log('originListData.value', originListData.value)
  }
  catch (error) {
    console.error('获取模板信息失败:', error)
    message.error('加载失败')
  }
  finally {
    loading.value = false
  }
}

// 滚动事件处理
function handleScroll(e: Event) {
  if (loading.value || !hasMore.value)
    return

  const container = e.target as HTMLElement
  if (!container)
    return

  // 检查是否滚动到底部
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight

  // 距离底部 100px 时开始加载
  if (scrollHeight - scrollTop - clientHeight < 100) {
    loadMoreData()
  }
}

// 加载更多数据
async function loadMoreData() {
  if (loading.value || !hasMore.value)
    return

  // 更新页码
  const currentPage = Number.parseInt(query.value.pageNum)
  query.value.pageNum = (currentPage + 1).toString()

  await getTemplateInfo(true)
}

async function getFilterOptions() {
  const { data } = await DrawApi.getFilterOptions({
    id: currentRouteData.value.effectId,
  })
  filterOptions.value = data ?? []
}

function findStyleById(id: any): StyleDescription | undefined {
  const targetId = String(id)
  return originListData.value.find(item => String(item.id) === targetId)
}

getTemplateInfo()
getFilterOptions()
onMounted(async () => {
  if (route.query.id) {
    const found = findStyleById(route.query.id as string)
    if (found)
      selectReferenceList.value = [found]
  }
})

// 筛选
function filter() {
  originListData.value = []
  query.value.pageNum = '1'
  getTemplateInfo()
}
</script>

<template>
  <div class="w-full h-full flex">
    <div class="setting-list relative">
      <n-scrollbar
        :x-scrollable="false"
        class="h-full w-full"
      >
        <div class="scrollbar-content">
          <span class="headline">
            选择动作参考
          </span>
          <div class="upload-list">
            <div
              v-for="(item, idx) in selectReferenceList"
              :key="idx"
              class="upload-img relative cursor-pointer group"
            >
              <img
                :src="item.styleUrl"
                class="w-full h-full object-contain"
              >
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                @click="removeRefrenceImage(idx)"
              >
                <img
                  class="size-20px"
                  src="@/assets/icon/trash.svg"
                >
              </div>
            </div>

            <div
              v-show="selectReferenceList.length < 4"
              class="add-btn"
              :class="selectReferenceList.length > 0 ? 'add-btn1' : ''"
              @click="openActionPanel"
            >
              <icon
                icon="mdi:plus"
                class="add-icon"
              />
            </div>
          </div>

          <div class="headline">
            {{ $t('aiDraw.common.sections.originalImage') }}
          </div>
          <image-gallery-selector
            v-model="values.url"
          />
          <collapse-select
            class="advanced-customization-box"
            title="高级自定义"
            sub-title="支持上传6张"
            tooltip-url="https://www.baidu.com/"
          >
            <div class="advanced-customization">
              <image-gallery-selector
                ref="imageGallerySelectorRef"
                :model-value="null"
                @confirm="handleImageConfirm"
              >
                <div class="flex flex-wrap img-list">
                  <!-- 图片列表 -->
                  <div
                    v-for="(img, idx) in values.styleUrl"
                    :key="img"
                    class="relative overflow-hidden cursor-pointer group img-item"
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
                    class="img-item"
                    @click="uploadRefrenceImage"
                  >
                    <img
                      src="@/assets/icon/add.svg"
                      class="add-icon"
                    >
                    <span class="add-text">上传参考图</span>
                  </div>
                </div>
              </image-gallery-selector>
              <!-- 聚焦的时候判断是否selectReferenceList.value.length存在 -->
              <n-input
                v-model:value="inputBinding"
                type="textarea"
                maxlength="2000"
                show-count
                placeholder="输入提示词"
                class="input-textarea"
                rows="7"
              />
            </div>
          </collapse-select>
          <div class="headline interval">
            分辨率
          </div>
          <div class="dpi-box">
            <div
              v-for="item in [
                { label: '2K', value: '2K' },
                { label: '4K', value: '4K' },
              ]"
              :key="item.value"
              class="dpi-item"
              :class="[item.value === values.imageSize ? 'dpi-activity' : '']"
              @click="values.imageSize = item.value"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
      </n-scrollbar>
      <!-- 固定底部按钮 -->
      <div class="absolute bottom-0 left-0 box-border generate-box">
        <n-button
          class="generate-btn"
          :class="isButtonDisabled ? 'generate-activity' : ''"
          color="#FF6A00"
          :disabled="isButtonDisabled"
          size="large"
          @click="handleGenerate"
        >
          <div class="generate-text">
            <span>{{ buttonText }}</span>
            <img
              class="arrow-right"
              src="@/assets/icon/arrow-right.png"
            >
          </div>

          <div class="generate-tip">
            {{ $t('aiDraw.common.costPoints', { points: generatePoints }) }}
          </div>
        </n-button>
      </div>
    </div>
    <div
      v-show="showActionPanel"
      class="h-full flex-1 flex flex-col action-library-box"
    >
      <!-- 面板头部 -->
      <div class="content-top">
        <div class="content-title">
          动作库
        </div>
        <n-button
          class="close-btn"
          text
          @click="closeActionPanel"
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
      <!-- 查询框 -->
      <div class="query-list">
        <n-select
          v-for="(t, i) in filterOptions"
          :key="i"
          v-model:value="t.value"
          :options="t.items"
          :placeholder="t.type"
          label-field="name"
          value-field="id"
          clearable
          filterable
        />
        <div
          class="filtrate-box"
          @click="filter"
        >
          筛选
        </div>
      </div>
      <!-- 图片网格 -->
      <div
        v-loading="loading"
        class="flex-1 action-list-box"
      >
        <template v-if="originListData.length">
          <n-scrollbar
            id="image-scroll-container"
            class="w-full h-full"
            @scroll="handleScroll"
          >
            <masonry-grid
              :list="originListData"
              :min-column-width="260"
              :gutter="16"
            >
              <template #default="{ item }">
                <div
                  class="relative cursor-pointer overflow-hidden group action-item"
                  @click="selectActionImageFromPanel(item)"
                >
                  <n-image
                    :ref="el => { if (el) imageRefs[String(item.id)] = el }"
                    :src="`${item.styleUrl}?imageMogr2/thumbnail/904x904`"
                    :preview-src="`${item.styleUrl}${item.styleUrl.includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                    :alt="item.styleUrl"
                    width="100%"
                    :intersection-observer-options="{
                      root: '#image-scroll-container',
                    }"
                    class="w-full flex justify-center"
                    object-fit="contain"
                    :render-toolbar="createImageToolbar(item.styleUrl)"
                  >
                    <template #placeholder>
                      <div
                        style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #f5f5f5; border-radius: 12px;"
                      >
                        <div class="skeleton-loader" />
                      </div>
                    </template>
                  </n-image>
                  <!-- 悬浮遮罩 -->
                  <div
                    class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-end justify-end p-12px"
                  >
                    <div
                      class="size-32px rounded-8px flex items-center justify-center cursor-pointer transition"
                      @click.stop="openPreview(String(item.id))"
                    >
                      <img
                        src="@/assets/icon/zoom-in.svg"
                        class="size-20px"
                      >
                    </div>
                  </div>
                </div>
              </template>
            </masonry-grid>
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
      class="h-[calc(var(--design-vh)-78px-16px-28px)] w-[calc(100%-360px)] box-border p-y-78px p-x-17px relative"
    >
      <image-display-groups
        :generate-status="generateStatus"
        :result-url="resultUrl"
        :generate-data-list="generateDataList"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.skeleton-loader {
  width: 100%;
  height: 234px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 37%, #f5f5f5 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
  border: 1px solid red;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
.setting-list {
  :deep(.n-scrollbar) {
    width: 27.4375rem;
  }
  width: 27.4375rem;
  border: 0.0625rem solid #e5e7eb;
  border-width: 0rem 0.0625rem 0rem 0.0625rem;
  .scrollbar-content {
    width: 100%;
    padding: 2.5rem 2.5rem 9.0625rem;
    box-sizing: border-box;
  }
}
.headline {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: bold;
  line-height: 1.3125rem;
  color: #111111;
  display: block;
  padding-bottom: 0.875rem;
}
.upload-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.125rem;
  margin-bottom: 1.5rem;
  .upload-img {
    width: calc((100% - 1.125rem) / 2);
    aspect-ratio: 1;
    box-sizing: border-box;
    border-radius: 1rem;
    overflow: hidden;
  }
  .add-btn {
    width: 100%;
    height: 10.7188rem;
    border-radius: 1rem;
    background: #f9fafb;
    box-sizing: border-box;
    border: 0.125rem dashed #f3f4f6;
    box-shadow:
      0rem 0.0625rem 0.125rem 0rem rgba(0, 0, 0, 0.05),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    .add-icon {
      width: 1.75rem;
      height: 1.75rem;
      color: #9ca3af;
    }
  }
  .add-btn1 {
    width: calc((100% - 1.125rem) / 2);
    aspect-ratio: 1;
  }
  .add-btn:hover {
    border-color: #ffccb2;
    background-color: #ffffff;
    .add-icon {
      color: #ff5500;
    }
  }
}
.advanced-customization-box {
  margin: 2.0625rem 0 2.25rem;
}
.advanced-customization {
  width: 100%;
  .img-list {
    gap: 0.75rem;
    margin-bottom: 1rem;
    .img-item {
      width: 6rem;
      height: 6rem;
      border-radius: 1rem;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.4688rem;
      cursor: pointer;
      .add-icon {
        width: 1.5rem;
        height: 1.5rem;
        transition: transform 0.3s ease;
      }
      .add-text {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: bold;
        line-height: 1.125rem;
        color: #6b7280;
      }
    }
    .img-item:hover {
      background-color: #e5e7eb;
      .add-icon {
        transform: scale(1.1);
      }
    }
  }
  .input-textarea {
    width: 100%;
    height: 8rem;
    background: #ffffff;
    box-sizing: border-box;
    --n-border-focus: 0.0625rem solid #ffccb2 !important;
    --n-border-hover: 0.0625rem solid #e5e7eb !important;
    --n-box-shadow-focus: none !important; /* 聚焦阴影 */
    --n-border-radius: 1rem !important;
    --n-border: 0.0625rem solid #e5e7eb !important;
    transition: none !important;
    :deep(.n-input-wrapper) {
      padding: 1.0625rem;
      box-sizing: border-box;
      .n-input__textarea-el {
        padding: 0 !important;
      }
      .n-input__placeholder {
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.3125rem;
        color: #757575;
        padding-top: 0;
      }
    }
    :deep(.n-input__border),
    :deep(.n-input__state-border) {
      transition: none !important;
    }
    &:not(:deep(.n-input--focus)):hover {
      :deep(.n-input__border),
      :deep(.n-input__state-border) {
        border-color: #e5e7eb !important;
        box-shadow: none !important;
      }
    }
  }
}
:deep(.n-input--focus) {
  .n-input-word-count {
    color: #ff5500;
  }
}
.dpi-box {
  width: 100%;
  height: 3.75rem;
  border-radius: 1rem;
  background: #f9fafb;
  padding: 0.375rem;
  box-sizing: border-box;
  display: flex;
  gap: 0.75rem;
  .dpi-item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 900;
    color: #9ca3af;
    border-radius: 0.75rem;
    cursor: pointer;
  }
  .dpi-item:hover {
    color: #111111;
  }
  .dpi-activity {
    background: #ffffff;
    box-shadow:
      0rem 0.125rem 0.25rem -0.125rem rgba(0, 0, 0, 0.1),
      0rem 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    color: #111111;
  }
}
.generate-box {
  width: 100%;
  padding: 2rem 2.5rem;
  background: #ffffff;
  box-shadow:
    0rem -0.625rem 1.875rem -0.9375rem rgba(0, 0, 0, 0.05),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
  border-top: 0.0625rem solid #e5e7eb;
  z-index: 12;
  .generate-btn {
    width: 100%;
    height: 4rem;
    border-radius: 624.9375rem;
    box-sizing: border-box;
    background: #ff5500;
    box-shadow:
      0rem 0.9375rem 2.5rem -0.625rem rgba(255, 85, 0, 0.35),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    cursor: pointer;
    :deep(.n-button__content) {
      display: flex;
      flex-direction: column;
    }
    .generate-text {
      height: 1.6875rem;
      display: flex;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 900;
      line-height: 1.6875rem;
      letter-spacing: -0.0281rem;
      color: #ffffff;
      .arrow-right {
        width: 1.125rem;
        height: 1.125rem;
        margin-left: 0.325rem;
        transition: transform 0.3s ease-out;
      }
    }
    .generate-tip {
      font-family: 'Inter', sans-serif;
      font-size: 0.6875rem;
      font-weight: bold;
      line-height: 1.0313rem;
      letter-spacing: -0.0175rem;
      color: #ffddcc;
    }
  }
  .generate-btn:hover {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    background-position: -200% 0;
    animation: sweep 4s infinite linear;

    /* 基础背景色 */
    background-color: #ea580c;
    background-blend-mode: overlay;
    .generate-text {
      .arrow-right {
        transform: translateX(0.3125rem);
      }
    }
  }
  .generate-activity,
  .generate-activity:hover {
    cursor: not-allowed;
    .generate-text {
      .arrow-right {
        transform: none;
      }
    }
  }

  @keyframes sweep {
    100% {
      background-position: -200% 0;
    }
    0% {
      background-position: 200% 0;
    }
  }
}
.action-library-box {
  box-sizing: border-box;
  padding: 3rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .content-top {
    width: 100%;
    height: 5.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .content-title {
      font-family: 'Inter', sans-serif;
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.0375rem;
      color: #111111;
    }
    .close-btn {
      width: 1.5rem;
      height: 1.5rem;
      cursor: pointer;
    }
  }
  .query-list {
    display: flex;
    gap: 1.4375rem;
    .filtrate-box {
      width: 5.75rem;
      height: 2.625rem;
      border-radius: 0.75rem;
      background: #ff5500;
      box-shadow:
        0rem 0.25rem 0.375rem -0.25rem rgba(255, 85, 0, 0.2),
        0rem 0.625rem 0.9375rem -0.1875rem rgba(255, 85, 0, 0.2),
        0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
        0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: bold;
      color: #ffffff;
      cursor: pointer;
    }
    .filtrate-box:hover {
      background: #ea580c;
    }
    :deep(.n-select) {
      flex: 1;
      max-width: 14.375rem;
      min-width: 10rem;
      .n-base-selection {
        width: 100%;
        height: 2.625rem;
        --n-border: 0.0625rem solid #e5e7eb !important;
        --n-border-radius: 0.75rem !important;
        --n-border-hover: 1px solid #ff5500 !important;
        --n-box-shadow-hover: none !important;
        --n-border-focus: 1px solid #ff5500 !important;
        --n-box-shadow-focus: none !important;
        --n-box-shadow-active: none !important;
        .n-base-selection-label {
          height: 100%;
          .n-base-selection-placeholder {
            font-family: 'Inter', sans-serif;
            font-size: 0.8125rem;
            font-weight: bold;
            color: #6b7280;
            box-sizing: border-box;
            padding-left: 1.75rem;
          }
          .n-base-selection-overlay {
            padding-left: 1.75rem;
          }
          .n-base-selection-input {
            padding-left: 1.75rem;
          }
          .n-base-suffix {
            right: 1.75rem;
          }
        }
      }
    }
    :deep(.n-select .n-base-selection:hover) {
      --n-text-color: #ff5500 !important; /* 提示文本颜色 */
      --n-arrow-color: #ff5500 !important; /* 箭头颜色 */
      --n-placeholder-color: #ff5500 !important; /* 占位符文本颜色 */
      .n-base-selection-label {
        .n-base-selection-placeholder {
          color: #ff5500;
        }
      }
    }
  }
  .action-list-box {
    flex: 1;
    overflow: hidden;
    margin-top: 2rem;
    .action-item {
      border-radius: 0.75rem;
    }
  }
}
</style>
