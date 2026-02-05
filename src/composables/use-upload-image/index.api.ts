import http from '@/utils/axios'

export interface updateImageResultBody {
  /**
   * 图片格式
   */
  imageFormat?: string
  /**
   * 图片名称
   */
  imageName?: string
  /**
   * 图片大小（字节）
   */
  imageSize?: number
  /**
   * 图片访问地址
   */
  imageUrl?: string
}

export class Api {
  /**
   * 获取预签名 URL
   */
  static queryPreSignedUrl() {
    return http({
      url: '/cos/tempSecret',
      method: 'post',
    })
  }

  /**
   * 更新图片结果
   */
  static updateImageResult(data: updateImageResultBody[]) {
    return http({
      url: '/cos/updateImageResult',
      method: 'post',
      data,
    })
  }
}
