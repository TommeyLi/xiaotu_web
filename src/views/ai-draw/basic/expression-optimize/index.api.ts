import type { TaskInfo } from '@/store/use-user-store'
import http from '@/utils/axios'

export interface CustomRequestParams {
  /**
   * 原图
   */
  url: string | null

  // 头部控制
  /**
   * 抬头/低头，负数抬头（-20..0），正数低头（0..20）
   */
  rotatePitch: number
  /**
   * 左转/右转，负数左转（-20..0），正数右转（0..20）
   */
  rotateYaw: number

  // 眼部控制
  /**
   * 睁眼/闭眼，睁眼0—20，闭眼-20—0（float类型）
   */
  blink: number
  /**
   * 皱眉/舒缓，皱眉0—15，舒缓-15—0（float类型）
   */
  eyebrow: number
  /**
   * 右看/左看，右看0—15，左看-15—0（float类型）
   */
  pupilX: number
  /**
   * 下看/上看，下看0—15，上看-15—0（float类型）
   */
  pupilY: number

  // 表情控制
  /**
   * 微笑/严肃，微笑0—1.3，严肃-0.3—0（float类型）
   */
  smile: number
  /**
   * 嘴巴水平调整参数（对应原eee），张大0—20，关闭-20—0（float类型）
   */
  mouthHorizontal: number
  /**
   * 嘴巴垂直闭合 (0-120)
   */
  mouthVertical: number
}

export interface SubmitParams {
  workflowId: string
  customRequest: CustomRequestParams
}

export class Api {
  /**
   * 提交任务
   */
  static submit(data: SubmitParams) {
    return http.post<string>('/image/ai/editor/submit', data)
  }

  /**
   * 查询任务状态
   */
  static getTaskProgress(params: { taskId: string }) {
    return http.get<TaskInfo>(`/image/ai/editor/status/${params.taskId}`)
  }
}
