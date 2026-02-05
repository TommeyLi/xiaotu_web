<script setup lang="ts">
import type { CustomRequestParams, EchoData, StyleDescription, SubmitParams, SubmitRequestParams } from './index.api'
import type { TaskInfo } from '@/store/use-user-store'
import { Icon } from '@iconify/vue'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CollapseSelect from '@/components/collapse-select/index.vue'
import ImageDisplay from '@/components/image-display/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import MasonryGrid from '@/components/masonry-grid/index.vue'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { useCurrentRouteData } from '../../composables/useCurrentRouteData'
import { useGenerateTask } from '../../composables/useGenerateTask'
import { Api as DrawApi } from '../../index.api'
import { getImageRatio, getResolutionFromRatioLabel } from '../../utils/getImageRatio'
import DynamicImageList from './components/dynamic-image-list.vue'
import { Api } from './index.api'

const message = useMessage()
const route = useRoute()
const { currentRouteData } = useCurrentRouteData()
console.log(currentRouteData.value, 'currentRouteData')

const values = ref<CustomRequestParams>({
  //  参考图列表
  styleUrl: [],
  // 比例
  size: '16:9',
  // 尺寸
  imageSize: '2K',
})

const customText = ref('') // 高级自定义文案
const imageListRef = ref()
// 添加图片选择器的 ref
const imageGallerySelectorRef = ref()
const filterOptions = ref<{ items: [], value: string, type: string }[]>([])
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
const selectTemplateInfo = ref<StyleDescription>({
  num: 0,
  id: '',
  styleUrl: '',
  background: '',
  images: [],
})

const inputBinding = computed({
  get: () => customText.value,
  set: (val: string) => {
    if (selectTemplateInfo.value.styleUrl) {
      message.warning('请先删除选择的模板')
      return
    }
    customText.value = val
  },
})

const imageRefs = ref<Record<string, any>>({})

function openPreview(id: string) {
  imageRefs.value[id]?.showPreview?.()
}

function validateAll() {
  if (!imageListRef.value.isAllReplaced) {
    message.error('请将所有图片替换后再提交')
    return false
  }
  if (!selectTemplateInfo.value.styleUrl && !(values.value.styleUrl.length || customText.value)) {
    message.warning('请选择/输入模板或自定义内容')
    return false
  }
  return true
}

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
    const formatData = data.list.map((item: any) => {
      const parsedImages = typeof item.images === 'string'
        ? JSON.parse(item.images)
        : item.images
      return {
        ...item,
        images: parsedImages,
      }
    })

    if (loadMore) {
      // 加载更多时追加数据
      originListData.value = [...originListData.value, ...(formatData ?? [])]
    }
    else {
      // 重新加载时替换数据
      originListData.value = formatData ?? []
    }

    // 更新总数和是否有更多数据
    total.value = data.total ?? 0
    hasMore.value = originListData.value.length < total.value
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

// 打开右侧动作图选择面板
async function openActionPanel() {
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
    // filterListData.value = originListData.value
  }
}

function closeActionPanel() {
  showActionPanel.value = false
}

function removeRefrenceImage() {
  selectTemplateInfo.value = {
    num: 0,
    styleUrl: '',
    id: '',
    background: '',
    images: [],
  }
}

function selectActionImageFromPanel(value: StyleDescription) {
  selectTemplateInfo.value = value
  closeActionPanel()
}

function uploadRefrenceImage() {
  if (selectTemplateInfo.value.styleUrl) {
    message.warning('请先删除选择的模板')
    return
  }
  imageGallerySelectorRef.value.openGalleryModal()
}

const curEditIndex = ref(0)
const imageGallerySelectorRef2 = ref()
function updateImage(index: number) {
  imageGallerySelectorRef2.value.openGalleryModal()
  curEditIndex.value = index
}

function handleConfirm(url: string | null) {
  const { urlList } = imageListRef.value
  urlList[curEditIndex.value] = url
  imageListRef.value.setUrlList(urlList)
  imageGallerySelectorRef2.value.resetAll()
}

const submitValues = ref<SubmitRequestParams>({
  // 原图
  url: null,
  // 拼接的提示词
  //  参考图列表
  // 比例
  size: '16:9',
  // 尺寸
  imageSize: '2K',
  sizex: '2048x1152',
})

async function preGenerateHandler() {
  closeActionPanel()
  if (selectTemplateInfo.value.styleUrl) {
    const urlList = imageListRef.value.urlList
    const size = await getImageRatio(selectTemplateInfo.value.styleUrl)
    submitValues.value = {
      url: `${urlList.join(',')},${selectTemplateInfo.value.background}`,
      size,
      imageSize: values.value.imageSize,
      sizex: getResolutionFromRatioLabel(size),
    }
  }
  else {
    submitValues.value = {
      url: values.value.styleUrl.join(','),
      size: values.value.size,
      imageSize: values.value.imageSize,
      sizex: getResolutionFromRatioLabel(values.value.size),
    }
  }
}

const context = computed<EchoData>(() => {
  return {
    selectTemplateInfo: selectTemplateInfo.value,
    fileList: imageListRef.value.fileList,
    urlList: imageListRef.value.urlList,
    styleUrl: values.value.styleUrl,
    customText: customText.value,
    size: values.value.size,
    imageSize: values.value.imageSize,
    styleId: selectTemplateInfo.value.id || '',
  }
})

const editData = ref<any>({
  urlList: [],
  fileList: [],
})

function handleEchoData(context: EchoData) {
  selectTemplateInfo.value = context.selectTemplateInfo
  editData.value.fileList = context.fileList
  editData.value.urlList = context.urlList
  customText.value = context.customText
  values.value = {
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
} = useGenerateTask<SubmitParams, TaskInfo>({
  context,
  validateAll,
  values: submitValues,
  api: Api,
  currentRouteData,
  preGenerateHandler,
  handleEchoData,
})

async function getFilterOptions() {
  const { data } = await DrawApi.getFilterOptions({
    id: currentRouteData.value.effectId,
  })
  filterOptions.value = data ?? []
}

async function findStyleById(id: number) {
  try {
    const res = await DrawApi.getStyleDetail({
      styleId: id,
    })
    console.log('res.data:', res.data)
    return res.data
  }
  catch (error) {
    console.error('获取风格详情失败:', error)
    return {
      num: 0,
      id: '',
      styleUrl: '',
      background: '',
      images: [],
    }
  }
}

// 筛选
function filter() {
  originListData.value = []
  query.value.pageNum = '1'
  getTemplateInfo()
}

onMounted(async () => {
  getTemplateInfo()
  getFilterOptions()
  if (route.query.id) {
    selectTemplateInfo.value = await findStyleById(Number(route.query.id))
  }
})
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
            选择模板
          </span>
          <div class="select-template">
            <div
              v-show="selectTemplateInfo.styleUrl.length"
              class="template-img relative cursor-pointer group"
            >
              <img
                :src="`${selectTemplateInfo.styleUrl}?imageMogr2/thumbnail/464x464`"
                class="size-full object-contain"
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
            </div>

            <div
              v-show="!selectTemplateInfo.styleUrl.length"
              class="add-btn"
              @click="openActionPanel"
            >
              <icon
                icon="mdi:plus"
                class="add-icon"
              />
            </div>
          </div>
          <div
            v-show="selectTemplateInfo.styleUrl.length"
            class="flex flex-col solvation-diagram"
          >
            <div class="headline">
              选择溶图内容
            </div>
            <dynamic-image-list
              ref="imageListRef"
              :default-url-list="editData.urlList"
              :default-file-list="editData.fileList"
              :style="selectTemplateInfo"
              @update-image="updateImage"
            />
            <div v-show="false">
              <image-gallery-selector
                ref="imageGallerySelectorRef2"
                :model-value="null"
                @confirm="handleConfirm"
              >
                <div />
              </image-gallery-selector>
            </div>
          </div>
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
            {{ $t('aiDraw.common.costPoints', { points: currentRouteData.point }) }}
          </div>
        </n-button>
      </div>
    </div>
    <div
      v-show="showActionPanel"
      class="h-full flex-1 flex flex-col template-base"
    >
      <!-- 面板头部 -->
      <div class="content-top">
        <div class="content-title">
          模板库
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
        class="flex-1 template-list-box"
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
                  class="relative cursor-pointer overflow-hidden group template-item"
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
      class="h-full w-[calc(100%-360px)] box-border p-y-103px p-x-24px relative"
    >
      <div class="size-full rounded-16px bg-#FFF relative overflow-hidden">
        <!-- 图片展示区域 -->
        <image-display
          :generate-status="generateStatus"
          :result-url="resultUrl"
        />
      </div>
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
  height: 150px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 37%, #f5f5f5 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
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
  .subhead {
    font-size: 0.75rem;
    font-weight: 500;
    color: #9ca3af;
  }
}
.select-template {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.125rem;
  .template-img {
    width: 100%;
    height: 10.7188rem;
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
      0px 1px 2px 0px rgba(0, 0, 0, 0.05),
      0px 0px 0px 0px rgba(0, 0, 0, 0),
      0px 0px 0px 0px rgba(0, 0, 0, 0);
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
  .add-btn:hover {
    border-color: #ffccb2;
    background-color: #ffffff;
    .add-icon {
      color: #ff5500;
    }
  }
}
.solvation-diagram {
  margin-top: 1.5rem;
}
.advanced-customization-box {
  margin: 2.0625rem 0;
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
.template-base {
  box-sizing: border-box;
  padding: 3rem;
  overflow: hidden;
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
  .template-list-box {
    flex: 1;
    overflow: hidden;
    margin-top: 2rem;
    .template-item {
      border-radius: 0.75rem;
    }
  }
}
</style>
