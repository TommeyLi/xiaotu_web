import http from '@/utils/axios'

export interface RegionOption {
  label: string
  value: string
  children?: RegionOption[]
}

export interface AddressItem {
  addressId: string
  city: string
  createTime: string
  detailAddress: string
  district: string
  isDefault: number
  nickname: string
  province: string
  receiverName: string
  receiverPhone: string
  updateTime: string
  userId: number
}

export interface AddAddressItem {
  /**
   * 城市（如“深圳市”;“上海市”）
   */
  city?: string
  /**
   * 详细地址（含街道、门牌号）
   */
  detailAddress?: string
  /**
   * 区县（如“南山区”;“浦东新区”）
   */
  district?: string
  /**
   * 省份（如“广东省”;“北京市”）
   */
  province?: string
  /**
   * 收件人姓名（1-50字符，不允许特殊符号）
   */
  receiverName?: string
  /**
   * 收件人手机号（需符合11位国内手机号格式）
   */
  receiverPhone?: string
  /**
   * 是否默认地址（0:否 1:是）
   */
  isDefault?: number
}

export class Api {
  /**
   * 查询用户所有收货地址
   */
  static getCollectedTemplateList() {
    return http.get<AddressItem[]>('/user/address/list')
  }

  /**
   * 新增地址
   */
  static addAddress(data: AddAddressItem) {
    return http.post<any>('/user/address/add', data)
  }

  /**
   * 删除地址
   */
  static deleteAddress(params: { addressId: string }) {
    return http.delete<any>('/user/address/delete', { params })
  }

  /**
   * 批量删除地址
   */
  static batchDeleteAddress(params: string[]) {
    return http.delete<any>('/user/address/batchDelete', { data: params })
  }

  /**
   * 修改地址
   */
  static updateAddress(params: { id: string } & AddAddressItem) {
    return http.post<any>('/user/address/update', params)
  }
}
