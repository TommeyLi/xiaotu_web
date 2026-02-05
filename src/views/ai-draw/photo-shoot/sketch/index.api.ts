import type { TaskInfo } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface CustomRequestParams {
  styleUrl: string[]
  /**
   * 图片尺寸
   */
  imageSize: string
  /**
   * 图片比例
   */
  size: string
}

export interface SubmitRequestParams {
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
   * 当前入参的值
   */
  context?: any
}

export interface ReferenceItems {
  styleUrl: string
  text: string
}

export interface SubmitParams {
  workflowId: string
  customRequest: CustomRequestParams
}

export interface StyleDescription {
  num: number
  styleUrl: string
  background: string
  id: string
  images: string[]
}

export interface EffectDescItem {
  theme: string
  style: StyleDescription[]
}

export interface EchoData {
  selectTemplateInfo: StyleDescription
  fileList: any
  urlList: any
  styleUrl: string[]
  customText: string
  size: string
  imageSize: string
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

  /**
   *  获取关键词
   */
  static getKeyWords(data: any) {
    return http.post<string>('/image/ai/editor/keywords', data)
  }
}
