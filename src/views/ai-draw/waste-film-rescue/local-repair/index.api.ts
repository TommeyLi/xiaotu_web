import type { TaskInfo } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface CustomRequestParams {
  /**
   * 原图
   */
  url: string | null
  /**
   * 重绘图片（透明背景）
   */
  maskUrl: string | null
  /**
   * 参考图
   */
  referenceUrl: string | null
}

export interface SubmitParams {
  workflowId: string
  customRequest: CustomRequestParams
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
