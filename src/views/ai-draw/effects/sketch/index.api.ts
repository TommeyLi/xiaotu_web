import type { TaskInfo } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface CustomRequestParams {
  /**
   * 原图
   */
  url: string | null
  /**
   * 风格图
   */
  styleUrl: string | null
  /**
   * 风格图文本描述
   */
  text: string | null
  /**
   * 尺寸
   */
  size: string | null
}

export interface SubmitParams {
  workflowId: string
  customRequest: CustomRequestParams
}

export interface StyleDescription {
  text: string
  styleUrl: string
}

export interface EffectDescItem {
  them: string
  style: StyleDescription[]
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
