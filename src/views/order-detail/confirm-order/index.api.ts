import type { SourceType } from './const'
import type { AddGoodsParams } from '@/views/custom-goods/detail/index.api'
import http from '@/utils/axios'

interface CreateOrderParams {
  addressId: string
  remark: string
  good: AddGoodsParams
}

export interface GoodsItem {
  orderData: AddGoodsParams
  coverImg: string
  goodsName: string
  realPrice: number
}

export interface ReceiveRouteQuery {
  goodsInfo: GoodsItem[]
  source: SourceType
  shoppingIds?: string[]
  totalPrice: number
}

export interface CreateShoppingCartParams {
  addressId: string
  remark: string
  ids: string[]
}

// 订单项接口
interface OrderItem {
  orderItemId: string
  orderId: string
  goodsId: string
  goodsCode: string | null
  goodsName: string
  goodsImageUrl: string
  goodsPrice: number
  customParams: string // JSON 字符串，例如: {"size":"12\"x12\"","size_id":138,...}
  customParamsDesc: string | null
  quantity: number
  subAmount: number
  createTime: string // 格式: "YYYY-MM-DD HH:mm:ss"
  cartId: string
}

export interface LogisticsItem {
  deliveryCompany: string
  deliveryNo: string
}

// 主订单接口
export interface OrderDetail {
  orderId: string
  orderNo: string
  userId: string
  userName: string | null
  enterpriseId: string
  enterpriseName: string | null
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  totalAmount: number
  discountAmount: number
  payAmount: number
  payNo: string | null
  payTypeName: string | null
  orderStatus: number
  orderStatusName: string | null
  cancelReason: string | null
  orderRemark: string
  frozenBalance: number
  createTime: string // 格式: "YYYY-MM-DD HH:mm:ss"
  payTime: string | null
  shipTime: string | null
  completeTime: string | null
  orderItemList: OrderItem[]
  logisticsList: LogisticsItem[] | null
}

export class Api {
  /**
   * 下单
   */
  static createOrder(params: CreateOrderParams) {
    return http.post<OrderDetail>('/user/order/create', params)
  }

  /**
   * 购物车下单
   */
  static createShoppingCart(params: CreateShoppingCartParams) {
    return http.post<OrderDetail>('/user/order/createFromCart', params)
  }
}
