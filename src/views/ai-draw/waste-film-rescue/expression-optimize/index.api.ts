import type { TaskInfo } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface CustomRequestParams {
  /**
   * 原图
   */
  url: string | null
  /**
   * 图片尺寸
   */
  imageSize: string
  /**
   * 图片比例
   */
  size: string
  sizex: string
  /**
   * 参考图列表
   */
  styleUrl: string[]
}

export interface SubmitRequestParams {
  /**
   * 原图
   */
  url: string | null
  /**
   * 提示词
   */
  text?: string
  sizex: string
  /**
   * 图片尺寸
   */
  imageSize: string
  /**
   * 图片比例
   */
  size: string
}

export interface SubmitParams {
  workflowId: string
  customRequest: CustomRequestParams
}

export interface EffectDescOption {
  label: string
  prompt: string
  replaceValue: string
}
export interface EffectDesc {
  title: string
  value: string
  options: EffectDescOption[]
}

export interface EchoData {
  groups: EffectDesc[]
  url: string | null
  customText: string
  styleUrl: string[]
  imageSize: string
  refrenceUrl: string
  size: string
}

export class Api {
  /**
   * 提交任务
   */
  static submit(data: SubmitParams) {
    return http.post<string>('/image/ai/editor/submit', data)
  }

  /**
   * 查询任务状态
   */
  static getTaskProgress(params: { taskId: string }) {
    return http.get<TaskInfo>(`/image/ai/editor/status/${params.taskId}`)
  }
}
