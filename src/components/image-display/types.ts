export const GenerateStatusEnum = {
  IDLE: 'idle',
  GENERATING: 'generating',
  FAILED: 'failed',
  FINISHED: 'finished',
} as const

// 0=待处理/1=处理中/2=成功/3=失败
export const TaskStatusEnum = {
  WAIT: 0,
  PENGDING: 1,
  SUCCESS: 2,
  FAILED: 3,
} as const

export type GenerateStatus
  = (typeof GenerateStatusEnum)[keyof typeof GenerateStatusEnum]
