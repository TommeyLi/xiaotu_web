export interface AiEffectVo {
  /**
   * 所属分类ID（对应t_ai_effect.category_id）
   */
  categoryId: number
  /**
   * 分类名称（关联t_ai_effect_category.category_name，冗余字段）
   */
  categoryName: string
  /**
   * 特效描述（对应t_ai_effect.effect_desc）
   */
  effectDesc: string
  /**
   * 特效ID（对应t_ai_effect.id）
   */
  effectId: number
  /**
   * 特效名称（对应t_ai_effect.effect_name）
   */
  effectName: string
  /**
   * 消耗点数
   */
  point: number
  /**
   * 参考图OSS地址（对应t_ai_effect.preview_image_url）
   */
  previewImageUrl: string
  /**
   * 排序（同分类内排序，对应t_ai_effect.sort）
   */
  sort: number
  /**
   * 特效状态（0=禁用/1=启用，对应t_ai_effect.status）
   */
  status: number
  /**
   * workflowId（AI特效流水ID）
   */
  workflowId: string
}
