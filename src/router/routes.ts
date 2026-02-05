import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import brandSupernova from '@/assets/icon/brand-supernova.svg'
import photoShield from '@/assets/icon/photo-shield.svg'
import photo from '@/assets/icon/photo.svg'
import sparkles from '@/assets/icon/sparkles.svg'
import style from '@/assets/icon/style.svg'
import woman from '@/assets/icon/woman.svg'

/**
 * 首页路由名称
 */
const HOME_ROUTE_PATH = '/home'

/**
 * 登录路由名称
 */
const LOGIN_ROUTE_PATH = '/login'

/**
 * AI绘图根路径, 所有的 AI 绘图路由都会添加到这个路由下
 */
const AI_DRAW_ROUTE_NAME = 'AiDraw'

/**
 * 根路由，所有的动态路由都会添加到这个路由下
 */
const ROOT_ROUTE_NAME = 'Root'

const notFoundRoute: RouteRecordRaw = {
  path: '/:path(.*)*',
  component: () => import('@/views/demos/fallback/404.vue'),
  meta: {
    title: '404',
    titleI18nKey: 'routes.404',
  },
}

/**
 * 根路由，所有的动态路由都会添加到这个路由下
 */
const rootRoute: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROOT_ROUTE_NAME,
    redirect: HOME_ROUTE_PATH,
    component: () => import('@/components/layout/index.vue'),
    children: [
      {
        path: HOME_ROUTE_PATH,
        name: 'Home',
        component: () => import('@/views/main/index.vue'),
        // redirect: '/main',
        // children: [
        //   {
        //     path: '/main',
        //     name: 'Main',
        //     component: () => import('@/views/home/components/main/index.vue'),
        //     meta: {
        //       title: '首页',
        //       titleI18nKey: 'routes.home',
        //       icon: 'material-symbols:dashboard-outline-rounded',
        //       requiresAuth: false,
        //       hideInBreadcrumb: true,
        //     },
        //   },
        //   {
        //     path: '/image-library',
        //     name: 'ImageLibrary',
        //     component: () => import('@/views/home/components/image-library/index.vue'),
        //     meta: {
        //       title: '个人图库',
        //       titleI18nKey: 'routes.imageLibrary',
        //       requiresAuth: false,
        //     },
        //   },
        //   {
        //     path: '/drafts',
        //     name: 'Drafts',
        //     component: () => import('@/views/home/components/drafts/index.vue'),
        //     meta: {
        //       title: '草稿箱',
        //       titleI18nKey: 'routes.drafts',
        //       requiresAuth: false,
        //     },
        //   },
        // ],
        meta: {
          title: '首页',
          titleI18nKey: 'routes.home',
          icon: 'material-symbols:dashboard-outline-rounded',
          requiresAuth: false,
          hideInBreadcrumb: true,
        },
      },
      {
        path: '/ai-draw',
        name: AI_DRAW_ROUTE_NAME,
        redirect: '/basic',
        component: () => import('@/views/ai-draw/index.vue'),
        children: [],
        meta: {
          title: 'AI绘图',
          titleI18nKey: 'routes.aiDraw',
          hideInBreadcrumb: true,
        },
      },
      {
        path: '/custom-goods',
        name: 'CustomGoods',
        component: () => import('@/views/custom-goods/index.vue'),
        meta: {
          title: '定制商品',
          titleI18nKey: 'routes.customGoods',
        },
      },
      {
        path: '/goods-detail',
        name: 'GoodsDetail',
        component: () => import('@/views/custom-goods/detail/index.vue'),
        meta: {
          title: '商品详情',
          titleI18nKey: 'routes.goodsDetail',
        },
      },
      {
        path: '/custom-buy',
        name: 'CustomBuy',
        component: () => import('@/views/custom-goods/custom-buy/index.vue'),
        meta: {
          title: '定制购买',
          titleI18nKey: 'routes.customBuy',
        },
      },
      {
        path: '/shopping',
        name: 'Shopping',
        component: () => import('@/views/shopping/index.vue'),
        meta: {
          title: '购物车',
          titleI18nKey: 'routes.shopping',
        },
      },
      {
        path: '/confirm-order',
        name: 'ConfirmOrder',
        component: () => import('@/views/order-detail/confirm-order/index.vue'),
        meta: {
          title: '确认订单',
          titleI18nKey: 'routes.confirmOrder',
        },
      },
      {
        path: '/order-result',
        name: 'OrderResult',
        component: () => import('@/views/order-detail/order-result/index.vue'),
        meta: {
          title: '订单结果',
          titleI18nKey: 'routes.orderResult',
        },
      },
      {
        path: '/order-detail',
        name: 'OrderDetail',
        component: () => import('@/views/order-detail/index.vue'),
        meta: {
          title: '订单详情',
          titleI18nKey: 'routes.orderDetail',
        },
      },
      {
        path: '/personal-center',
        name: 'PersonalCenter',
        redirect: '/personal-center/my-order',
        component: () => import('@/views/personal-center/index.vue'),
        children: [
          {
            path: '/personal-center/my-order',
            name: 'MyOrder',
            component: () => import('@/views/personal-center/components/my-order/index.vue'),
            meta: {
              title: '我的订单',
              titleI18nKey: 'routes.myOrder',
            },
          },
          {
            path: '/personal-center/address-manage',
            name: 'AddressManage',
            component: () => import('@/views/personal-center/components/address-manage/index.vue'),
            meta: {
              title: '地址管理',
              titleI18nKey: 'routes.addressManage',
            },
          },
          {
            path: '/personal-center/my-collect',
            name: 'MyCollect',
            component: () => import('@/views/personal-center/components/my-collect/index.vue'),
            meta: {
              title: '我的收藏',
              titleI18nKey: 'routes.myCollect',
            },
          },
          {
            path: '/personal-center/my-draft',
            name: 'MyDraft',
            component: () => import('@/views/personal-center/components/my-draft/index.vue'),
            meta: {
              title: '我的草稿',
              titleI18nKey: 'routes.myDraft',
            },
          },
          {
            path: '/personal-center/image-library',
            name: 'ImageLibrary',
            component: () => import('@/views/personal-center/components/image-library/index.vue'),
            meta: {
              title: '个人图库',
              titleI18nKey: 'routes.imageLibrary',
              requiresAuth: false,
            },
          },
          {
            path: '/personal-center/my-point',
            name: 'MyPoint',
            component: () => import('@/views/personal-center/components/my-point/index.vue'),
            meta: {
              title: '我的兔点',
              titleI18nKey: 'routes.myPoint',
            },
          },
          {
            path: '/personal-center/my-balance',
            name: 'MyBalance',
            component: () => import('@/views/personal-center/components/my-balance/index.vue'),
            meta: {
              title: '我的余额',
              titleI18nKey: 'routes.myBalance',
            },
          },
        ],
        meta: {
          title: '个人中心',
          titleI18nKey: 'routes.personalCenter',
          hideInBreadcrumb: true,
        },
      },
    ],
    meta: {
      hideInBreadcrumb: true,
    },
  },
]

/**
 * 忽略权限的路由
 */
const ignoreAccessRoutes: RouteRecordRaw[] = [
  {
    path: '/agreement',
    component: () => import('@/components/agreement/index.vue'),
    meta: {
      title: '小兔快跑用户协议',
      titleI18nKey: 'pages.login.userAgreement',
      requiresAuth: false,
      link: true,
    },
  },
]

const aiDrawMenuRoutes = [
  {
    path: '/basic',
    name: 'Basic',
    meta: {
      title: '基础',
      icon: photo,
      titleI18nKey: 'routes.basic',
    },
    children: [
      {
        path: 'expression-optimize',
        name: 'ExpressionOptimize',
        component: '/ai-draw/basic/expression-optimize/index.vue',
        meta: {
          title: '表情优化',
          titleI18nKey: 'routes.expressionOptimize',
        },
      },
      {
        path: 'one-click-matting',
        name: 'OneClickMatting',
        component: '/ai-draw/basic/one-click-matting/index.vue',
        meta: {
          title: '一键抠图',
          titleI18nKey: 'routes.oneClickMatting',
        },
      },
      {
        path: 'local-repair',
        name: 'LocalRepair',
        component: '/ai-draw/basic/local-repair/index.vue',
        meta: {
          title: '局部修改',
          titleI18nKey: 'routes.localRepair',
        },
      },
    ],
  },
  {
    path: '/waste-film-rescue',
    name: 'WasteFilmRescue',
    meta: {
      title: '小兔精修',
      icon: photoShield,
      titleI18nKey: 'routes.WasteFilmRescue',
    },
    children: [
      {
        path: 'expression-optimize-new',
        name: 'ExpressionOptimizeNew',
        component: '/ai-draw/waste-film-rescue/expression-optimize/index.vue',
        meta: {
          title: '面部精修',
          titleI18nKey: 'routes.ImageOptimize',
        },
      },
      {
        path: 'one-click-matting-new',
        name: 'OneClickMattingNew',
        component: '/ai-draw/waste-film-rescue/one-click-matting/index.vue',
        meta: {
          title: '一键抠图',
          titleI18nKey: 'routes.oneClickMatting',
        },
      },
      {
        path: 'local-adjustment',
        name: 'LocalAdjustment',
        component: '/ai-draw/waste-film-rescue/local-adjustment/index.vue',
        meta: {
          title: '局部调整',
          titleI18nKey: 'routes.localAdjustment',
        },
      },
      {
        path: 'local-repair-new',
        name: 'LocalRepairNew',
        component: '/ai-draw/waste-film-rescue/local-repair/index.vue',
        meta: {
          title: '局部替换',
          titleI18nKey: 'routes.localRepair',
        },
      },
      {
        path: 'motion-adjustment',
        name: 'MotionAdjustment',
        component: '/ai-draw/waste-film-rescue/motion-adjustment/index.vue',
        meta: {
          title: '动作编辑',
          titleI18nKey: 'routes.motionAdjustment',
        },
      },
      {
        path: 'hd-zoom-new',
        name: 'HDZoomNew',
        component: '/ai-draw/waste-film-rescue/hd-zoom/index.vue',
        meta: {
          title: '图片高清',
          titleI18nKey: 'routes.ImageZoom',
        },
      },
    ],
  },
  {
    path: '/style',
    name: 'Style',
    meta: {
      title: '风格化',
      icon: style,
      titleI18nKey: 'routes.style',
    },
    children: [
      {
        path: 'gibli',
        name: 'Gibli',
        component: '/ai-draw/style/gibli/index.vue',
        meta: {
          title: '吉卜力',
          titleI18nKey: 'routes.gibli',
        },
      },
      {
        path: 'cartoon',
        name: 'Cartoon',
        component: '/ai-draw/style/cartoon/index.vue',
        meta: {
          title: '卡通漫画',
          titleI18nKey: 'routes.cartoon',
        },
      },
      {
        path: 'pencil-draw',
        name: 'PencilDraw',
        component: '/ai-draw/style/pencil-draw/index.vue',
        meta: {
          title: '彩色铅笔手绘',
          titleI18nKey: 'routes.pencilDraw',
        },
      },
      {
        path: 'watercolor',
        name: 'Watercolor',
        component: '/ai-draw/style/watercolor/index.vue',
        meta: {
          title: '淡水彩',
          titleI18nKey: 'routes.watercolor',
        },
      },
      {
        path: 'fashion-illustration',
        name: 'FashionIllustration',
        component: '/ai-draw/style/fashion-illustration/index.vue',
        meta: {
          title: '手绘时尚插画',
          titleI18nKey: 'routes.fashionIllustration',
        },
      },
      {
        path: 'chinese-painting',
        name: 'ChinesePainting',
        component: '/ai-draw/style/chinese-painting/index.vue',
        meta: {
          title: '国风',
          titleI18nKey: 'routes.chinesePainting',
        },
      },
      {
        path: 'oil-painting',
        name: 'OilPainting',
        component: '/ai-draw/style/oil-painting/index.vue',
        meta: {
          title: '油画',
          titleI18nKey: 'routes.oilPainting',
        },
      },
    ],
  },
  {
    path: '/photo-shoot',
    name: 'PhotoShoot',
    meta: {
      title: '小兔特效',
      titleI18nKey: 'routes.PhotoShoot',
      icon: woman,
    },
    children: [
      {
        path: 'thematic-photo-shoot',
        name: 'ThematicPhotoShoot',
        component: '/ai-draw/photo-shoot/thematic-photo-shoot/index.vue',
        meta: {
          title: '主题写真',
          titleI18nKey: 'routes.ThematicPhotoShoot',
        },
      },
      {
        path: 'action-replacement',
        name: 'ActionReplacement',
        component: '/ai-draw/photo-shoot/action-replacement/index.vue',
        meta: {
          title: '妆造+动作替换',
          titleI18nKey: 'routes.ActionReplacement',
        },
      },
      {
        path: 'scene-replacement',
        name: 'SceneReplacement',
        component: '/ai-draw/photo-shoot/scene-replacement/index.vue',
        meta: {
          title: '场景替换',
          titleI18nKey: 'routes.SceneReplacement',
        },
      },
      {
        path: 'sketch-new',
        name: 'SketchNew',
        component: '/ai-draw/photo-shoot/sketch/index.vue',
        meta: {
          title: '溶图',
          titleI18nKey: 'routes.sketch',
        },
      },
    ],
  },
  {
    path: '/effects',
    name: 'Effects',
    meta: {
      title: '特效',
      titleI18nKey: 'routes.effects',
      icon: brandSupernova,
    },
    children: [
      {
        path: 'sketch',
        name: 'Sketch',
        component: '/ai-draw/effects/sketch/index.vue',
        meta: {
          title: '溶图',
          titleI18nKey: 'routes.sketch',
        },
      },
      {
        path: 'underwater',
        name: 'Underwater',
        component: '/ai-draw/effects/underwater/index.vue',
        meta: {
          title: '水下摄影',
          titleI18nKey: 'routes.underwater',
        },
      },
    ],
  },
  {
    path: '/hd',
    name: 'HD',
    meta: {
      title: '高清放大',
      icon: sparkles,
      titleI18nKey: 'routes.hd',
    },
    children: [
      {
        path: 'hd-zoom',
        name: 'HDZoom',
        component: '/ai-draw/hd/hd-zoom/index.vue',
        meta: {
          title: '高清放大',
          titleI18nKey: 'routes.hdZoom',
        },
      },
    ],
  },
]

/**
 * 页面组件映射，后端权限模式下会使用该数据
 */
const matched = import.meta.glob('@/views/**/*.vue')
const pageMap = Object.entries(matched).reduce<Record<string, Component>>((p, [path, value]) => {
  const finalPath = `/${path.split('/').slice(3).join('/')}`
  p[finalPath] = value
  return p
}, {})

export {
  AI_DRAW_ROUTE_NAME,
  aiDrawMenuRoutes,
  HOME_ROUTE_PATH,
  ignoreAccessRoutes,
  LOGIN_ROUTE_PATH,
  notFoundRoute,
  pageMap,
  ROOT_ROUTE_NAME,
  rootRoute,
}
