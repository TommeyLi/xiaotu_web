import type { Goods } from '../index.api'
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

export interface GoodsTemplateItem {
  name: string
  isCollect: number
  id: string
  replaceText: string
  originalPic: string
  picUrls: string[]
  maskImage?: string
}

export interface TemplateDetail {
  originalParamsJson: string // JSON字符串，包含原始参数信息
  createTime: string // 创建时间
  name: string // 名称
  updateTime: string // 更新时间
  id: string // ID
  goodId: string // 商品ID
  originalPic: string // 原始图片URL，可能为空
  picUrls: string[] // 图片URL列表
  categoryId: string // 分类ID
  isCollect: number
  replaceText: string[]
  replaceImageList: {
    imageUrl: ''
    maskImage: ''
    imageFile: File | ''
  }[]
}

export interface Colors {
  id: number
  name: string
  color: string
  img_url: string
  color_id: string
  disabled: null
  color_name: string
  real_price: string
  origin_price: string
}

export interface Sizes {
  id: string
  name: string
  disabled: null
}

export type FinalGoodsType = Omit<Goods, 'mainImageUrl'>
  & { mainImageUrl: string[], introduce: string, colors: Colors[], sizes: Sizes[] }

export interface AddGoodsParams {
  goodsId: string
  quantity: number
  choice: {
    size: string
    size_id: string
    color_id: number
    sku_code: string
    color_name: string
  }
  draftId?: string
  taskId?: string
  templateId?: string
}

export class Api {
  /**
   * 根据商品id获取商品详情
   */
  static getGoodsDetail(params: { goodsId: string }) {
    return http.get<Goods>('/public/goods/detail', { params })
  }

  /**
   * 根据商品id获取模版列表
   */
  static getTemplateList(params: { goodId: string }) {
    return http.get<GoodsTemplateItem[]>('/user/customMade/template/list', { params })
  }

  /**
   * 根据模版id获取模版详情
   */
  static getTemplateDetail(params: { templateId: string }) {
    return http.get<TemplateDetail>('/public/template/detail', { params })
  }

  /**
   * 收藏商品
   */
  static collectGoods(params: { goodsId: string }) {
    return http.post<string>('/user/goods/collect/add', {}, { params })
  }

  /**
   * 取消收藏商品
   */
  static cancelCollectGoods(params: { goodsId: string }) {
    return http.delete<string>('/user/goods/collect/remove', { params })
  }

  /**
   * 添加商品到购物车
   */
  static addGoodsCart(params: AddGoodsParams) {
    return http.post<string>('/user/goods/cart/add', params)
  }
}
