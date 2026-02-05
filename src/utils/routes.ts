import type { RouteRecordRaw } from 'vue-router'

interface Effect {
  effectId: string
  categoryId: string
  categoryName: string | null
  effectName: string
  effectDesc: string | string[]
  previewImageUrl: string
  point: string | number
  workflowId: string
  sort: number
  status: number
}

interface Category {
  categoryId: string
  categoryName: string
  sort: number
  remark: string
  createTime: string
  effectCount: number
  effects: Effect[]
}

/**
 * 将接口返回的菜单信息合并到前端静态路由配置中，同时排序生成新的路由表
 * @param frontendRoutes 前端静态路由定义
 * @param backendData 接口返回的数据
 * @returns 合并后的按后端排序和meta中添加好后端额外信息的路由表
 */
export function mergeRoutesWithApiData2Sort(
  frontendRoutes: RouteRecordRaw[],
  backendData: Category[],
): RouteRecordRaw[] {
  // 深拷贝，避免污染原始路由
  const routeClones = JSON.parse(JSON.stringify(frontendRoutes)) as RouteRecordRaw[]

  // 1️⃣ 先按后端一级 sort 排序
  const sortedCategories = [...backendData].sort((a, b) => a.sort - b.sort)

  const result: RouteRecordRaw[] = []

  for (const category of sortedCategories) {
    // 2️⃣ 找到对应的前端一级路由
    const matchedRoute = routeClones.find(
      r => r.meta?.title === category.categoryName,
    )

    if (!matchedRoute)
      continue

    // 3️⃣ 处理二级菜单
    if (Array.isArray(matchedRoute.children) && category.effects?.length) {
      const sortedEffects = [...category.effects].sort(
        (a, b) => a.sort - b.sort,
      )

      const children: RouteRecordRaw[] = []

      for (const effect of sortedEffects) {
        const matchedChild = matchedRoute.children.find(
          c => c.meta?.title === effect.effectName,
        )

        if (matchedChild) {
          // 可选：把后端 effect 挂到 meta 上
          matchedChild.meta = {
            ...matchedChild.meta,
            data: effect,
          }
          children.push(matchedChild)
        }
      }

      matchedRoute.children = children
    }

    // 可选：把后端 category 挂到 meta 上
    matchedRoute.meta = {
      ...matchedRoute.meta,
      data: category,
    }

    result.push(matchedRoute)
  }

  return result
}
