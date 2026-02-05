import type { Annotation } from './index copy.vue'
import type { TaskInfo } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface CustomRequestParams {
  /**
   * 参考图列表
   */
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
   * 提示词
   */
  text?: string
  /**
   * 图片尺寸
   */
  imageSize: string
  sizex: string
  /**
   * 图片比例
   */
  size: string
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
  text: string
  props: string
  gender: string
  costume: string
  styleUrl: string
}

export interface EffectDescItem {
  theme: string
  style: StyleDescription[]
}

export interface FilterOptions {
  props: string | null
  gender: string | null
  costume: string | null
}

export interface EchoData {
  styleUrl: string[]
  globalAnnotations: Annotation[]
  maxId: number
  model: any
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
