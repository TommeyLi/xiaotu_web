<script setup lang="ts">
import type { AxiosResponse } from 'axios'
import type { MessageReactive, UploadFileInfo } from 'naive-ui'
import type { UserImageLibraryParams, UserImageLibraryVo } from './index.api'
import type { UploadTask } from '@/composables/use-upload-image'
import { orange } from '@ant-design/colors'
import { Icon, loadIcon } from '@iconify/vue'
import { NIcon, useMessage } from 'naive-ui'
import { computed, h, onMounted, ref, watch } from 'vue'
import { useProRequest } from '@/composables/use-pro-request'
import { useUploadImage } from '@/composables/use-upload-image'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { Api } from './index.api'

export interface ImageItem {
  id: number
  name: string
  url: string
}

interface Props {
  modelValue: string | null
  confirmText?: string
  uploadText?: string
  aspectRatio?: number
}

interface Emits {
  (e: 'update:modelValue', url: string | null): void
  (e: 'confirm', url: string | null): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: $t('common.often.confirm') as string,
})

const emit = defineEmits<Emits>()

// 暴露方法给父组件
defineExpose({
  resetAll,
  openGalleryModal,
  getTaskStatusType,
  getTaskStatusText,
})

const { globalTasks, upload, pause, restart, cancel } = useUploadImage()
const showUploadRecordsModal = ref(false)
// 图片数据
const sortValue = ref(2)
const message = useMessage()
const imageList = ref<UserImageLibraryVo[]>([])
const recordsMode = ref<'uploadRecords' | 'generateRecords'>('uploadRecords')
const options = ref([
  {
    label: $t('gallery.sort.uploadTimeDesc'),
    value: 2,
  },
  {
    label: $t('gallery.sort.uploadTimeAsc'),
    value: 1,
  },
  {
    label: $t('gallery.sort.nameDesc'),
    value: 4,
  },
  {
    label: $t('gallery.sort.nameAsc'),
    value: 3,
  },
])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(24) // 每页24张图片（3行8列）
const totalPages = ref(0)
const imageName = ref('') // 搜索名称

// 内部状态
const uploading = ref(false)
const showGalleryModal = ref(false)
const failedList = ref<UploadTask[]>([])
const isHoveringSelectedImage = ref(false)
const selectedImageId = ref<number | null>(null)
let messageReactive: MessageReactive | null = null
const hoveredImageId = ref<number | null>(null) // 悬浮状态
const imageRefs: Record<number, any> = {} // 图片预览相关（非响应式，减少重渲染）
const uploadFileList = ref<UploadFileInfo[]>([]) // 上传组件的文件列表
let uploadTimer: ReturnType<typeof setTimeout> | null = null // 延迟上传的定时器

const {
  runAsync: runLibraryList,
  loading: loadingLibraryList,
} = useProRequest<AxiosResponse<UserImageLibraryVo, any>, UserImageLibraryParams[]>(Api.getLibraryList, {
  manual: true,
  debounceWait: 500,
})

// 计算属性：当前选中的图片
const currentSelectedImage = computed(() => {
  if (!props.modelValue)
    return null
  return imageList.value.find(img => img.imageUrl === props.modelValue) || null
})

// 任务状态辅助方法
function getTaskStatusType(state: string): 'default' | 'info' | 'success' | 'error' | 'warning' {
  const statusMap: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
    waiting: 'default',
    checking: 'info',
    uploading: 'info',
    success: 'success',
    error: 'error',
    paused: 'warning',
    canceled: 'default',
  }
  return statusMap[state] || 'default'
}

function getTaskStatusText(state: string) {
  const statusMap: Record<string, string> = {
    waiting: '等待中',
    checking: '检查中',
    uploading: '上传中',
    success: '已完成',
    error: '失败',
    paused: '已暂停',
    canceled: '已取消',
  }
  return statusMap[state] || ''
}

// 选择图片
function selectImage(imageId: number) {
  if (selectedImageId.value === imageId) {
    // 如果点击的是已选中的图片，则取消选中
    selectedImageId.value = null
  }
  else {
    // 否则选中该图片
    selectedImageId.value = imageId
  }
}

async function getLibraryList(type: number | null = null) {
  const sourceType = type || (recordsMode.value === 'uploadRecords' ? 1 : 2)
  const sortMode = [1, 2].includes(sortValue.value)
    ? {
        orderBy: 'createTime',
        orderDirection: sortValue.value === 1 ? 'asc' : 'desc',
      }
    : {
        orderBy: 'imageName',
        orderDirection: sortValue.value === 3 ? 'asc' : 'desc',
      }
  const data = await runLibraryList({
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    sourceType,
    imageName: imageName.value,
    ...sortMode,
  })
  imageList.value = data.data.records || []
  totalPages.value = Number(data.data.pages)
}

// 打开图库选择
async function openGalleryModal() {
  showGalleryModal.value = true
  await getLibraryList()
}

// 重置所有状态
function resetAll() {
  selectedImageId.value = null
  currentPage.value = 1
  sortValue.value = 2
  imageName.value = ''
  recordsMode.value = 'uploadRecords'
  showGalleryModal.value = false
}

// 确认选择
function handleConfirm() {
  const selectedImage = selectedImageId.value
    ? imageList.value.find(img => img.imageId === selectedImageId.value) || null
    : null
  const selectedUrl = selectedImage?.imageUrl || null

  // 触发 update:modelValue 事件
  emit('update:modelValue', selectedUrl)
  // 触发 confirm 事件，传递选中的 URL
  emit('confirm', selectedUrl)

  showGalleryModal.value = false
  isHoveringSelectedImage.value = false
}

// 删除选中的图片
function deleteSelectedImage() {
  selectedImageId.value = null
  emit('update:modelValue', null)
}

// 悬浮处理选中图片
function handleSelectedImageMouseEnter() {
  isHoveringSelectedImage.value = true
}

function handleSelectedImageMouseLeave() {
  isHoveringSelectedImage.value = false
}

// 悬浮处理
function handleMouseEnter(imageId: number) {
  hoveredImageId.value = imageId
}

function handleMouseLeave() {
  hoveredImageId.value = null
}

const curImgUrl = ref('')
// 预览图片
function previewImage(imageId: number) {
  const imageRef = imageRefs[imageId]
  curImgUrl.value = imageRef.previewSrc
  if (imageRef) {
    imageRef.click()
  }
}

async function beforeUpload() {
//   data: {
//   file: UploadFileInfo
//   fileList: UploadFileInfo[]
// }
  // if (data.file.file?.size && data.file.file.size > 10 * 1024 * 1024) {
  //   message.error($t('gallery.messages.sizeLimit'))
  //   return false
  // }
  return true
}

const successTaskLength = computed(() => {
  return (globalTasks.value ?? []).filter((item: any) => item.state === 'success').length
})

// 记录上传开始时的基线成功任务数量
const baselineSuccessCount = ref(0)
// 当前批次的上传文件数量
const currentUploadFilesCount = ref(0)

// 计算当前批次的新增成功任务数量
const currentBatchSuccessCount = computed(() => {
  return Math.max(0, successTaskLength.value - baselineSuccessCount.value)
})

// 监听任务变化，更新进度提示
watch([currentBatchSuccessCount, () => currentUploadFilesCount.value], ([successCount, totalCount]) => {
  if (messageReactive && totalCount > 0 && uploading.value) {
    messageReactive.content = `图片上传中 ${successCount}/${totalCount}，请勿关闭页面...`
  }
})

// 处理上传按钮点击，先检查状态
function handleUploadClick(e: MouseEvent) {
  // 如果正在上传中，阻止文件选择对话框打开并提示
  if (uploading.value) {
    e.preventDefault()
    e.stopPropagation()
    message.warning($t('gallery.messages.uploadingExists'))
    return false
  }
  // 如果不在上传中，不阻止默认行为（n-upload 会自动打开文件选择对话框）
  return true
}

async function handleFileChange({ fileList }: { fileList: any[] }) {
  if (uploading.value) {
    return
  }

  // 更新上传组件的文件列表（用于清空控制）
  uploadFileList.value = fileList

  // 清除之前的定时器
  if (uploadTimer) {
    clearTimeout(uploadTimer)
    uploadTimer = null
  }

  // 延迟上传，等待用户完成多选文件（延迟 300ms，确保所有文件选择完成）
  uploadTimer = setTimeout(async () => {
    if (uploading.value) {
      return
    }

    uploading.value = true
    const files = fileList.map(f => f.file as File).filter(Boolean)

    if (files.length === 0) {
      uploading.value = false
      return
    }

    // 记录当前批次开始时的基线
    baselineSuccessCount.value = successTaskLength.value
    currentUploadFilesCount.value = files.length

    if (!messageReactive) {
      messageReactive = message.warning(`图片上传中 ${currentBatchSuccessCount.value}/${files.length}，请勿关闭页面...`, {
        icon: () => h(
          NIcon,
          {
            size: 20,
            spin: true,
            color: orange[5], // Ant Design 标准橙
          },
          {
            default: () =>
              h(Icon, {
                icon: 'line-md:loading-twotone-loop',
              }),
          },
        ),
        duration: 0,
      })
    }
    const result = await upload(files)
    if (messageReactive) {
      messageReactive.destroy()
      messageReactive = null
    }
    // 重置状态，确保下次上传时状态干净
    currentUploadFilesCount.value = 0
    baselineSuccessCount.value = 0

    // 上传成功后清空文件列表
    uploadFileList.value = []

    if (result.failedList.length > 0) {
      // showUploadRecordsModal.value = true
      failedList.value = result.failedList
      message.error($t('gallery.messages.partialFailed'))
    }
    else {
      message.success('全部图片上传成功')
    }
    uploading.value = false
    uploadTimer = null
    getLibraryList()
  }, 300)
}

async function updateValue(val: 'uploadRecords' | 'generateRecords') {
  await getLibraryList(val === 'uploadRecords' ? 1 : 2)
}

onMounted(() => {
  loadIcon('line-md:loading-twotone-loop')
})
</script>

<template>
  <!-- 如果外部提供了插槽内容，则使用插槽内容 -->
  <slot v-if="$slots.default">
    <slot />
  </slot>
  <!-- 如果没有外部插槽内容，则使用默认内容 -->
  <div
    v-else
    class="w-full flex items-center justify-center cursor-pointer relative img-selector"
    :style="{ aspectRatio: aspectRatio || '353 / 176' }"
    @click="openGalleryModal"
  >
    <div
      v-if="props.modelValue"
      class="flex flex-col items-center justify-center relative size-full"
      @mouseenter="handleSelectedImageMouseEnter"
      @mouseleave="handleSelectedImageMouseLeave"
    >
      <img
        :src="props.modelValue"
        :alt="currentSelectedImage?.imageName || '选中图片'"
        class="max-w-full max-h-full object-contain rounded-8px"
      >
      <!-- 删除遮罩 -->
      <div
        v-if="isHoveringSelectedImage"
        class="absolute inset-0 bg-#000 bg-opacity-50 rounded-12px flex items-center justify-center"
      >
        <div
          class="w-40px h-40px flex items-center justify-center "
          @click.stop="deleteSelectedImage"
        >
          <img
            src="@/assets/icon/trash.svg"
            class="size-32px"
          >
        </div>
      </div>
    </div>
    <div
      v-else
      class="flex flex-col items-center"
    >
      <icon
        icon="mdi:plus"
        class="add-icon"
      />
      <span
        v-if="props.uploadText"
        class="text-16px c-#666 line-height-16px mt-4px"
      >{{ props.uploadText }}</span>
    </div>
  </div>
  <!-- 图库选择弹窗 -->
  <n-modal
    v-model:show="showGalleryModal"
    :bordered="false"
    :title="`${$t('gallery.selectImg')}`"
    preset="card"
    :auto-focus="false"
    class="w-990px h-657px bg-#FFF rounded-24px overflow-hidden"
    content-class="pb-0px!"
    @cancel="resetAll"
  >
    <div class="w-full h-[calc(657px-128px)] flex flex-col overflow-auto">
      <n-scrollbar content-class="h-full flex flex-col">
        <div class="flex items-center justify-between h-44px shrink-0 sticky top-0 bg-#FFF z-20 pb-12px outline outline-1 outline-white">
          <n-tabs
            v-model:value="recordsMode"
            type="segment"
            animated
            class="h-44px w-237px"
            :theme-overrides="{
              tabBorderRadius: '12px',
            }"
            @update-value="updateValue"
          >
            <n-tab-pane
              name="uploadRecords"
              :tab="$t('gallery.uploadRecords')"
            />
            <n-tab-pane
              name="generateRecords"
              :tab="$t('gallery.generateRecords')"
            />
          </n-tabs>
          <div class="flex gap-16px items-center">
            <n-input
              v-model:value="imageName"
              size="large"
              clearable
              :placeholder="$t('gallery.searchPlaceholder')"
              class="bg-#F7F7F7 rounded-12px w-280px! h-44px flex items-center justify-center search-input"
              :theme-overrides="{
                border: 'none',
                borderHover: '0px solid transparent',
                borderFocus: '1px solid #000',
                boxShadowFocus: '0 0 0 0px #eeeeee',
              }"
              @update:value="getLibraryList()"
            >
              <template #prefix>
                <img
                  src="@/assets/icon/search.svg"
                  class="size-20px"
                >
              </template>
            </n-input>
            <n-config-provider
              :theme-overrides="{
                common: {
                  heightLarge: '44px',
                },
              }"
            >
              <n-select
                v-model:value="sortValue"
                :options="options"
                size="large"
                class="rounded-12px w-158px!"
                @update:value="getLibraryList()"
              />
            </n-config-provider>
            <n-upload
              multiple
              :max="30"
              :default-upload="false"
              :show-file-list="false"
              :file-list="uploadFileList"
              accept=".jpg,.jpeg,.png,.webp"
              :on-change="handleFileChange"
              @before-upload="beforeUpload"
            >
              <n-button
                color="#000"
                class="h-44px rounded-10px!"
                size="large"
                :disabled="uploading"
                @click="handleUploadClick"
              >
                <template #icon>
                  <img
                    src="@/assets/icon/upload.svg"
                    class="size-20px"
                  >
                </template>
                {{ uploading ? $t('common.actions.uploading') : $t('common.actions.uploadLocal') }}
              </n-button>
            </n-upload>
          </div>
        </div>
        <!-- 图片列表&分页 -->
        <div class="flex-1 box-border relative">
          <div class="flex flex-col justify-between">
            <!-- 图片网格 -->
            <div
              v-loading="loadingLibraryList"
              class="relative min-h-400px"
            >
              <template v-if="imageList.length > 0 || loadingLibraryList">
                <n-image-group :render-toolbar="createImageToolbar(curImgUrl)">
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-15px">
                    <div
                      v-for="image in imageList"
                      :key="image.imageId"
                      class="relative w-104px h-132px bg-#fff rounded-8px cursor-pointer"
                      @mouseenter="handleMouseEnter(image.imageId)"
                      @mouseleave="handleMouseLeave"
                      @click="selectImage(image.imageId)"
                    >
                      <!-- 图片容器 -->
                      <div class="relative w-104px h-104px rounded-8px overflow-hidden">
                        <n-image
                          :ref="(el) => { imageRefs[image.imageId] = el }"
                          lazy
                          :src="`${image.imageUrl}?imageMogr2/thumbnail/204x204`"
                          :preview-src="`${image.imageUrl}${image.imageUrl.includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                          :alt="image.imageName"
                          class="size-full"
                          object-fit="cover"
                          :img-props="{
                            width: '100%',
                          }"
                        />

                        <!-- 选中状态的复选框 - 在图片容器内，层级最高 -->
                        <div class="absolute top-4px right-8px z-10">
                          <n-checkbox
                            :checked="selectedImageId === image.imageId"
                            @update:checked="() => selectImage(image.imageId)"
                            @click.stop
                          />
                        </div>

                        <!-- 悬浮遮罩 - 只覆盖图片部分 -->
                        <div
                          v-if="hoveredImageId === image.imageId"
                          class="absolute inset-0 bg-#000 bg-opacity-50 rounded-8px flex items-end justify-end pb-4px"
                        >
                          <div
                            class="w-32px h-32px flex items-center justify-center cursor-pointer"
                            @click.stop="previewImage(image.imageId)"
                          >
                            <img
                              src="@/assets/icon/zoom-in.svg"
                              class="size-20px"
                            >
                          </div>
                        </div>
                      </div>

                      <!-- 图片名称 -->
                      <div class="mt-8px text-12px text-#666 text-center truncate px-4px">
                        {{ image.imageName.split('.')[0] }}
                      </div>
                    </div>
                  </div>
                </n-image-group>
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
          <!-- 分页 + 底部按钮（固定） -->
          <div class="flex items-center justify-center w-full relative shrink-0 sticky bottom-0 bg-#FFF z-20 pt-8px outline outline-1 outline-white">
            <n-pagination
              v-model:page="currentPage"
              :page-count="totalPages"
              :page-size="pageSize"
              show-quick-jumper
              @update-page="getLibraryList()"
            >
              <template #goto>
                <span class="text-14px text-#666">{{ $t('common.often.goTo') }}</span>
              </template>
              <template #suffix>
                <span class="text-14px text-#666">{{ $t('common.often.page') }}</span>
              </template>
            </n-pagination>
          </div>
        </div>
      </n-scrollbar>
    </div>
    <template #footer>
      <div class="flex items-center justify-end w-full">
        <div class="flex justify-end gap-x-8px">
          <n-button
            type="tertiary"
            @click="resetAll"
          >
            {{ $t('common.often.cancel') }}
          </n-button>
          <n-button
            color="#000"
            :disabled="!selectedImageId"
            @click="handleConfirm"
          >
            {{ props.confirmText }}
          </n-button>
        </div>
      </div>
    </template>
  </n-modal>

  <!-- 上传记录弹窗 -->
  <n-modal
    v-model:show="showUploadRecordsModal"
    :title="$t('gallery.uploadRecords')"
    :bordered="false"
    preset="card"
    :auto-focus="false"
    class="w-741px h-707px bg-#FFF rounded-24px"
  >
    <div class="upload-queue-container">
      <!-- 任务列表 -->
      <div class="upload-queue-content">
        <n-scrollbar class="upload-queue-scrollbar">
          <div
            v-if="failedList.length === 0"
            class="empty-state"
          >
            <n-empty :description="$t('common.often.emptyUploadTask')" />
          </div>
          <div
            v-else
            class="task-list"
          >
            <div
              v-for="task in failedList"
              :key="task.id"
              class="task-item"
            >
              <!-- 任务信息 -->
              <div class="task-info">
                <div class="task-header">
                  <div class="task-filename">
                    <n-icon
                      size="16"
                      class="file-icon"
                    >
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                        />
                      </svg>
                    </n-icon>
                    <span class="filename-text">{{ task.Key.split('/').pop() }}</span>
                  </div>
                  <n-tag
                    :type="getTaskStatusType(task.state) as any"
                    size="small"
                    round
                  >
                    {{ getTaskStatusText(task.state) }}
                  </n-tag>
                </div>

                <!-- 进度条 -->
                <div class="task-progress">
                  <n-progress
                    type="line"
                    :percentage="task.percent * 100"
                    :show-indicator="false"
                    :height="6"
                    :border-radius="3"
                    :fill-border-radius="3"
                    class="progress-bar"
                  />
                  <span class="progress-text">{{ task.percent * 100 }}%</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="task-actions">
                <n-button
                  v-if="['waiting', 'checking', 'uploading'].includes(task.state)"
                  size="small"
                  type="warning"
                  ghost
                  @click="pause(task)"
                >
                  <template #icon>
                    <n-icon>
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M14,19H18V5H14M6,19H10V5H6V19Z"
                        />
                      </svg>
                    </n-icon>
                  </template>
                  {{ $t('common.often.pause') }}
                </n-button>
                <n-button
                  v-if="['error', 'paused'].includes(task.state)"
                  size="small"
                  type="success"
                  ghost
                  @click="restart(task)"
                >
                  <template #icon>
                    <n-icon>
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M8,5.14V19.14L19,12.14L8,5.14Z"
                        />
                      </svg>
                    </n-icon>
                  </template>
                  {{ $t('common.often.continue') }}
                </n-button>
                <n-button
                  v-if="task.state !== 'canceled'"
                  size="small"
                  type="error"
                  ghost
                  @click="cancel(task)"
                >
                  <template #icon>
                    <n-icon>
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                        />
                      </svg>
                    </n-icon>
                  </template>
                  {{ $t('common.often.cancel') }}
                </n-button>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </div>
  </n-modal>
</template>

<style scoped lang="scss">
:deep(.search-input .n-input-wrapper) {
  width: 280px !important;
}

:deep(.n-upload-trigger) {
  width: 100%;
  height: 100%;
}

/* 上传队列模态框样式 */
.upload-queue-modal {
  width: 720px !important;
  max-height: 80vh !important;
}

.upload-queue-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  max-height: 580px;
}

.upload-queue-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.upload-queue-scrollbar {
  height: 100%;
  max-height: 500px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.task-list {
  padding: 16px 0px 24px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.task-item:hover {
  border-color: #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.task-item:last-child {
  margin-bottom: 0;
}

.task-info {
  width: 70%;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-filename {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  color: #1890ff;
  flex-shrink: 0;
}

.filename-text {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  min-width: 200px;
}

.progress-text {
  font-size: 12px;
  color: #8c8c8c;
  min-width: 40px;
  text-align: right;
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 16px;
}

/* 响应式设计 */
/* @media (max-width: 768px) {
  .upload-queue-modal {
    width: 90vw !important;
    max-width: 500px !important;
  }

  .task-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .task-actions {
    margin-left: 0;
    justify-content: flex-end;
  }

  .task-progress {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .progress-bar {
    min-width: auto;
  }
} */
.img-selector {
  border-radius: 1rem;
  background: #f9fafb;
  box-sizing: border-box;
  border: 0.125rem dashed #f3f4f6;
  box-shadow:
    0px 1px 2px 0px rgba(0, 0, 0, 0.05),
    0px 0px 0px 0px rgba(0, 0, 0, 0),
    0px 0px 0px 0px rgba(0, 0, 0, 0);
  .add-icon {
    width: 1.75rem;
    height: 1.75rem;
    color: #9ca3af;
  }
}
.img-selector:hover {
  border-color: #ffccb2;
  background-color: #ffffff;
  .add-icon {
    color: #ff5500;
  }
}
</style>
