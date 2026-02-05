import http from '@/utils/axios'

export class Api {
  /**
   * 查询特效列表
   */
  static getEffectList(params: { id: number, dictIds?: string[] }) {
    return http.get('/public/ai/effect/style/list', {
      params,
      paramsSerializer: {
        serialize(p) {
          const usp = new URLSearchParams()
          Object.entries(p || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => {
                if (v !== undefined && v !== null)
                  usp.append(key, String(v))
              })
            }
            else if (value !== undefined && value !== null) {
              usp.append(key, String(value))
            }
          })
          return usp.toString()
        },
      },
    })
  }

  /**
   * 查询特效列表v2
   */
  static getEffectListv2(params: { id: number, dictIds?: string[] }) {
    return http.get('/public/ai/effect/style/list/v2', {
      params,
      paramsSerializer: {
        serialize(p) {
          const usp = new URLSearchParams()
          Object.entries(p || {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => {
                if (v !== undefined && v !== null)
                  usp.append(key, String(v))
              })
            }
            else if (value !== undefined && value !== null) {
              usp.append(key, String(value))
            }
          })
          return usp.toString()
        },
      },
    })
  }

  /**
   * 筛选项数据
   */
  static getFilterOptions(params: { id: number }) {
    return http.get('/public/ai/effect/style/filter', {
      params,
    })
  }

  /**
   * 通过特效id获取特效风格详情
   */
  static getStyleDetail(params: { styleId: number }) {
    return http.get('/public/ai/effect/style/detail', {
      params,
    })
  }
}
