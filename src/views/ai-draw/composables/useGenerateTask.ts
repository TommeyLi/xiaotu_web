import type { AxiosResponse } from 'axios'
import type { Ref } from 'vue'
import type { GenerateStatus } from '@/components/image-display'
import { useMessage } from 'naive-ui'
import { computed, ref, watch } from 'vue'
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
    getTaskProgress: (params: {
      taskId: string
    }) => Promise<AxiosResponse<TTaskInfo>>
  }
  /**
   * 生成前的处理函数
   */
  preGenerateHandler?: () => Promise<void> | void
  /**
   * 当前路由数据（例如包含 workflowId、point、previewImageUrl）
   */
  currentRouteData: Ref<any>
  /**
   * 上下文数据
   */
  context?: any
  /**
   * 页面回显数据的处理函数
   */
  handleEchoData?: (context: any) => void
}

/**
 * 通用生成任务逻辑 Hook
 */
export function useGenerateTask<
  TSubmitParams extends Record<string, any>,
  TTaskInfo extends { status: number, resultUrl?: string, request?: string },
>(options: UseAiGenerateTaskOptions<TSubmitParams, TTaskInfo>) {
  const {
    validateAll,
    values,
    api,
    currentRouteData,
    preGenerateHandler,
    handleEchoData,
    context,
  } = options

  const message = useMessage()
  const route = useRoute()

  const resultUrl = ref<string>(currentRouteData.value.previewImageUrl)
  const generateStatus = ref<GenerateStatus>(GenerateStatusEnum.IDLE)

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
    data: generateDataList,
  } = useProRequest(api.getTaskProgress, {
    manual: true,
    pollingInterval: 5000,
    pollingWhenHidden: false,
    onSuccess: ({ data }) => {
      if (
        [TaskStatusEnum.WAIT, TaskStatusEnum.PENGDING].includes(
          data.status as any,
        )
      ) {
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

  const { runAsync: runSubmit } = useProRequest(api.submit, {
    manual: true,
    onSuccess: (res) => {
      runGetTaskProgress({ taskId: res.data })
      return res
    },
    onError: (error: any) => {
      generateStatus.value = GenerateStatusEnum.IDLE
      message.error(
        error.response?.data?.msg ?? $t('aiDraw.common.messages.generateFail'),
      )
      throw error
    },
  })

  async function handleGenerate() {
    if (!validateAll())
      return
    generateStatus.value = GenerateStatusEnum.GENERATING
    try {
      if (preGenerateHandler)
        await preGenerateHandler()
    }
    catch (error: any) {
      console.log(error, 'error')
      message.error(
        error.response.data.msg
          ? error.response.data.msg
          : $t('aiDraw.common.messages.generateFail'),
      )
      generateStatus.value = GenerateStatusEnum.FAILED
      return
    }
    const exartParams
      = context && context?.styleId ? { styleId: context.styleId } : {}
    await runSubmit({
      workflowId: currentRouteData.value.workflowId,
      customRequest: values.value,
      effectId: currentRouteData.value.effectId,
      context: context ? context.value : {},
      ...exartParams,
    } as unknown as TSubmitParams)
  }

  // --- 监听路由 taskId，回显任务详情 ---
  watch(
    () => route.query.taskId,
    async (taskId) => {
      if (!taskId)
        return

      const userStore = useUserStore()

      // if (task) {
      await runGetTaskProgress({ taskId: taskId as string })
      const task = userStore.pengdingTaskList.find(
        item => item.taskId.toString() === taskId,
      ) ?? { request: '' }
      const request = generateDataList.value.data.request
        ? generateDataList.value.data.request
        : task.request
      const requestData
        = typeof request === 'string' ? JSON.parse(request) : request
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
    },
    { immediate: true },
  )

  return {
    resultUrl,
    generateStatus,
    buttonText,
    isButtonDisabled,
    handleGenerate,
    cancelGetTaskProgress,
  }
}
