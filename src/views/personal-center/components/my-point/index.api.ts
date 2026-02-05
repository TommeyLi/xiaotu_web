import http from '@/utils/axios'

interface UserAccount {
  /**
   * 用户ID
   */
  userId: number

  /**
   * 企业ID
   */
  enterpriseId: string

  /**
   * 可用积分
   */
  points: number

  /**
   * 余额
   */
  balance: number

  /**
   * 冻结积分
   */
  frozenPoints: number

  /**
   * 冻结余额
   */
  frozenBalance: number

  /**
   * 最后更新时间，ISO 8601 格式字符串
   */
  updateTime: string // 例如: "2025-10-10T20:03:12"

  /**
   * 用户名，可能为空
   */
  userName: string | null
  /**
   * 用户昵称，可能为空
   */
  nickName: string | null
}

export interface GetFlowListParams extends ApiUtil.PaginationParams {
  enterpriseId: string
  /**
   * 流水类型（1积分2=余额，为空则查询所有类型）
   */
  assetType: number
  startTime?: string
  endTime?: string
  userId?: string
}

export interface FlowItem {
  afterAmount: number
  amount: number
  beforeAmount: number
  enterpriseId: number | string
  flowTypeName: string
  bizTypeName: string
  operatorId: number | string
  operatorName: string
  bizId: string
  bizType: number
  createTime: string
  flowId: number | string
  flowType: number
  remark: string
  userId: number | string
  userName: string
}

export interface UserItem {
  userId: string
  enterpriseId: string
  username: string
  phone: string
  nickname: string
  password: string
  salt: string
  role: number
  avatarUrl: string
  langCode: string
  lastLoginTime: string
  status: number
  isDeleted: number
  createTime: string
  updateTime: string
  balance: string
  points?: number // 用户可用兔点
}

export interface AllocateParams {
  targetUserId: string
  operateType: number
  amount: number
  remark: string
  flowType?: string
  enterpriseId?: string
}

export interface FlowTotalResponse {
  balanceExpense: number
  balanceIncome: number
  pointsExpense: number
  pointsIncome: number
}

export class Api {
  /**
   * 企业资产列表查询
   */
  static getEnterpriseList(params: { enterpriseId: string }) {
    return http.get<UserAccount[]>('/enterprise/asset/list', { params })
  }

  /**
   * 企业资产明细表
   */
  static getFlowList(params: GetFlowListParams) {
    return http.get<{
      records: FlowItem[]
      current: string
      size: string
      total: string
    }>('/enterprise/asset/flow/list', { params })
  }

  /**
   * 查询用户列表
   */
  static getUserList(params: { enterpriseId: string }) {
    return http.get<UserItem[]>('/enterprise/user/list', { params })
  }

  /**
   * 查询流水汇总（支持企业和用户）
   */
  static getFlowTotal() {
    return http.get<FlowTotalResponse>('/enterprise/asset/flow/total')
  }

  /**
   * 企业分配员工资产
   */
  static allocate(data: AllocateParams, params: { enterpriseId: string }) {
    return http.post<any>('/enterprise/asset/allocate', data, { params })
  }
}
