import http from '@/utils/axios'

export interface Banner {
  bannerImageUrl: string | null
  bannerText: string | null
  bannerSubText: string | null
  sort: number
}

export interface GoodsCategory {
  img: string
  sort: number
  remark: string
  categoryId: string
  createTime: string
  goodsCount: number
  categoryName: string
}

export interface Goods {
  goodsId: string
  categoryName: string | null
  goodsName: string
  goodsDesc: string
  mainImageUrl: string
  isCollected: number
  details: string
  shareImg: string | null
  coverImg: string
  marketLabelArr: any[] | null
  stampLabelArr: any[] | null
  supportColorArr: any[] | null
  mainColor: string | null
  isShow: number
  isHot: number | null
  saleCount: number
  sku_code?: string
  realSaleCount: number
  realPrice: number
  originPrice: number | null
  isCustomize: number
  status: number
  statusName: string
  sort: number
  createTime: string
  updateTime: string
  story: string | null
}

export class Api {
  /**
   * 查询所有banner
   */
  static getBannerList(params: { langCode: string }) {
    return http.get<Banner[]>('/public/banner/list', { params })
  }

  /**
   * 查询商品分类
   */
  static getCategoryList() {
    return http.get<GoodsCategory[]>('/public/goods/category/list')
  }

  /**
   * 查询商品列表
   */
  static getGoodsList(params: ApiUtil.WithPaginationParams<{ categoryId: string }>) {
    return http.get<{
      records: Goods[]
      current: string
      size: string
      total: number
    }>('/public/goods/list', { params })
  }
}
