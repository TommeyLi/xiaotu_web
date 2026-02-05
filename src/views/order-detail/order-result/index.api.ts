import type { LogisticsItem, OrderDetail } from '../confirm-order/index.api'
import type { AddGoodsParams } from '@/views/custom-goods/detail/index.api'
import http from '@/utils/axios'

interface GetOrderParams {
  orderId: string
}

export interface OrderInfo {
  status: 'success' | 'fail'
  orderId: string
  // 原先订单的订单信息hash值，方便再次访问确认订单页
  oldOrderHash?: string
  totalPrice?: number
}

export interface GoodsItem {
  orderData: AddGoodsParams
  coverImg: string
  goodsName: string
  realPrice: number
}

export interface CreateShoppingCartParams {
  addressId: string
  remark: string
  ids: string[]
}

export interface LogisticsDetailItem {
  /**
   * 物流信息发生的时间（格式化字符串）
   */
  ftime: string // 格式："YYYY-MM-DD HH:mm:ss"

  /**
   * 地区编码
   */
  areaCode: string

  /**
   * 地区名称
   */
  areaName: string

  /**
   * 物流动态描述
   */
  context: string

  /**
   * 物流信息发生的时间（标准字符串，与ftime相同或可选不同格式）
   */
  time: string // 格式："YYYY-MM-DD HH:mm:ss"

  /**
   * 当前物流状态
   */
  status: string
}

export class Api {
  /**
   * 查询订单详情
   */
  static getOrderDetail(params: GetOrderParams) {
    return http.get<OrderDetail>('/user/order/detail', { params })
  }

  /**
   * 购物车下单
   */
  static createShoppingCart(params: CreateShoppingCartParams) {
    return http.post<OrderDetail>('/user/order/createFromCart', params)
  }

  /**
   * 物流详情
   */
  static getDeliveryDetail(params: LogisticsItem) {
    return http.post<LogisticsDetailItem[]>('/express/query', params)
  }
}
