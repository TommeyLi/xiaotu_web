import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import { buildCURDRoutes } from './utils/curd'
import { database } from './utils/database'

const users = [
  {
    username: '15311419356',
    password: 'e10adc3949ba59abbe56e057f20f883e',
    token:
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzdXBlciIsImV4cCI6MTczMjI0MzYyNn0.super',
    roles: ['super'],
    name: 'Super',
    codes: ['1001', '1002', '1003', '1004'],
    menus: [
      {
        path: '/basic',
        name: 'Basic',
        meta: {
          title: '基础',
          icon: 'material-symbols:build-outline',
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
              title: '局部修补',
              titleI18nKey: 'routes.localRepair',
            },
          },
        ],
      },
      {
        path: '/style',
        name: 'Style',
        meta: {
          title: '风格化',
          icon: 'material-symbols:palette-outline',
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
              title: '国画',
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
        path: '/effects',
        name: 'Effects',
        meta: {
          title: '特效',
          titleI18nKey: 'routes.effects',
          icon: 'material-symbols:build-outline',
        },
        children: [
          {
            path: 'sketch',
            name: 'Sketch',
            component: '/ai-draw/effects/sketch/index.vue',
            meta: {
              title: '涂图',
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
          icon: 'material-symbols:zoom-in',
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
    ],
  },
  {
    username: 'admin',
    password: '123456',
    token:
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTczMjI0MzYyNn0.admin',
    roles: ['admin'],
    name: 'Admin',
    codes: ['1003'],
    menus: [
      {
        path: '/basic',
        name: 'Basic',
        meta: {
          title: '基础',
          icon: 'material-symbols:build-outline',
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
              title: '局部修补',
              titleI18nKey: 'routes.localRepair',
            },
          },
        ],
      },
      {
        path: '/style',
        name: 'Style',
        meta: {
          title: '风格化',
          icon: 'material-symbols:palette-outline',
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
              title: '国画',
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
        path: '/effects',
        name: 'Effects',
        meta: {
          title: '特效',
          titleI18nKey: 'routes.effects',
        },
        children: [
          {
            path: 'sketch',
            name: 'Sketch',
            component: '/ai-draw/effects/sketch/index.vue',
            meta: {
              title: '涂图',
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
          icon: 'material-symbols:zoom-in',
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
    ],
  },
  {
    username: 'user',
    password: '123456',
    token:
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzMyMjQzNjI2fQ.user',
    roles: ['user'],
    name: 'User',
    codes: [],
    menus: [
      {
        path: '/basic',
        name: 'Basic',
        meta: {
          title: '基础',
          icon: 'material-symbols:build-outline',
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
              title: '局部修补',
              titleI18nKey: 'routes.localRepair',
            },
          },
        ],
      },
      {
        path: '/style',
        name: 'Style',
        meta: {
          title: '风格化',
          icon: 'material-symbols:palette-outline',
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
              title: '国画',
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
        path: '/effects',
        name: 'Effects',
        meta: {
          title: '特效',
          titleI18nKey: 'routes.effects',
        },
        children: [
          {
            path: 'sketch',
            name: 'Sketch',
            component: '/ai-draw/effects/sketch/index.vue',
            meta: {
              title: '涂图',
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
          icon: 'material-symbols:zoom-in',
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
    ],
  },
]

function createSuccessResponse(data: any) {
  return {
    data,
    code: 200,
    message: 'success',
  }
}

function createErrorResponse(message: string) {
  return {
    message,
    code: 201,
    data: null,
  }
}

function isInvalidToken(token: string) {
  return !token || !users.some(user => user.token === token)
}

const systemRoleRoutes = buildCURDRoutes('/system/role', database.role)
const systemUserRoutes = buildCURDRoutes('/system/user', database.user)
const systemMenuRoutes = buildCURDRoutes('/system/menu', database.menu)

export default defineFakeRoute([
  ...systemRoleRoutes,
  ...systemUserRoutes,
  ...systemMenuRoutes,
  {
    url: '/user/login',
    method: 'post',
    response: ({ body }) => {
      console.log(body)
      const user = users.find(user => user.username === body.username)
      if (!user) {
        return createErrorResponse('用户名或密码错误')
      }
      return createSuccessResponse({ token: user.token })
    },
  },
  {
    url: '/user/getInfo',
    method: 'get',
    response: ({ headers }) => {
      const token = (headers.authorization ?? '').slice(7)
      if (isInvalidToken(token)) {
        return createErrorResponse('token 无效')
      }
      const user = users.find(user => user.token === token)
      if (!user) {
        return createErrorResponse('用户名或密码错误')
      }
      return createSuccessResponse({
        nickname: '张三',
        cartCount: 3,
        noticeCount: 2,
        points: 500,
        balance: 199.99,
        avatarUrl: 'https://oss.xiaotu.com/avatar/1001.jpg',
        phone: '138****8000',
        role: 2,
        enterpriseId: 2001,
        enterpriseName: '小兔科技',
      })
    },
  },
  {
    url: '/public/banner/list',
    method: 'get',
    response: () => {
      return createSuccessResponse([
        {
          bannerImageUrl: 'https://5lrorwxhlpmkiik.ldycdn.com/cloud/iqBqmKqoRilSnqipqmkp/banner1.png',
          bannerText: 'AI绘图',
          bannerSubText: '多种风格可供选择',
          sort: 1,
        },
        {
          bannerImageUrl: 'https://pics5.baidu.com/feed/b7003af33a87e950f93b74112274fd4cfbf2b47f.jpeg@f_auto?token=c11d9d2b0cdeff8debbaacf71a371c02',
          bannerText: '定制商品',
          bannerSubText: '导入图片，AI即时生成相关产品',
          sort: 1,
        },
      ])
    },
  },
  {
    url: '/public/goods/category/list',
    method: 'get',
    response: () => {
      return createSuccessResponse([
        {
          categoryId: 5,
          categoryName: '智能手机',
          sort: 5,
          remark: '包含各种品牌的智能手机及配件',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 1,
          categoryName: '男装',
          sort: 10,
          remark: '包含衬衫、裤子、外套等男性服饰',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 6,
          categoryName: '电脑设备',
          sort: 15,
          remark: '笔记本电脑、台式机、平板电脑等',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 2,
          categoryName: '女装',
          sort: 20,
          remark: '包含连衣裙、T恤、裙子等女性服饰',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 7,
          categoryName: '智能穿戴',
          sort: 25,
          remark: '智能手表、手环、耳机等可穿戴设备',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 3,
          categoryName: '童装',
          sort: 30,
          remark: '适合0-12岁儿童的服装',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 8,
          categoryName: '家居家纺',
          sort: 35,
          remark: '床上用品、窗帘、毛巾等家居用品',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 4,
          categoryName: '内衣配饰',
          sort: 40,
          remark: '内衣、袜子、围巾等配饰类商品',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
        {
          categoryId: 9,
          categoryName: '厨房用具',
          sort: 45,
          remark: '锅碗瓢盆、小家电等厨房相关商品',
          createTime: '2025-09-13T22:50:04',
          goodsCount: 0,
        },
      ])
    },
  },
  {
    url: '/public/goods/list',
    method: 'get',
    response: () => {
      return createSuccessResponse([
        {
          goodsId: 11,
          categoryId: 1,
          categoryName: '男装',
          goodsCode: 'GOODS20250913129557',
          goodsName: '商务纯棉衬衫',
          goodsDesc: '抗皱免烫，修身版型，适合职场通勤',
          mainImageUrl: 'https://picsum.photos/id/1005/800/800',
          imageUrls: [
            'https://picsum.photos/id/1006/800/800',
            'https://picsum.photos/id/1010/800/800',
          ],
          basePrice: 299.00,
          colorOptions: [{ color: '白色', colorCode: '#FFFFFF' }, { color: '蓝色', colorCode: '#0000FF' }],
          colorOptionList: [
            {
              color: '白色',
              colorCode: '#FFFFFF',
            },
            {
              color: '蓝色',
              colorCode: '#0000FF',
            },
          ],
          sizeOptions: [{ size: 'S', desc: '小码' }, { size: 'M', desc: '中码' }, { size: 'L', desc: '大码' }],
          sizeOptionList: [
            {
              size: 'S',
              desc: '小码',
            },
            {
              size: 'M',
              desc: '中码',
            },
            {
              size: 'L',
              desc: '大码',
            },
          ],
          discountRule: { type: '满减', rules: [{ threshold: 500, discount: 50 }] },
          discountRuleDesc: '优惠规则已设置',
          status: 1,
          statusName: '已上架',
          sort: 10,
          createTime: '2025-09-13T22:54:11',
          updateTime: '2025-09-13T22:54:11',
        },
        {
          goodsId: 12,
          categoryId: 1,
          categoryName: '男装',
          goodsCode: 'GOODS20250913263077',
          goodsName: '休闲牛仔裤',
          goodsDesc: '弹力面料，直筒设计，百搭款式',
          mainImageUrl: 'https://picsum.photos/id/1074/800/800',
          imageUrls: [
            'https://picsum.photos/id/1075/800/800',
          ],
          basePrice: 329.00,
          colorOptions: [{ color: '深蓝色', colorCode: '#00008B' }, { color: '黑色', colorCode: '#000000' }],
          colorOptionList: [
            {
              color: '深蓝色',
              colorCode: '#00008B',
            },
            {
              color: '黑色',
              colorCode: '#000000',
            },
          ],
          sizeOptions: [{ size: '28', desc: '腰围28英寸' }, { size: '29', desc: '腰围29英寸' }, { size: '30', desc: '腰围30英寸' }],
          sizeOptionList: [
            {
              size: '28',
              desc: '腰围28英寸',
            },
            {
              size: '29',
              desc: '腰围29英寸',
            },
            {
              size: '30',
              desc: '腰围30英寸',
            },
          ],
          discountRule: '{}',
          discountRuleDesc: '优惠规则已设置',
          status: 1,
          statusName: '已上架',
          sort: 20,
          createTime: '2025-09-13T22:54:11',
          updateTime: '2025-09-13T22:54:11',
        },
      ])
    },
  },
  {
    url: '/public/ai/category/list',
    method: 'get',
    response: ({ headers }) => {
      const token = (headers.authorization ?? '').slice(7)
      if (isInvalidToken(token)) {
        return createErrorResponse('token 无效')
      }
      return createSuccessResponse([
        {
          categoryId: 1,
          categoryName: '基础功能',
          sort: 1,
          remark: '包含表情优化、抠图、修补等基础AI功能',
          createTime: '2025-09-13T18:38:11',
          effectCount: 0,
          effects: [
            {
              effectId: 18,
              categoryId: 1,
              categoryName: null,
              effectName: '水下摄影',
              effectDesc: '一键将原图转换为水下摄影风格，建议使用白色背景图效果更佳',
              previewImageUrl: 'https://oss-example.com/preview/underwater.jpg',
              point: 1,
              workflowId: '1964241282719694850',
              sort: 1,
              status: 1,
            },
            {
              effectId: 19,
              categoryId: 1,
              categoryName: null,
              effectName: '吉卜力风格',
              effectDesc: '还原吉卜力工作室动画质感，将原图转换为手绘动画风格',
              previewImageUrl: 'https://oss-example.com/preview/ghibli.jpg',
              point: 5,
              workflowId: '1964556154326106113',
              sort: 2,
              status: 1,
            },
            {
              effectId: 20,
              categoryId: 1,
              categoryName: null,
              effectName: '淡水彩',
              effectDesc: '以淡彩水彩笔触重构原图，色彩柔和通透',
              previewImageUrl: 'https://oss-example.com/preview/watercolor.jpg',
              point: 1,
              workflowId: '1964545521945858050',
              sort: 3,
              status: 1,
            },
            {
              effectId: 21,
              categoryId: 1,
              categoryName: null,
              effectName: '手绘卡通',
              effectDesc: '将原图转换为Q版手绘卡通风格，线条简洁生动',
              previewImageUrl: 'https://oss-example.com/preview/cartoon.jpg',
              point: 2,
              workflowId: '1964580745543077890',
              sort: 4,
              status: 1,
            },
            {
              effectId: 22,
              categoryId: 1,
              categoryName: null,
              effectName: '彩铅风格',
              effectDesc: '模拟彩铅绘画质感，细节丰富且富有层次感',
              previewImageUrl: 'https://oss-example.com/preview/colored-pencil.jpg',
              point: 2,
              workflowId: '1964584753322147841',
              sort: 5,
              status: 1,
            },
            {
              effectId: 23,
              categoryId: 1,
              categoryName: null,
              effectName: '手绘时尚插画',
              effectDesc: '融合时尚设计元素，将原图转换为高端手绘插画风格',
              previewImageUrl: 'https://oss-example.com/preview/fashion-illustration.jpg',
              point: 2,
              workflowId: '1964587060856242177',
              sort: 6,
              status: 1,
            },
            {
              effectId: 24,
              categoryId: 1,
              categoryName: null,
              effectName: '国风',
              effectDesc: '提取传统国风元素（如水墨、工笔），重构原图风格',
              previewImageUrl: 'https://oss-example.com/preview/chinese-style.jpg',
              point: 2,
              workflowId: '1964588333903040514',
              sort: 7,
              status: 1,
            },
            {
              effectId: 25,
              categoryId: 1,
              categoryName: null,
              effectName: '油画',
              effectDesc: '模拟经典油画笔触与色彩肌理，质感厚重饱满',
              previewImageUrl: 'https://oss-example.com/preview/oil-painting.jpg',
              point: 2,
              workflowId: '1964590628837408770',
              sort: 8,
              status: 1,
            },
          ],
        },
        {
          categoryId: 2,
          categoryName: '风格化',
          sort: 2,
          remark: '包含吉卜力、卡通漫画等风格化AI效果',
          createTime: '2025-09-13T18:38:11',
          effectCount: 0,
          effects: [
            {
              effectId: 26,
              categoryId: 2,
              categoryName: null,
              effectName: '去背景-透明背景图',
              effectDesc: '智能识别主体并移除背景，生成透明背景图',
              previewImageUrl: 'https://oss-example.com/preview/remove-bg-transparent.jpg',
              point: 2,
              workflowId: '1964592016929771522',
              sort: 9,
              status: 1,
            },
            {
              effectId: 27,
              categoryId: 2,
              categoryName: null,
              effectName: '去背景-白色背景',
              effectDesc: '智能识别主体并移除背景，生成白色背景图',
              previewImageUrl: 'https://oss-example.com/preview/remove-bg-white.jpg',
              point: 2,
              workflowId: '1964606168800874497',
              sort: 10,
              status: 1,
            },
          ],
        },
        {
          categoryId: 3,
          categoryName: '特效',
          sort: 3,
          remark: '包含溶图、水下摄影等特效，其中溶图为核心特效',
          createTime: '2025-09-13T18:38:11',
          effectCount: 0,
          effects: [
            {
              effectId: 28,
              categoryId: 3,
              categoryName: null,
              effectName: '图片高清放大',
              effectDesc: '支持2K/4K分辨率放大，保持图片清晰度',
              previewImageUrl: 'https://oss-example.com/preview/hd-zoom.jpg',
              point: 2,
              workflowId: '1964608298815246338',
              sort: 11,
              status: 1,
            },
            {
              effectId: 29,
              categoryId: 3,
              categoryName: null,
              effectName: '表情调节',
              effectDesc: '支持抬头/低头、睁眼/闭眼、微笑等多维度表情调整',
              previewImageUrl: 'https://oss-example.com/preview/expression-adjust.jpg',
              point: 2,
              workflowId: '1964615821463011330',
              sort: 12,
              status: 1,
            },
            {
              effectId: 30,
              categoryId: 3,
              categoryName: null,
              effectName: '局部修改',
              effectDesc: '通过模板图（黑底白区）指定重绘区域，结合参考图调整风格',
              previewImageUrl: 'https://oss-example.com/preview/local-modify.jpg',
              point: 0,
              workflowId: '1964634741150466049',
              sort: 13,
              status: 1,
            },
          ],
        },
        {
          categoryId: 4,
          categoryName: '高清放大',
          sort: 4,
          remark: '包含2K、4K等图片高清放大功能',
          createTime: '2025-09-13T18:38:11',
          effectCount: 0,
          effects: [],
        },
      ])
    },
  },
])
