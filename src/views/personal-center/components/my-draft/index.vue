<script setup lang="ts">
import type { TaskInfo } from '@/store/use-user-store'
import type { DraftItem } from '@/views/home/components/drafts/index.api'
import { useDialog, useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EditableInput from '@/components/editable-input/index.vue'
import { TaskStatusEnum } from '@/components/image-display'
import DraftSkeleton from '@/components/skeleton/draft-skeleton.vue'
import { useProRequest } from '@/composables/use-pro-request'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { encodeDataToHash } from '@/utils/common'
import { findRouteNameByEffectId, findRouteNameByWorkflowId } from '@/utils/findRouteNameByEffectId'
import { Api } from '@/views/home/components/drafts/index.api'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const isCheckedAll = ref(false)
const selectedImageId = ref<string[]>([])
const selectedTaskImageId = ref<(string | number)[]>([])
const activeTabKey = ref<string>('1')
const taskList = ref<TaskInfo[]>([])
const currentPage = ref(1)
const totalPages = ref(0)
const taskListLoading = ref(false)
const pageSize = ref(16)
const templateInfo = ref<Array<{ categoryId: string, categoryName: string }>>([
  {
    categoryId: '1',
    categoryName: $t('myDraft.tabs.all') as string,
  },
  {
    categoryId: '2',
    categoryName: $t('myDraft.tabs.design') as string,
  },
  {
    categoryId: '3',
    categoryName: $t('myDraft.tabs.creative') as string,
  },
])
const {
  routes,
} = storeToRefs(useUserStore())

const {
  data: draftList,
  loading: draftListLoading,
  run: runDraftListRequest,
} = useProRequest(async () => {
  const result = await Api.getDraftList()
  return result.data ?? []
}, {
  manual: true,
})

// 计算属性：是否全选
const isAllSelected = computed(() => {
  if (!draftList.value) {
    return false
  }
  return draftList.value.length > 0 && selectedImageId.value.length === draftList.value.length
})

// 全选/取消全选处理函数
function handleSelectAll(checked: boolean) {
  if (activeTabKey.value === '3') {
    selectedImageId.value = checked ? draftList.value.map(item => item.draftId) : []
  }
}

// 监听选中项变化，更新全选状态
watch(selectedImageId, () => {
  // 只有当选中项数量等于总数量时才显示为全选状态
  // 如果用户取消其中任何一个，全选按钮就会变为未选中状态
  isCheckedAll.value = isAllSelected.value
}, { deep: true })

async function runTaskList() {
  try {
    taskListLoading.value = true
    const taskType = activeTabKey.value === '1' ? {} : { taskType: 1 }
    const params = {
      status: -1,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...taskType,
    }
    const result = await Api.getTaskList(params)
    taskList.value = result.data.list.map((item) => {
      const request = JSON.parse(item.request || '{}')
      return {
        ...item,
        request,
      }
    }) || []
    totalPages.value = Number(result.data.totalPages)
    console.log(result.data, 'result')
  }
  catch (err: any) {
    console.log(err, 'err')
  }
  finally {
    taskListLoading.value = false
  }
}
runTaskList()

function openDetailPage(draft: DraftItem) {
  if (draft.isEditable === 0) {
    message.warning($t('myDraft.messages.cannotEdit'))
    return
  }
  const encodedData = encodeDataToHash({
    goodsId: draft.goodId,
    draftId: draft.draftId,
    templateId: draft.templateId,
    taskId: draft.taskId,
  })
  router.push({
    name: 'CustomBuy',
    hash: `#data=${encodedData}`,
  })
}

const TaskTypeEnum = {
  AI_DRAW: 1, // ai绘图任务
  CUSTOM_GOODS: 2, // 定制商品任务
}

async function openTaskDetailPage(item: TaskInfo) {
  try {
    const requestData = typeof item.request === 'string' ? JSON.parse(item.request) : item.request
    if (item.taskType === TaskTypeEnum.AI_DRAW) {
      const effectId = requestData.effectId
      const targetName = effectId
        ? findRouteNameByEffectId(routes.value, effectId)
        : findRouteNameByWorkflowId(routes.value, requestData.workflowId)

      if (!targetName) {
        message.error($t('common.layout.progressMessage.pageNotFound'))
        return
      }

      const url = router.resolve({
        name: targetName,
        query: { taskId: item.taskId.toString() },
      })
      window.open(url.href, '_self')
    }

    if (item.taskType === TaskTypeEnum.CUSTOM_GOODS) {
      const encodedData = encodeDataToHash({
        draftId: item.bizId,
        goodsId: requestData.maojiGoodsId as string,
        taskId: item.taskId,
      })
      const url = router.resolve({
        name: 'CustomBuy',
        hash: `#data=${encodedData}`,
      })
      window.open(url.href, '_self')
    }
  }
  catch (error) {
    console.error('处理任务点击失败:', error)
    message.error($t('common.layout.progressMessage.taskProcessFail'))
  }
}

function selectImage(imageId: string) {
  const index = selectedImageId.value.findIndex(t => t === imageId)
  if (~index) {
    selectedImageId.value.splice(index, 1)
  }
  else {
    selectedImageId.value.push(imageId)
  }
}

function selectTaskImage(taskId: string | number) {
  const index = selectedTaskImageId.value.findIndex(t => t === taskId)
  if (~index) {
    selectedTaskImageId.value.splice(index, 1)
  }
  else {
    selectedTaskImageId.value.push(taskId)
  }
}

// 单个删除
function deleteSingleItem(draft: DraftItem) {
  dialog.warning({
    title: $t('myDraft.dialogs.deleteTitle'),
    content: $t('myDraft.dialogs.deleteContent', { name: draft.draftName }) as string,
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      try {
        await Api.deleteDraft({ draftId: draft.draftId })
        const index = draftList.value.findIndex(item => item.draftId === draft.draftId)
        if (index > -1) {
          draftList.value.splice(index, 1)
          const selectedIndex = selectedImageId.value.findIndex(id => id === draft.draftId)
          if (selectedIndex > -1) {
            selectedImageId.value.splice(selectedIndex, 1)
          }
          message.success($t('myDraft.messages.deleteSuccess'))
        }
      }
      catch (error: any) {
        message.error(error.response.data.msg || ($t('myDraft.messages.deleteFail') as string))
      }
    },
  })
}

function deleteTaskSingleItem(task: TaskInfo) {
  if (task.status === TaskStatusEnum.PENGDING || task.status === TaskStatusEnum.WAIT)
    message.warning('正在进行中/待处理的任务，不可进行删除操作，请生成完成后再试！')
  // TODO: 删除任务操作
  dialog.warning({
    title: $t('myDraft.dialogs.deleteTitle'),
    content: $t('myDraft.dialogs.deleteContent', { name: task.taskName }) as string,
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      try {
        const result = await Api.batchDeleteTaskDraft({ taskIds: [task.taskId] })
        console.log(result, 'result')
        message.success($t('myDraft.messages.deleteSuccess'))
        selectedTaskImageId.value = []
        runTaskList()
      }
      catch (error: any) {
        message.error(error.response.data.msg || ($t('myDraft.messages.deleteFail') as string))
      }
    },
  })
}

const isBatchDelete = ref(false)
// 批量删除
function batchDelete() {
  if (isBatchDelete.value === false) {
    isBatchDelete.value = true
    return
  }
  if (activeTabKey.value === '3') {
    if (selectedImageId.value.length === 0) {
      message.warning($t('myDraft.messages.selectToDelete'))
      return
    }
    dialog.warning({
      title: $t('myDraft.dialogs.batchDeleteTitle'),
      content: $t('myDraft.dialogs.batchDeleteContent', { count: selectedImageId.value.length }) as string,
      positiveText: $t('common.often.confirm'),
      negativeText: $t('common.often.cancel'),
      positiveButtonProps: { color: '#000' },
      negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
      onPositiveClick: async () => {
        try {
          const result = await Api.batchDeleteDraft({ draftIds: selectedImageId.value })
          console.log(result, 'result')
          draftList.value = draftList.value.filter(item => !selectedImageId.value.includes(item.draftId))
          message.success($t('myDraft.messages.batchDeleteSuccess', { count: selectedImageId.value.length }) as string)
          selectedImageId.value = []
          isBatchDelete.value = false
        }
        catch (error: any) {
          message.error(error.response.data.msg || ($t('myDraft.messages.deleteFail') as string))
        }
      },
    })
  }
  else {
    if (selectedTaskImageId.value.length === 0) {
      message.warning($t('myDraft.messages.selectToDelete'))
      return
    }
    dialog.warning({
      title: $t('myDraft.dialogs.batchDeleteTitle'),
      content: $t('myDraft.dialogs.batchDeleteContent', { count: selectedTaskImageId.value.length }) as string,
      positiveText: $t('common.often.confirm'),
      negativeText: $t('common.often.cancel'),
      positiveButtonProps: { color: '#000' },
      negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
      onPositiveClick: async () => {
        try {
          const result = await Api.batchDeleteTaskDraft({ taskIds: selectedTaskImageId.value })
          console.log(result, 'result')
          message.success($t('myDraft.messages.deleteSuccess'))
          selectedTaskImageId.value = []
          runTaskList()
          isBatchDelete.value = false
        }
        catch (error: any) {
          message.error(error.response.data.msg || ($t('myDraft.messages.deleteFail') as string))
        }
      },
    })
  }
}

// 处理图片名称变化
async function handleImageNameChange(draftId: string, draftName: string) {
  try {
    const result = await Api.updateDraftName({ draftId, draftName })
    const draft = draftList.value.find(draft => draft.draftId === draftId)
    if (draft) {
      draft.draftName = draftName
    }
    message.success(result.rawData.msg ?? ($t('myDraft.messages.updateNameSuccess', { name: draftName }) as string))
  }
  catch (error: any) {
    message.error(error.response.data.msg ?? ($t('myDraft.messages.updateNameFail') as string))
  }
}

async function handleTabChange(categoryId: string) {
  totalPages.value = 0
  currentPage.value = 1
  activeTabKey.value = categoryId
  selectedImageId.value = []
  selectedTaskImageId.value = []
  if (categoryId === '3') {
    runDraftListRequest()
  }
  else {
    runTaskList()
  }
}
</script>

<template>
  <div class="w-full h-[calc(var(--design-vh)-78px-16px)] bg-#FFF rounded-16px p-24px box-border flex flex-col min-[1750px]:px-20 max-w-1760px m-[0_auto]">
    <!-- 固定头部 -->
    <div class="w-full flex justify-between sticky top-0 left-0 bg-#FFF z-10 pb-6px outline outline-1 outline-white">
      <n-config-provider
        class="sticky top-0 left-0 z-10 bg-white outline outline-1 outline-white"
        :theme-overrides="{
          Tabs: {
            tabGapLargeLine: '24px',
            barColor: 'transparent',
            tabFontWeightActive: 600,
            tabTextColorLine: '#999999',
            tabBorderColor: 'transparent',
            tabTextColorHoverLine: '#000000',
            tabTextColorActiveLine: '#000000',
          },
        }"
      >
        <n-tabs
          v-model:value="activeTabKey"
          type="line"
          size="large"
          @update:value="handleTabChange"
        >
          <n-tab
            v-for="n in templateInfo"
            :key="n.categoryId"
            :name="n.categoryId"
          >
            {{ n.categoryName }}
          </n-tab>
        </n-tabs>
      </n-config-provider>
      <div class="flex gap-16px items-center justify-center">
        <n-checkbox
          :checked="isCheckedAll"
          :disabled="['1', '2'].includes(activeTabKey)"
          @update:checked="handleSelectAll"
        >
          {{ $t('myDraft.actions.selectAll') }}
        </n-checkbox>
        <n-button @click="batchDelete">
          {{ $t('myDraft.actions.batchDelete') }}
        </n-button>
      </div>
    </div>

    <!-- 滚动内容区域 -->
    <n-scrollbar
      :x-scrollable="false"
      class="flex-1"
      content-class="h-full"
    >
      <template v-if="activeTabKey !== '3'">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-15px pr-20px">
          <!-- 骨架屏 -->
          <draft-skeleton
            v-if="draftListLoading"
            class="pr-20px"
          />

          <!-- 实际内容 -->
          <template v-else-if="taskList?.length > 0">
            <div
              v-for="task in taskList"
              :key="task.taskId"
              class="flex flex-col cursor-pointer transition-all duration-200"
            >
              <!-- 商品图片区域 -->
              <div class="relative w-full aspect-square rounded-16px overflow-hidden group/image">
                <img
                  :src="`${task.coverImageUrl}?imageMogr2/thumbnail/604x604`"
                  :alt="task.taskName"
                  class="w-full h-full object-cover rounded-16px"
                >
                <!-- 遮罩层和按钮 - 只在悬停图片时显示 -->
                <div class="absolute bottom-0 left-0 right-0 h-82px bg-gradient-to-t from-black/40 via-black/10 to-transparent flex gap-16px items-end justify-center opacity-0 transition-opacity duration-200 rounded-b-16px group-hover/image:opacity-100">
                  <button
                    class="bg-#000 text-white border-none w-90px  h-36px rounded-8px mb-14px cursor-pointer flex items-center justify-center"
                    @click="openTaskDetailPage(task)"
                  >
                    <img
                      src="@/assets/icon/mouse.svg"
                      :alt="$t('myDraft.actions.edit')"
                      class="size-18px mr-4px"
                    >
                    {{ $t('myDraft.actions.edit') }}
                  </button>
                  <button
                    class="bg-#FFF border-none w-90px h-36px rounded-8px mb-14px cursor-pointer flex items-center justify-center"
                    @click="deleteTaskSingleItem(task)"
                  >
                    <img
                      src="@/assets/icon/black-trash.svg"
                      :alt="$t('common.often.delete')"
                      class="size-18px mr-4px"
                    >
                    {{ $t('common.often.delete') }}
                  </button>
                </div>
                <div class="absolute top-16px right-16px z-10">
                  <n-checkbox
                    v-show="isBatchDelete"
                    :checked="selectedTaskImageId.includes(task.taskId)"
                    :disabled="[0, 1].includes(task.status)"
                    @update:checked="() => selectTaskImage(task.taskId)"
                    @click.stop
                  />
                </div>
              </div>

              <div class="flex flex-col justify-center pt-8px group/name text-16px c-#000">
                <span>{{ task.taskName }}</span>
              </div>
            </div>
          </template>
        </div>
        <template v-if="!taskListLoading && taskList?.length === 0">
          <div class="w-full min-h-200px h-full flex items-center justify-center">
            <img
              src="@/assets/images/data-null.png"
              class="w-240px"
            >
          </div>
        </template>
      </template>
      <template v-if="activeTabKey === '3'">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-15px pr-20px">
          <!-- 骨架屏 -->
          <draft-skeleton
            v-if="draftListLoading"
            class="pr-20px"
          />

          <!-- 实际内容 -->
          <template v-else-if="draftList?.length > 0">
            <div
              v-for="draft in draftList"
              :key="draft.draftId"
              class="flex flex-col cursor-pointer transition-all duration-200"
            >
              <!-- 商品图片区域 -->
              <div class="relative w-full aspect-square rounded-16px overflow-hidden group/image">
                <img
                  :src="`${draft.coverImg.split(',')[0]}?imageMogr2/thumbnail/604x604`"
                  :alt="draft.draftName"
                  class="w-full h-full object-cover rounded-16px"
                >
                <!-- 遮罩层和按钮 - 只在悬停图片时显示 -->
                <div class="absolute bottom-0 left-0 right-0 h-82px bg-gradient-to-t from-black/40 via-black/10 to-transparent flex gap-16px items-end justify-center opacity-0 transition-opacity duration-200 rounded-b-16px group-hover/image:opacity-100">
                  <button
                    class="bg-#000 text-white border-none w-90px  h-36px rounded-8px mb-14px cursor-pointer flex items-center justify-center"
                    @click="openDetailPage(draft)"
                  >
                    <img
                      src="@/assets/icon/mouse.svg"
                      :alt="$t('myDraft.actions.edit')"
                      class="size-18px mr-4px"
                    >
                    {{ $t('myDraft.actions.edit') }}
                  </button>
                  <button
                    class="bg-#FFF border-none w-90px h-36px rounded-8px mb-14px cursor-pointer flex items-center justify-center"
                    @click="deleteSingleItem(draft)"
                  >
                    <img
                      src="@/assets/icon/black-trash.svg"
                      :alt="$t('common.often.delete')"
                      class="size-18px mr-4px"
                    >
                    {{ $t('common.often.delete') }}
                  </button>
                </div>
                <!-- 选中状态的复选框 - 在图片容器内，层级最高 -->
                <div class="absolute top-4px right-8px z-10">
                  <n-checkbox
                    :checked="selectedImageId.includes(draft.draftId)"
                    @update:checked="() => selectImage(draft.draftId)"
                    @click.stop
                  />
                </div>
              </div>

              <!-- 商品信息 -->
              <div class="flex flex-col justify-center pt-12px group/name">
                <editable-input
                  :model-value=" draft.draftName "
                  :placeholder="$t('myDraft.placeholders.unnamed')"
                  @change="(newName) => handleImageNameChange(draft.draftId, newName)"
                />
              </div>
            </div>
          </template>
        </div>
        <template v-if="!draftListLoading && draftList?.length === 0">
          <div class="w-full min-h-200px h-full flex items-center justify-center">
            <img
              src="@/assets/images/data-null.png"
              class="w-240px"
            >
          </div>
        </template>
      </template>
    </n-scrollbar>
    <div
      v-if="activeTabKey !== '3'"
      class="flex items-center justify-center mt-22px"
    >
      <n-pagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-size="pageSize"
        show-quick-jumper
        @update-page="runTaskList()"
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
