import type { GoodsTemplateItem } from '../detail/index.api'
import type { TaskInfo } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface CustomRequestParams {
  /**
   * 模版id
   */
  templateId: string | null
  /**
   * 商品id
   */
  maojiGoodsId: string | null
  /**
   * 替换图片url
   */
  imgUrl: string | undefined
  /**
   * 替换文字
   */
  prompt: string | null
}

export interface SubmitParams extends CustomRequestParams {
  draftId: string
}

export interface CategoryItem {
  label: string
  value: number
}

export interface TemplateCustomDetail {
  replaceText: {
    label: string
    value: string
  }[]
  replaceImageList: {
    imageFile: File | ''
    imageUrl: string
    maskImage: string
  }[]
}

export class Api {
  /**
   * 生成定制图
   */
  static generalCustomImage(params: { draftId: string }) {
    return http.post<{ draftId: string, taskId: string }>('/user/customMade/general', {}, { params })
  }

  /**
   * 查询任务状态
   */
  static getTaskProgress(params: { taskId: string }) {
    return http.get<TaskInfo>(`/image/ai/editor/status/${params.taskId}`)
  }

  /**
   * 获取收藏模版列表
   */
  static getCollectedTemplateList(params: { goodId?: string }) {
    return http.get<{
      records: GoodsTemplateItem[]
      current: string
      size: string
      total: number
    }>('/user/customMade/template/collected/list', { params })
  }

  /**
   * 收藏模版
   */
  static collectTemplate(params: { templateId: string }) {
    return http.post<string>('/user/customMade/template/collect/add', {}, { params })
  }

  /**
   * 取消收藏模版
   */
  static cancelCollectTemplate(params: { templateId: string }) {
    return http.delete<string>('/user/customMade/template/collect/delete', { params })
  }
}
