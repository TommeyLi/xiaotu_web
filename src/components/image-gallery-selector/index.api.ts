import http from '@/utils/axios'

export interface UserImageLibraryParams {
  pageNum: number
  pageSize: number
  sourceType: number // 图片来源类型（1=用户上传/2=AI生成）
  imageName?: string // 图片名称（模糊搜索）
  orderBy?: string // 排序字段（如createTime、imageName）
  orderDirection?: string // 排序方向（asc=升序/desc=降序）
}

export interface UserImageLibraryVo {
  records: UserImageLibraryVo[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * UserImageLibraryVo，用户图片图库VO
 */
export interface UserImageLibraryVo {
  /**
   * 关联业务ID（如AI生成记录ID、草稿ID，对应t_user_image_library.biz_id）
   */
  bizId: string
  /**
   * 业务关联名称（冗余字段，如bizType=1时为“AI生成记录”，bizType=2时为“定制草稿”）
   */
  bizName: string
  /**
   * 关联业务类型（1=AI生成/2=定制草稿/3=纯上传，对应t_user_image_library.biz_type）
   */
  bizType: number
  /**
   * 图片创建时间（对应t_user_image_library.create_time）
   */
  createTime: Date
  /**
   * 图片格式（对应t_user_image_library.image_format）
   */
  imageFormat: string
  /**
   * 图片ID（对应t_user_image_library.id）
   */
  imageId: number
  /**
   * 图片名称（对应t_user_image_library.image_name）
   */
  imageName: string
  /**
   * 图片大小（单位：KB，转换自t_user_image_library.image_size，1KB=1024字节）
   */
  imageSizeKb: number
  /**
   * 图片OSS原地址（对应t_user_image_library.image_url）
   */
  imageUrl: string
  /**
   * 图片来源（1=用户上传/2=AI生成，对应t_user_image_library.source_type）
   */
  sourceType: number
  /**
   * 来源名称（冗余字段，1=“用户上传”/2=“AI生成”）
   */
  sourceTypeName: string
  /**
   * 图片缩略图OSS地址（对应t_user_image_library.thumbnail_url）
   */
  thumbnailUrl: string
  /**
   * 用户ID（对应t_user_image_library.user_id）
   */
  userId: number
}

export class Api {
  /**
   * 查询个人图库
   */
  static getLibraryList(params: UserImageLibraryParams) {
    return http.get<UserImageLibraryVo>('/user/image/library/list', { params })
  }

  /**
   * 下载图片
   */
  static download(params: { imageUrl: string }) {
    return http.get('/cos/download', { params, responseType: 'blob' })
  }

  /**
   * 删除单个图片
   */
  static deleteImage(imageId: number) {
    return http.delete(`/user/image/library/delete`, { params: { imageId } })
  }

  /**
   * 批量删除图片
   */
  static batchDeleteImages(data: number[]) {
    return http.delete('/user/image/library/batchDelete', { data })
  }

  /**
   * 修改图片名称
   */
  static updateLibraryName(params: { imageId: number, newName: string }) {
    return http.put('/user/image/library/updateName', {}, { params })
  }
}
