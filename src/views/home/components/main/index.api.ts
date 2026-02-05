import http from '@/utils/axios'

export interface Banner {
  bannerImageUrl: string | null
  bannerText: string | null
  bannerSubText: string | null
  sort: number
  jumpUrl: string
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

export class Api {
  /**
   * 查询所有banner
   */
  static getBannerList(params: { langCode: string }) {
    return http.get<Banner[]>('/public/banner/list', { params })
  }

  /**
   * 查询模板列表
   */
  static getTemplateInfo() {
    return http.get<{
      records: Templates[]
      current: string
      size: string
      total: number
    }>('/public/template/category/list')
  }
}
