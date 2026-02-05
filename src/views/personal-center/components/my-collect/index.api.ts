import type { GoodsTemplateItem } from '@/views/custom-goods/detail/index.api'
import type { Goods } from '@/views/custom-goods/index.api'
import http from '@/utils/axios'

export class Api {
  /**
   * 获取收藏模版列表
   */
  static getCollectedTemplateList(params: { goodId?: string }) {
    return http.get<{ records: GoodsTemplateItem[], total: number }>('/user/customMade/template/collected/list', { params })
  }

  /**
   * 获取收藏商品列表
   */
  static getGoodsCollectList(params: ApiUtil.PaginationParams) {
    return http.get<{ records: Goods[], total: number }>('/user/goods/collect/list', { params })
  }
}
