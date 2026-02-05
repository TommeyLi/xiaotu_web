<script setup lang="ts">
import type { DraftItem } from './index.api'
import { useDialog, useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import EditableInput from '@/components/editable-input/index.vue'
import DraftSkeleton from '@/components/skeleton/draft-skeleton.vue'
import { useProRequest } from '@/composables/use-pro-request'
import { $t } from '@/locales/locales'
import { encodeDataToHash } from '@/utils/common'
import { Api } from './index.api'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

const isCheckedAll = ref(false)
const selectedImageId = ref<string[]>([])

const {
  data: draftList,
  loading: draftListLoading,
} = useProRequest(async () => {
  const result = await Api.getDraftList()
  return result.data ?? []
})

// 计算属性：是否全选
const isAllSelected = computed(() => {
  return draftList.value.length > 0 && selectedImageId.value.length === draftList.value.length
})

// 全选/取消全选处理函数
function handleSelectAll(checked: boolean) {
  if (checked) {
    // 全选
    selectedImageId.value = draftList.value.map(item => item.draftId)
  }
  else {
    // 取消全选 - 只有用户主动点击全选按钮才会清空所有选中项
    selectedImageId.value = []
  }
}

// 监听选中项变化，更新全选状态
watch(selectedImageId, () => {
  // 只有当选中项数量等于总数量时才显示为全选状态
  // 如果用户取消其中任何一个，全选按钮就会变为未选中状态
  isCheckedAll.value = isAllSelected.value
}, { deep: true })

function openDetailPage(draft: DraftItem) {
  if (draft.isEditable === 0) {
    message.warning($t('drafts.messages.cannotEdit'))
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

function selectImage(imageId: string) {
  const index = selectedImageId.value.findIndex(t => t === imageId)
  if (~index) {
    selectedImageId.value.splice(index, 1)
  }
  else {
    selectedImageId.value.push(imageId)
  }
}

// 单个删除
function deleteSingleItem(draft: DraftItem) {
  dialog.warning({
    title: $t('drafts.dialogs.deleteTitle'),
    content: $t('drafts.dialogs.deleteContent', { name: draft.draftName }) as string,
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
          message.success($t('drafts.messages.deleteSuccess'))
        }
      }
      catch (error: any) {
        message.error(error.response.data.msg || ($t('drafts.messages.deleteFail') as string))
      }
    },
  })
}

// 批量删除
function batchDelete() {
  if (selectedImageId.value.length === 0) {
    message.warning($t('drafts.messages.selectToDelete'))
    return
  }

  dialog.warning({
    title: $t('drafts.dialogs.batchDeleteTitle'),
    content: $t('drafts.dialogs.batchDeleteContent', { count: selectedImageId.value.length }) as string,
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      try {
        const result = await Api.batchDeleteDraft({ draftIds: selectedImageId.value })
        console.log(result, 'result')
        draftList.value = draftList.value.filter(item => !selectedImageId.value.includes(item.draftId))
        message.success($t('drafts.messages.batchDeleteSuccess', { count: selectedImageId.value.length }) as string)
        selectedImageId.value = []
      }
      catch (error: any) {
        message.error(error.response.data.msg || ($t('drafts.messages.deleteFail') as string))
      }
    },
  })
}

// 处理图片名称变化
async function handleImageNameChange(draftId: string, draftName: string) {
  try {
    const result = await Api.updateDraftName({ draftId, draftName })
    const draft = draftList.value.find(draft => draft.draftId === draftId)
    if (draft) {
      draft.draftName = draftName
    }
    message.success(result.rawData.msg ?? ($t('drafts.messages.updateNameSuccess', { name: draftName }) as string))
  }
  catch (error: any) {
    message.error(error.response.data.msg ?? ($t('drafts.messages.updateNameFail') as string))
  }
}
</script>

<template>
  <div class="w-full h-full bg-#FFF rounded-16px p-24px box-border flex flex-col">
    <!-- 固定头部 -->
    <div class="w-full flex justify-end sticky top-0 left-0 bg-#FFF z-10 pb-16px font-['PingFang_SC'] outline outline-1 outline-white">
      <div class="flex gap-16px items-center justify-center">
        <n-checkbox
          :checked="isCheckedAll"
          @update:checked="handleSelectAll"
        >
          {{ $t('drafts.actions.selectAll') }}
        </n-checkbox>
        <n-button @click="batchDelete">
          {{ $t('drafts.actions.batchDelete') }}
        </n-button>
      </div>
    </div>

    <!-- 滚动内容区域 -->
    <n-scrollbar
      :x-scrollable="false"
      class="flex-1"
      content-class="h-full"
    >
      <div class="grid grid-cols-[repeat(auto-fill,minmax(264px,1fr))] gap-15px pr-20px">
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
                :src="draft.coverImg.split(',')[0]"
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
                    :alt="$t('drafts.actions.edit')"
                    class="size-18px mr-4px"
                  >
                  {{ $t('drafts.actions.edit') }}
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
                :placeholder="$t('drafts.placeholders.unnamed')"
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
    </n-scrollbar>
  </div>
</template>

<style scoped lang="scss">
/* 响应式网格布局 */
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
    gap: 12px !important;
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
    gap: 10px !important;
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
    gap: 8px !important;
  }
}
</style>
