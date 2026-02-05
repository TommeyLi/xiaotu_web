import type { AxiosResponse } from 'axios'
import type { RouteRecordRaw } from 'vue-router'
import { defineStore } from 'pinia'
import { useRequest } from 'pro-naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HOME_ROUTE_PATH } from '@/router/routes'
import http from '@/utils/axios'

export interface UserInfo {
  token: string
  roles: string[]
  codes: string[]
  nickname: string
  cartCount: number
  noticeCount: number
  enterpriseTotalPoints: number
  enterpriseTotalBalance: number
  enterpriseUnallocatedPoints: number
  enterpriseUnallocatedBalance: number
  points: number
  balance: number
  avatarUrl: string
  phone: string
  role: number | null
  enterpriseId: string | null
  enterpriseName: string
}

export interface TaskInfo {
  bizId: string
  bizName: string
  workflowId?: string
  url: string
  imgUrl: string
  coverImageUrl: string
  resultUrl: string
  createTime: string
  enterpriseId: number
  failReason: string
  request: string
  progress: number
  status: number
  statusName: string
  taskId: number
  taskName: string
  taskType: number
  taskTypeName: string
  updateTime: string
  userId: number
  userName: string | null
}

export interface TaskInfoALL {
  list: TaskInfo[]
  pageNum: number
  pageSize: number
  total: string
  totalPages: number
}

export interface UserLoginPayload {
  username: string
  password: string
  [x: string]: any
}

export const useUserStore = defineStore('user', () => {
  const route = useRoute()
  const router = useRouter()
  const loading = ref(false)
  const showLoginModal = ref(false)
  const routes = ref<RouteRecordRaw[]>([]) // 当前角色拥有的路由，Admin 中根据此数据生成菜单
  const pengdingTaskList = ref<TaskInfo[]>([]) // 进行中任务列表

  const user = ref<UserInfo>({
    roles: [],
    codes: [],
    points: 0,
    phone: '',
    balance: 0,
    role: null,
    nickname: '',
    cartCount: 0,
    avatarUrl: '',
    noticeCount: 0,
    enterpriseId: null,
    enterpriseName: '',
    enterpriseTotalPoints: 0,
    enterpriseTotalBalance: 0,
    enterpriseUnallocatedBalance: 0,
    enterpriseUnallocatedPoints: 0,
    token: localStorage.getItem('token') ?? '',
  })

  const {
    run: runGetPengdingTask,
    cancel: cancelGetPengdingTask,
  } = useRequest<AxiosResponse<TaskInfoALL, any>, any[]>(async () => {
    const result = await Api.getPengdingTask({ pageNum: 1, pageSize: 50 })
    return result
  }, {
    manual: true,
    pollingInterval: 10000,
    pollingWhenHidden: false,
    onSuccess: (data) => {
      pengdingTaskList.value = data.data.list.map((item) => {
        const request = JSON.parse(item.request || '{}')
        return {
          ...item,
          request,
          url: request.customRequest?.url ? request.customRequest?.url.split(',')[0] : '',
          imgUrl: request?.imgUrl ? request?.imgUrl.split(',')[0] : '',
        }
      })
      return data
    },
    onError: (error) => {
      throw error
    },
  })

  async function fetchUpdateUserInfo() {
    try {
      const data = await Api.queryUserInfo()
      user.value = {
        ...user.value,
        ...data.data,
      }
      return user.value
    }
    catch (error) {
      console.log(error)
      logout()
      return user.value
    }
  }

  async function login(payload: UserLoginPayload) {
    try {
      loading.value = true
      const res = await Api.login(payload)
      const token = (user.value.token = res.data.token)
      localStorage.setItem('token', token)
      const info = await fetchUpdateUserInfo()
      showLoginModal.value = false
      const redirect = (route.query.redirect as string) ?? HOME_ROUTE_PATH
      await router.push(redirect)
      runGetPengdingTask()
      return info
    }
    finally {
      loading.value = false
    }
  }

  function logout() {
    cancelGetPengdingTask()
    user.value = {
      roles: [],
      codes: [],
      points: 0,
      phone: '',
      token: '',
      balance: 0,
      role: null,
      nickname: '',
      cartCount: 0,
      avatarUrl: '',
      noticeCount: 0,
      enterpriseId: null,
      enterpriseName: '',
      enterpriseTotalPoints: 0,
      enterpriseTotalBalance: 0,
      enterpriseUnallocatedBalance: 0,
      enterpriseUnallocatedPoints: 0,
    }
    localStorage.removeItem('token')
  }

  async function logoutWithQueryRedirect() {
    logout()
    await router.push({
      path: HOME_ROUTE_PATH,
      query: {
        redirect: route.fullPath,
      },
    })
  }

  return {
    runGetPengdingTask,
    login,
    logout,
    routes,
    showLoginModal,
    pengdingTaskList,
    fetchUpdateUserInfo,
    loginLoading: loading,
    logoutWithQueryRedirect,
    user: computed(() => user.value),
    isLogined: computed(() => !!user.value.token),
  }
})

class Api {
  static login(payload: UserLoginPayload) {
    return http<{ token: string }>({
      url: '/user/login',
      method: 'post',
      data: payload,
    })
  }

  static queryUserInfo() {
    return http<Omit<UserInfo, 'token'>>({
      url: '/user/getInfo',
      method: 'get',
    })
  }

  /**
   * 查询进行中得任务
   */
  static getPengdingTask(params: { status?: number, taskType?: number, pageNum: number, pageSize: number }) {
    return http.get<TaskInfoALL>('/image/ai/editor/list/ongoing', { params })
  }
}
