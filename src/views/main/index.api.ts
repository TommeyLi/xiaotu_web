import http from '@/utils/axios'

export interface Banner {
  bannerImageUrl: string
  bannerText: string
  bannerSubText: string
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

export interface OneTabInfo {
  effectId: string
  id: string
  name: string
  previewUrl: string
  width: number
  height: number
}

export interface TwoTabInfo {
  theme: string
  list: OneTabInfo[]
}

export interface ApiResponse {
  list: OneTabInfo[]
}

export class Api {
  /**
   * 查询所有banner
   */
  static getBannerList() {
    return http.get<Banner[]>('/public/banner/list')
  }

  /**
   * 查询模板列表
   */
  // static getCategoryList(params: { id: number }) {
  //   return http.get<{ list: (OneTabInfo | TwoTabInfo)[] }[]>('/public/recommend/category/list', { params })
  // }
  static getCategoryList(params: { id: number }) {
    return http.get<{
      list: OneTabInfo[]
    }>('/public/recommend/category/list/v2', { params })
  }
}
