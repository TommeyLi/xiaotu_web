<script setup lang="ts">
import type { AxiosResponse } from 'axios'
import type { MessageReactive, UploadFileInfo } from 'naive-ui'
import type { UserImageLibraryParams, UserImageLibraryVo } from '@/components/image-gallery-selector/index.api'
import type { UploadTask } from '@/composables/use-upload-image'
import { useDialog, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import EditableInput from '@/components/editable-input/index.vue'
import { Api } from '@/components/image-gallery-selector/index.api'
import ImageLibrarySkeleton from '@/components/skeleton/image-library-skeleton.vue'
import { useProRequest } from '@/composables/use-pro-request'
import { useUploadImage } from '@/composables/use-upload-image'
import { $t } from '@/locales/locales'
import {
  downloadJpgTypeImage,
} from '@/utils/file'

// 图片数据
const sortValue = ref(1)
const dialog = useDialog()
const message = useMessage()
const imageList = ref<UserImageLibraryVo[]>([])
const recordsMode = ref<'uploadRecords' | 'generateRecords'>('uploadRecords')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(24) // 每页24张图片（3行8列）
const totalPages = ref(0)
const imageName = ref('') // 搜索名称

// 批量操作相关
const selectedImageIds = ref<number[]>([])
const isAllSelected = computed(() => {
  return imageList.value.length > 0 && selectedImageIds.value.length === imageList.value.length
})

// 内部状态
const uploading = ref(false)
const failedList = ref<UploadTask[]>([])
const hoveredImageId = ref<number | null>(null) // 悬浮状态
const imageRefs: Record<number, any> = {} // 图片预览相关
const uploadFileList = ref<UploadFileInfo[]>([]) // 上传组件的文件列表
let uploadTimer: ReturnType<typeof setTimeout> | null = null // 延迟上传的定时器

const {
  runAsync: runLibraryList,
  loading: loadingLibraryList,
} = useProRequest<AxiosResponse<UserImageLibraryVo, any>, UserImageLibraryParams[]>(Api.getLibraryList, {
  manual: true,
})

// const {
//   runAsync: runDownload,
//   data,
// } = useProRequest(, {
//   manual: true,
// })

const { globalTasks, upload } = useUploadImage()

// async function downloadImage(url: string, filename: string) {
//   // runDownload({ imageUrl: url })
//   const response = await Api.download({ imageUrl: url })

//     // 从响应头提取文件名（优先使用Content-Disposition）
//     const contentDisposition = response.headers['content-disposition'] ||
//                                response.headers['Content-Disposition'];
//     // if (contentDisposition) {
//     //   const match = contentDisposition.match(/filename="?(.+)"?/);
//     //   if (match && match‌:ml-citation{ref="1" data="citationList"}) {
//     //     filename = decodeURIComponent(match‌:ml-citation{ref="1" data="citationList"}); // 解码文件名
//     //   }
//     // }

//     // 创建下载链接并触发下载
//     const blob = new Blob([response.data], { type: response.data.type });
//     const urlObject = window.URL || window.webkitURL;
//     const downloadUrl = urlObject.createObjectURL(blob);
//     const aLink = document.createElement('a');
//     aLink.href = downloadUrl;
//     aLink.download = filename; // 设置下载文件名
//     aLink.click();
//     urlObject.revokeObjectURL(downloadUrl);
// }
// 全选/取消全选处理函数
function handleSelectAll(checked: boolean) {
  if (checked) {
    // 全选
    selectedImageIds.value = imageList.value.map(item => item.imageId)
  }
  else {
    // 取消全选
    selectedImageIds.value = []
  }
}

// 监听选中项变化，更新全选状态
watch(selectedImageIds, () => {
  // 只有当选中项数量等于总数量时才显示为全选状态
  // 如果用户取消其中任何一个，全选按钮就会变为未选中状态
}, { deep: true })

// 选择图片
function selectImage(imageId: number) {
  const index = selectedImageIds.value.findIndex(id => id === imageId)
  if (index > -1) {
    selectedImageIds.value.splice(index, 1)
  }
  else {
    selectedImageIds.value.push(imageId)
  }
}

async function getLibraryList(type: number | null = null) {
  const sourceType = type || (recordsMode.value === 'uploadRecords' ? 1 : 2)
  const sortMode = sortValue.value === 1
    ? {
        orderBy: 'createTime',
        orderDirection: 'desc',
      }
    : {
        orderBy: 'imageName',
        orderDirection: 'desc',
      }
  const data = await runLibraryList({
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    sourceType,
    imageName: imageName.value,
    ...sortMode,
  })
  imageList.value = data.data.records || []
  totalPages.value = data.data.pages
  // 清空选中项
  selectedImageIds.value = []
}

// 悬浮处理
function handleMouseEnter(imageId: number) {
  hoveredImageId.value = imageId
}

function handleMouseLeave() {
  hoveredImageId.value = null
}

// 处理图片名称变化
async function handleImageNameChange(imageId: number, newName: string) {
  console.log('图片ID:', imageId, '新名称:', newName)
  try {
    const result = await Api.updateLibraryName({ imageId, newName })
    message.success(result.data.msg || ($t('imageLibrary.messages.updateNameSuccess', { name: newName }) as string))
    const image = imageList.value.find(img => img.imageId === imageId)
    if (image) {
      image.imageName = newName
    }
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('imageLibrary.messages.updateNameFail') as string))
  }
}

// 删除单个图片
function deleteImage(imageId: number) {
  dialog.warning({
    title: $t('imageLibrary.dialogs.deleteTitle'),
    content: $t('imageLibrary.dialogs.deleteContent'),
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      try {
        await Api.deleteImage(imageId)
        message.success($t('imageLibrary.messages.deleteSuccess'))
        await getLibraryList()
      }
      catch {
        message.error($t('imageLibrary.messages.deleteFail'))
      }
    },
  })
}

// 批量删除
function batchDelete() {
  if (selectedImageIds.value.length === 0) {
    message.warning($t('imageLibrary.messages.selectToDelete'))
    return
  }

  dialog.warning({
    title: $t('imageLibrary.dialogs.batchDeleteTitle'),
    content: $t('imageLibrary.dialogs.batchDeleteContent', { count: selectedImageIds.value.length }) as string,
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      try {
        await Api.batchDeleteImages(selectedImageIds.value)
        message.success($t('imageLibrary.messages.batchDeleteSuccess'))
        selectedImageIds.value = []
        await getLibraryList()
      }
      catch {
        message.error($t('imageLibrary.messages.batchDeleteFail'))
      }
    },
  })
}

async function beforeUpload() {
//   data: {
//   file: UploadFileInfo
//   fileList: UploadFileInfo[]
// }
  // if (data.file.file?.size && data.file.file.size > 50 * 1024 * 1024) {
  //   message.error($t('imageLibrary.messages.sizeLimit'))
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
let messageReactive: MessageReactive | null = null
watch([currentBatchSuccessCount, () => currentUploadFilesCount.value], ([successCount, totalCount]) => {
  if (messageReactive && totalCount > 0 && uploading.value) {
    messageReactive.content = `${$t('common.often.status')} ${successCount}/${totalCount}`
  }
})

// 点击上传时拦截，避免并发上传
function handleUploadClick(e: MouseEvent) {
  if (uploading.value) {
    e.preventDefault()
    e.stopPropagation()
    message.warning($t('imageLibrary.messages.uploadingExists'))
    return false
  }
  return true
}

async function handleFileChange({ fileList }: { fileList: any[] }) {
  if (uploading.value) {
    return
  }

  // 绑定上传组件的文件列表（用于后续清空）
  uploadFileList.value = fileList

  // 清除之前的定时器
  if (uploadTimer) {
    clearTimeout(uploadTimer)
    uploadTimer = null
  }

  // 延迟上传，等待用户完成多选
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

    // 基线与当前批次数量
    baselineSuccessCount.value = successTaskLength.value
    currentUploadFilesCount.value = files.length

    if (!messageReactive) {
      messageReactive = message.info(`当前上传实时进度${currentBatchSuccessCount.value}/${files.length}`, {
        duration: 0,
      })
    }

    const result = await upload(files)

    if (messageReactive) {
      messageReactive.destroy()
      messageReactive = null
    }

    // 重置批次状态
    currentUploadFilesCount.value = 0
    baselineSuccessCount.value = 0

    // 上传成功后清空文件列表
    uploadFileList.value = []

    if (result.failedList.length > 0) {
      failedList.value = result.failedList
      message.error($t('imageLibrary.messages.partialFailed'))
    }
    else {
      message.success($t('imageLibrary.messages.uploadSuccess'))
    }
    uploading.value = false
    uploadTimer = null

    // 刷新列表,因为上传成功后后端有延迟，所以这里加一个延迟刷新
    setTimeout(() => {
      getLibraryList()
    }, 500)
  }, 300)
}

async function updateValue(val: 'uploadRecords' | 'generateRecords') {
  recordsMode.value = val
  await getLibraryList(val === 'uploadRecords' ? 1 : 2)
}

// 初始化
getLibraryList()
</script>

<template>
  <div class="size-full p-32px pr-12px box-border flex flex-col gap-24px bg-#fff">
    <div class="flex items-center justify-between h-44px">
      <n-tabs
        v-model:value="recordsMode"
        type="segment"
        animated
        class="h-full w-237px"
        :theme-overrides="{
          tabBorderRadius: '12px',
        }"
        @update-value="updateValue"
      >
        <n-tab-pane
          name="uploadRecords"
          :tab="$t('imageLibrary.tabs.uploadRecords')"
        />
        <n-tab-pane
          name="generateRecords"
          :tab="$t('imageLibrary.tabs.generateRecords')"
        />
      </n-tabs>
      <div class="flex items-center gap-24px justify-end">
        <n-checkbox
          :checked="isAllSelected"
          @update:checked="handleSelectAll"
        >
          {{ $t('imageLibrary.actions.selectAll') }}
        </n-checkbox>

        <n-button
          :disabled="selectedImageIds.length === 0"
          @click="batchDelete"
        >
          {{ $t('imageLibrary.actions.batchDelete') }}
        </n-button>
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
            :disabled="uploading"
            @click="handleUploadClick"
          >
            <template #icon>
              <img
                src="@/assets/icon/upload.svg"
                class="size-20px"
              >
            </template>
            {{ $t('imageLibrary.actions.localUpload') }}
          </n-button>
        </n-upload>
      </div>
    </div>
    <!-- 图片列表区域 -->
    <div class="flex-1 overflow-y-auto">
      <n-scrollbar
        :x-scrollable="false"
        class="size-full"
        content-class="h-full"
      >
        <div class="relative">
          <!-- 骨架屏 -->
          <image-library-skeleton
            v-if="loadingLibraryList"
            class="pr-20px"
          />

          <!-- 实际内容 -->
          <n-image-group v-else>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(264px,1fr))] gap-15px pr-20px">
              <template v-if="imageList.length">
                <div
                  v-for="image in imageList"
                  :key="image.imageId"
                  class="relative bg-#fff rounded-8px cursor-pointer "
                >
                  <!-- 图片容器 -->
                  <div
                    class="relative w-full aspect-square rounded-16px size-264px overflow-hidden bg-#f5f5f5"
                    @click="selectImage(image.imageId)"
                    @mouseenter="handleMouseEnter(image.imageId)"
                    @mouseleave="handleMouseLeave"
                  >
                    <n-image
                      :ref="(el) => { imageRefs[image.imageId] = el }"
                      lazy
                      :src="`${image.imageUrl}?imageMogr2/thumbnail/264x264`"
                      :preview-src="`${image.imageUrl}${image.imageUrl.includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                      :alt="image.imageName"
                      class="size-full"
                      object-fit="scale-down"
                    />

                    <!-- 选中状态的复选框 -->
                    <div class="absolute top-4px right-8px z-10">
                      <n-checkbox
                        :checked="selectedImageIds.includes(image.imageId)"
                        @update:checked="() => selectImage(image.imageId)"
                        @click.stop
                      />
                    </div>

                    <!-- 悬浮遮罩 - 显示下载和删除按钮 -->
                    <div
                      v-if="hoveredImageId === image.imageId"
                      class="absolute bottom-0 left-0 right-0 h-40% bg-gradient-to-t from-black/40 via-black/10 to-transparent flex items-end justify-center gap-18px rounded-b-8px"
                    >
                      <div
                        class="w-90px h-36px flex items-center justify-center cursor-pointer bg-#000 cursor-pointer rounded-10px mb-14px"
                        @click.stop="downloadJpgTypeImage(image.imageUrl, image.imageName)"
                      >
                        <img
                          src="@/assets/icon/download.svg"
                          class="size-18px"
                        >
                        <span class="text-#FFF">{{ $t('imageLibrary.actions.download') }}</span>
                      </div>
                      <div
                        class="w-90px h-36px flex items-center justify-center cursor-pointer bg-white cursor-pointer rounded-10px mb-14px"
                        @click.stop="deleteImage(image.imageId)"
                      >
                        <img
                          src="@/assets/icon/black-trash.svg"
                          class="size-18px"
                        >
                        <span class="text-#000">{{ $t('common.often.delete') }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 图片名称 -->
                  <div class="mt-8px px-4px">
                    <editable-input
                      :model-value="image.imageName.split('.')[0]"
                      :placeholder="$t('imageLibrary.placeholders.unnamed')"
                      @change="(newName) => handleImageNameChange(image.imageId, newName)"
                    />
                  </div>
                </div>
              </template>
            </div>
          </n-image-group>
        </div>
        <template v-if="!loadingLibraryList && imageList?.length === 0">
          <div class="w-full min-h-200px h-full flex items-center justify-center">
            <img
              src="@/assets/images/data-null.png"
              class="w-240px"
            >
          </div>
        </template>
      </n-scrollbar>
    </div>
    <!-- 分页组件 -->
    <div class="flex items-center justify-center mt-22px">
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
</template>

<style scoped lang="scss">
:deep(.n-checkbox__label) {
  width: 30px;
}

/* 响应式网格布局 */
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
    gap: 12px !important;
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important;
    gap: 10px !important;
  }

  .text-12px {
    font-size: 11px !important;
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)) !important;
    gap: 8px !important;
  }

  .text-12px {
    font-size: 10px !important;
  }
}

/* 确保图片在容器中正确显示 */
:deep(.n-image) {
  width: 100%;
  height: 100%;
}

:deep(.n-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
