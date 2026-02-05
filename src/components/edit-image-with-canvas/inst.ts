export interface EditImageWithCanvasInst {
  /**
   * 获取画布内容到 url（透明背景和黑白图片）
   */
  getCanvasAlaphaUrl: () => Promise<{ alaphaUrl: string, blackWhiteUrl: string }>
  /**
   * 清空画布
   */
  clear: () => void
}
