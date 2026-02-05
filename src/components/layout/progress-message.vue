<script  setup  lang="tsx">
import type { TaskInfo } from '@/store/use-user-store'
import { NCard, NScrollbar, NText, useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import failedImage from '@/assets/images/generated-failed-bg.png'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { encodeDataToHash } from '@/utils/common'
import { findRouteNameByEffectId, findRouteNameByWorkflowId } from '@/utils/findRouteNameByEffectId'
import { TaskStatusEnum } from '../image-display'

const message = useMessage()
const router = useRouter()
const {
  user,
  routes,
  pengdingTaskList,
} = storeToRefs(useUserStore())

const TaskTypeEnum = {
  AI_DRAW: 1, // ai绘图任务
  CUSTOM_GOODS: 2, // 定制商品任务
}

async function handleCardClick(item: TaskInfo) {
  try {
    const requestData = typeof item.request === 'string' ? JSON.parse(item.request) : item.request
    if (item.taskType === TaskTypeEnum.AI_DRAW) {
      // 解析 request 中的effectId
      const effectId = requestData.effectId

      // if (!effectId) {
      //   message.error($t('common.layout.progressMessage.taskDataError'))
      //   return
      // }

      // 查找匹配 effectId 的路由
      const targetName = effectId
        ? findRouteNameByEffectId(routes.value, effectId)
        : findRouteNameByWorkflowId(routes.value, requestData.workflowId)

      if (!targetName) {
        message.error($t('common.layout.progressMessage.pageNotFound'))
        return
      }

      // 跳转到目标路由，携带taskId参数
      const url = router.resolve({
        name: targetName,
        query: { taskId: item.taskId.toString() },
      })
      window.open(url.href, '_self')
    }

    if (item.taskType === TaskTypeEnum.CUSTOM_GOODS) {
      // 跳转到目标路由，携带 draftId 参数
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

function renderStatus(item: TaskInfo) {
  if (item.status === TaskStatusEnum.PENGDING) {
    return h(
      NText,
      { type: 'warning' },
      { default: () => $t('common.layout.progressMessage.generating') },
    )
  }
  if (item.status === TaskStatusEnum.WAIT) {
    return h(
      NText,
      { type: 'info' },
      { default: () => $t('common.layout.progressMessage.queuing') },
    )
  }
  if (item.status === TaskStatusEnum.SUCCESS) {
    return h(
      NText,
      { type: 'success' },
      { default: () => $t('common.layout.progressMessage.success') },
    )
  }
  if (item.status === TaskStatusEnum.FAILED) {
    return h(
      NText,
      { type: 'error' },
      { default: () => $t('common.layout.progressMessage.failed') },
    )
  }
  return null
}

function renderCard(item: TaskInfo) {
  return h(
    NCard,
    {
      style: 'width: 200px;',
      bordered: false,
      contentStyle: 'padding: 0;',
    },
    {
      default: () =>
        h('div', {
          style: 'display: flex; align-items: center; justify-content: space-between;padding:8px 12px;',
          class: 'hover:bg-#F6F6F6 cursor-pointer transition-all',
          onClick: () => handleCardClick(item),
        }, [
          h('div', { style: 'display: flex; align-items: center;font-size: 14px;' }, [
            h('img', {
              width: 40,
              height: 40,
              src: `${item.coverImageUrl}?imageMogr2/thumbnail/204x204`,
              style: 'border-radius: 4px; margin-right: 8px;',
              onError: (e: any) => { e.target.src = failedImage },
            }),
            h('span', { class: 'c-#000 font-[\'PingFang_SC\']' }, item.taskName),
          ]),
          renderStatus(item),
        ]),
    },
  )
}

function renderCustomContent() {
  return h(
    NScrollbar,
    {
      'style': 'max-height: 120px; max-width: 420px;',
      'x-scrollable': false,
    },
    {
      default: () => h(
        'div',
        { style: 'display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: start;' },
        pengdingTaskList.value.map(item => renderCard(item)),
      ),
    },
  )
}

function renderCustomHeader() {
  return h(
    'div',
    {
      class: 'font-[\'PingFang_SC\'] c-#666 size-14px py-8px px-12px w-full',
    },
    $t('common.layout.progressMessage.ongoingTasks'),
  )
}

const options = computed(() => {
  return [
    {
      key: 'header',
      type: 'render',
      render: pengdingTaskList.value.length
        ? renderCustomHeader
        : () => h('div', { style: 'display: flex; align-items: center; justify-content: center; height: 100%;' }, [h('span', { style: 'color:#666666;font-size:14px;padding:15px' }, $t('common.layout.progressMessage.noOngoingTasks'))]),
    },
    {
      key: 'header-divider',
      type: 'divider',
      show: !!pengdingTaskList.value.length,
    },
    {
      key: 'content',
      type: 'render',
      show: !!pengdingTaskList.value.length,
      render: renderCustomContent,
    },
  ]
})

function handleSelect(key: string | number) {
  message.info(String(key))
}
</script>

<template>
  <n-dropdown
    trigger="hover"
    :options="options"
    @select="handleSelect"
  >
    <pro-button
      text
      class="size-34px"
    >
      <template #icon>
        <n-badge
          :value="user.noticeCount"
          :offset="[-9, 12]"
          :show="true"
          color="#FF4E47"
        >
          <img
            src="@/assets/icon/message.png"
            class="message-icon truncate"
          >
        </n-badge>
      </template>
    </pro-button>
  </n-dropdown>
</template>

<style scoped lang="scss">
.message-icon {
  width: 1.3125rem;
  height: 1.3125rem;
}
</style>
