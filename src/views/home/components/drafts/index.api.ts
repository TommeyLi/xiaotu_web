import type { TaskInfoALL } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface DraftItem {
  createTime: string
  draftContent: string
  draftId: string
  taskId: string
  draftName: string
  coverImg: string
  effectImageList: string
  goodId: string
  isEditable: number
  originalImageUrl: string
  templateId: string
  templateName: string
  updateTime: string
  choice: any
}

export interface TemplateItem {
  name: string
  updateTime: string
  id: string
  goodId: string
  originalPic: string
  picUrls: string[]
  categoryId: number
}

export interface Templates {
  img: string
  moduleType: number
  createTime: string
  templates: TemplateItem[]
  remark: string
  sort: number
  categoryName: string
  moduleTypeName: string
  templateCount: number
  categoryId: string
}

export interface AddDraftParams {
  draftId?: string
  templateId: string
  goodId: string
  draftName: string
  draftContent: string
  choice: {
    quantity: number
    size: string
    size_id: string
    color_id: number
    sku_code: string
    color_name: string
  }
}

export class Api {
  /**
   * 获取我的草稿列表
   */
  static getDraftList() {
    return http.get<DraftItem[]>('/user/customMade/getDraftList')
  }

  /**
   * 删除草稿
   */
  static deleteDraft(params: { draftId: string }) {
    return http.delete<any>('/user/customMade/deleteDraft', { params })
  }

  /**
   * 批量删除草稿
   */
  static batchDeleteDraft(params: { draftIds: string[] }) {
    return http.delete<any>('/user/customMade/batchDeleteDraft', {
      params,
      // 将数组序列化为 draftIds=1&draftIds=2（而不是 draftIds[]=1&draftIds[]=2）
      paramsSerializer: {
        serialize(p) {
          const usp = new URLSearchParams()
          Object.entries(p || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => {
                if (v !== undefined && v !== null)
                  usp.append(key, String(v))
              })
            }
            else if (value !== undefined && value !== null) {
              usp.append(key, String(value))
            }
          })
          return usp.toString()
        },
      },
    })
  }

  /**
   * 批量删除任务草稿
   */
  static batchDeleteTaskDraft(params: { taskIds: (number | string)[] }) {
    return http.delete<any>('/image/ai/editor/batchDeleteTask', {
      params,
      // 将数组序列化为 draftIds=1&draftIds=2（而不是 draftIds[]=1&draftIds[]=2）
      paramsSerializer: {
        serialize(p) {
          const usp = new URLSearchParams()
          Object.entries(p || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => {
                if (v !== undefined && v !== null)
                  usp.append(key, String(v))
              })
            }
            else if (value !== undefined && value !== null) {
              usp.append(key, String(value))
            }
          })
          return usp.toString()
        },
      },
    })
  }

  /**
   * 修改草稿名称
   */
  static updateDraftName(params: { draftId: string, draftName: string }) {
    return http.put<any>('/user/customMade/updateDraftName', {}, { params })
  }

  /**
   * 新增/修改草稿
   */
  static saveDraft(params: AddDraftParams) {
    return http.post<any>('/user/customMade/saveDraft', params)
  }

  /**
   * 查询AI绘图对应草稿列表（小兔精工）
   */
  static getTaskList(params: { status?: number, taskType?: number, pageNum: number, pageSize: number }) {
    return http.get<TaskInfoALL>('/image/ai/editor/list/ongoing', { params })
  }

  /**
   * 查询草稿详情
   */
  static getDraftDetail(params: { draftId: string }) {
    return http.get<DraftItem>('/user/customMade/getDraftDetail', { params })
  }
}
