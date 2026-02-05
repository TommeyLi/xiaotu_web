import type { AxiosResponse } from 'axios'
import type { Ref } from 'vue'
import type { GenerateStatus } from '@/components/image-display'
import { useMessage } from 'naive-ui'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { GenerateStatusEnum, TaskStatusEnum } from '@/components/image-display'
import { useProRequest } from '@/composables/use-pro-request'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'

interface UseAiGenerateTaskOptions<
  TSubmitParams extends Record<string, any>,
  TTaskInfo extends Record<string, any>,
> {
  /**
   * 校验函数，返回 true/false
   */
  validateAll: () => boolean
  /**
   * 表单数据（ref）
   */
  values: Ref<Record<string, any>>
  /**
   * API 定义
   */
  api: {
    submit: (data: TSubmitParams) => Promise<AxiosResponse<string>>
    getTaskProgress: (params: { taskId: string }) => Promise<AxiosResponse<TTaskInfo>>
  }
  /**
   * 生成前的处理函数
   */
  preGenerateHandler: () => Promise<any[]> | any[]
  /**
   * 页面回显数据的处理函数
   */
  handleEchoData?: (context: any) => void
  /**
   * 当前路由数据（例如包含 workflowId、point、previewImageUrl）
   */
  currentRouteData: Ref<any>
  /**
   * 上下文数据
   */
  context?: any
}

export interface GenerateDataItem {
  /** 生成状态 */
  generateStatus: GenerateStatus
  /** 结果图片URL */
  resultUrl: string | undefined
  taskId: string
}

/**
 * 通用生成任务逻辑 Hook
 */
export function useGenerateTaskPolling<
  TSubmitParams extends Record<string, any>,
  TTaskInfo extends { status: number, resultUrl?: string, request?: string },
>(options: UseAiGenerateTaskOptions<TSubmitParams, TTaskInfo>) {
  const { validateAll, values, api, currentRouteData, preGenerateHandler, handleEchoData, context } = options

  const message = useMessage()
  const route = useRoute()

  const resultUrl = ref<string>(currentRouteData.value.previewImageUrl)
  const generateStatus = ref<GenerateStatus>(GenerateStatusEnum.IDLE)
  const generateDataList = ref<GenerateDataItem[]>([])
  const submitArr = ref<any[]>([])

  const buttonText = computed(() => {
    switch (generateStatus.value) {
      case GenerateStatusEnum.GENERATING:
        return $t('aiDraw.common.buttonText.generating')
      case GenerateStatusEnum.FAILED:
        return $t('aiDraw.common.buttonText.regenerate')
      default:
        return $t('aiDraw.common.buttonText.generate')
    }
  })

  const isButtonDisabled = computed(() => {
    return generateStatus.value === GenerateStatusEnum.GENERATING
  })

  const {
    runAsync: runGetTaskProgress,
    cancel: cancelGetTaskProgress,
    data: generateDataTaskList,
  } = useProRequest(api.getTaskProgress, {
    manual: true,
    pollingInterval: 5000,
    pollingWhenHidden: false,
    onSuccess: ({ data }) => {
      if ([TaskStatusEnum.WAIT, TaskStatusEnum.PENGDING].includes(data.status as any)) {
        if (generateStatus.value === GenerateStatusEnum.GENERATING) {
          return
        }
        generateStatus.value = GenerateStatusEnum.GENERATING
        return
      }
      if (data.status === TaskStatusEnum.FAILED) {
        generateStatus.value = GenerateStatusEnum.FAILED
        message.error($t('aiDraw.common.messages.generateFail'))
        cancelGetTaskProgress()
        return
      }
      if (data.status === TaskStatusEnum.SUCCESS) {
        resultUrl.value = data.resultUrl || ''
        generateStatus.value = GenerateStatusEnum.FINISHED
        message.success($t('aiDraw.common.messages.generateSuccess'))
        cancelGetTaskProgress()
      }
    },
    onError: (error) => {
      generateStatus.value = GenerateStatusEnum.FAILED
      message.error($t('aiDraw.common.messages.generateFail'))
      throw error
    },
  })

  // 2. 存储所有正在轮询的定时器（用于后续清理）
  const pollingIntervals = ref<Record<string, number>>({})
  // 3. 封装一个启动轮询的函数
  function startPolling(taskId: string) {
    console.log('taskId', taskId)
    if (pollingIntervals.value[taskId])
      return // 防止重复启动

    const intervalId = window.setInterval(async () => {
      try {
        const { data } = await api.getTaskProgress({ taskId })
        // console.log(JSON.parse(JSON.stringify(data)), 'data')
        if ([TaskStatusEnum.WAIT, TaskStatusEnum.PENGDING].includes(data.status as any)) {
          if (generateStatus.value !== GenerateStatusEnum.GENERATING) {
            generateStatus.value = GenerateStatusEnum.GENERATING
          }
        }
        if (data.status === TaskStatusEnum.FAILED) {
          generateStatus.value = GenerateStatusEnum.FAILED
          message.error($t('aiDraw.common.messages.generateFail'))
          stopPolling(taskId)
        }
        if (data.status === TaskStatusEnum.SUCCESS) {
          resultUrl.value = resultUrl.value ? `${resultUrl.value},${data.resultUrl}` : data.resultUrl ?? ''
          generateStatus.value = GenerateStatusEnum.FINISHED
          message.success($t('aiDraw.common.messages.generateSuccess'))
          stopPolling(taskId)
        }
        const curIndex = generateDataList.value.findIndex(item => item.taskId === taskId)
        if (~curIndex) {
          generateDataList.value[curIndex] = {
            taskId,
            generateStatus: generateStatus.value,
            resultUrl: data.resultUrl,
          }
        }
        else {
          generateDataList.value.push({
            taskId,
            generateStatus: generateStatus.value,
            resultUrl: data.resultUrl,
          })
        }
        console.log(generateDataList.value, 'generateDataList')
      }
      catch (error) {
        console.error(`Polling error for task ${taskId}:`, error)
        // 可选：出错也停止轮询
        stopPolling(taskId)
      }
    }, 5000)

    pollingIntervals.value[taskId] = intervalId
    console.log(pollingIntervals.value, 'pollingIntervals.value')
  }

  // 4. 停止轮询的函数
  function stopPolling(taskId: string) {
    if (pollingIntervals.value[taskId]) {
      clearInterval(pollingIntervals.value[taskId])
      delete pollingIntervals.value[taskId]
    }
  }

  // 5. 在组件卸载时清理所有轮询（避免内存泄漏）
  onUnmounted(() => {
    Object.keys(pollingIntervals.value).forEach(stopPolling)
  })

  const taskId = ref<string[]>([])
  const {
    runAsync: runSubmit,
  } = useProRequest(api.submit, {
    manual: true,
    onSuccess: (res) => {
      taskId.value.push(res.data)
      console.log(taskId.value, ' taskId.value')
      return res
    },
    onError: (error: any) => {
      generateStatus.value = GenerateStatusEnum.IDLE
      message.error(error.response?.data?.msg ?? $t('aiDraw.common.messages.generateFail'))
      throw error
    },
  })

  async function handleGenerate() {
    if (!validateAll())
      return
    generateStatus.value = GenerateStatusEnum.GENERATING
    submitArr.value = await preGenerateHandler()
    taskId.value = []
    // data 是一个数组，遍历去循环runSubmit方法，最终拿到所有请求同时成功后的结果
    console.log(taskId.value, submitArr, 'shifasd11')
    for (let i = 0; i < submitArr.value.length; i++) {
      const exartParams = context.value.styleId.length ? { styleId: context.value.styleId[i] } : {}
      await runSubmit({
        workflowId: currentRouteData.value.workflowId,
        effectId: currentRouteData.value.effectId,
        customRequest: submitArr.value[i],
        context: context.value,
        ...exartParams,
      } as unknown as TSubmitParams)
    }
    generateDataList.value = []
    console.log(taskId.value, 'shifasd')
    for (let i = 0; i < taskId.value.length; i++) {
      startPolling(taskId.value[i]) // 假设 res.data 是 taskId
    }
  }

  // --- 监听路由 taskId，回显任务详情 ---
  watch(() => route.query.taskId, async (taskId) => {
    if (!taskId)
      return

    const userStore = useUserStore()

    // if (task) {
    await runGetTaskProgress({ taskId: taskId as string })

    const task = userStore.pengdingTaskList.find(item => item.taskId.toString() === taskId) ?? { request: '' }
    const request = generateDataTaskList.value.data.request ? generateDataTaskList.value.data.request : task.request
    const requestData = typeof request === 'string' ? JSON.parse(request) : request
    if (handleEchoData) {
      handleEchoData(requestData.context)
      return
    }
    if (requestData.customRequest) {
      values.value = {
        ...values.value,
        ...requestData.customRequest,
      }
    }
    // }
    // else {
    // message.warning($t('aiDraw.common.messages.taskNotFound'))
    // }
  }, { immediate: true })

  return {
    generateDataList,
    resultUrl,
    generateStatus,
    buttonText,
    isButtonDisabled,
    handleGenerate,
  }
}
