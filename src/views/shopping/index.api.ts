import http from '@/utils/axios'

export interface GoodsItem {
  cartId: string
  userId: string
  goodsId: string
  draftId?: string
  templateId?: string
  goodsName: string
  goodsImageUrl: string
  goodsPrice: number
  customParams: any | null
  customParamsDesc: string | null
  quantity: number
  subAmount: number
  isSelected: number
  createTime: string
  updateTime: string
}

export class Api {
  /**
   * 分页获取购物车列表
   */
  static getGoodsList(params: ApiUtil.PaginationParams) {
    return http.get<{
      records: GoodsItem[]
      current: string
      size: string
      total: number
    }>('/user/goods/cart/list', { params })
  }

  /**
   * 删除购物车记录
   */
  static removeGoodsRecords(params: { cartIds: string[] }) {
    return http.post<string>('/user/goods/cart/remove', {}, { params: { cartIds: params.cartIds.join(',') } })
  }

  /**
   * 修改购物车中商品某一项的数量
   */
  static updateQuantity(params: { cartId: string, quantity: string }) {
    return http.put<any>('/user/goods/cart/updateQuantity', {}, { params })
  }

  /**
   * 恢复购物车
   */
  static recoverCarts(params: { cartIds: string[] }) {
    return http.post<any>('/user/order/recover/carts', params.cartIds)
  }
}
