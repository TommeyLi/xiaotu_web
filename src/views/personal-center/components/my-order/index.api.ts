import type { OrderDetail } from '@/views/order-detail/confirm-order/index.api'
import http from '@/utils/axios'

interface GetOrderListParams extends ApiUtil.PaginationParams {
  orderStatus?: number
}

export class Api {
  /**
   * 获取订单列表
   */
  static getOrderList(params: GetOrderListParams) {
    return http.get<{
      list: OrderDetail[]
      pageSize: string
      total: number
    }>('/user/order/list', { params })
  }
}
