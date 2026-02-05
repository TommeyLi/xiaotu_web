import type { RouteRecordRaw } from 'vue-router'

/**
 * 在菜单树中查找匹配workflowId的路由名称
 * @param routes 路由数组
 * @param workflowId 要查找的workflowId
 * @returns 匹配的路由名称，如果没找到返回null
 */
// findRouteNameByWorkflowId
export function findRouteNameByEffectId(routes: RouteRecordRaw[], effectId: string): string | null {
  for (const route of routes) {
    // 检查当前路由的meta.data.workflowId
    if (route.meta?.data?.effectId === String(effectId)) {
      return route.name as string
    }

    // 如果有子路由，递归查找
    if (route.children && route.children.length > 0) {
      const childPath = findRouteNameByEffectId(route.children, effectId)
      if (childPath) {
        return childPath
      }
    }
  }

  return null
}

/**
 * 在菜单树中查找匹配workflowId的路由名称
 * @param routes 路由数组
 * @param workflowId 要查找的workflowId
 * @returns 匹配的路由名称，如果没找到返回null
 */
export function findRouteNameByWorkflowId(routes: RouteRecordRaw[], workflowId: string): string | null {
  for (const route of routes) {
    // 检查当前路由的meta.data.workflowId
    if (route.meta?.data?.workflowId === workflowId) {
      return route.name as string
    }

    // 如果有子路由，递归查找
    if (route.children && route.children.length > 0) {
      const childPath = findRouteNameByWorkflowId(route.children, workflowId)
      if (childPath) {
        return childPath
      }
    }
  }

  return null
}

/**
 * 在菜单树中查找匹配workflowId的完整路由信息
 * @param routes 路由数组
 * @param effectId 要查找的workflowId
 * @returns 匹配的路由信息，如果没找到返回null
 */
// findRouteInfoByWorkflowId
export function findRouteInfoByEffectId(routes: RouteRecordRaw[], effectId: string): RouteRecordRaw | null {
  for (const route of routes) {
    // 检查当前路由的meta.data.effectId
    if (route.meta?.data?.effectId === effectId) {
      return route
    }

    // 如果有子路由，递归查找
    if (route.children && route.children.length > 0) {
      const childRoute = findRouteInfoByEffectId(route.children, effectId)
      if (childRoute) {
        return childRoute
      }
    }
  }

  return null
}
