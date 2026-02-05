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
  sizex: string
  /**
   * 图片比例
   */
  size: string
  /**
   * 参考图列表
   */
  styleUrl: string[]
}

export interface ReferenceItems {
  styleUrl: string
  id: string
  text: string
  images: string
}

export interface SubmitParams {
  workflowId: string
  customRequest: CustomRequestParams
}

export interface StyleDescription {
  text: string
  id: string
  styleUrl: string
  images: string
}

export interface EffectDescItem {
  theme: string
  style: StyleDescription[]
}

export interface EchoData {
  selectReferenceList: ReferenceItems[]
  url: string | null
  styleUrl: string[]
  customText: string
  imageSize: string
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
