<script setup lang="tsx">
// import type { ScrollbarInst } from 'naive-ui'
import type { Goods } from './index.api'
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import footerBox from '@/components/footer/index.vue'
import { useProRequest } from '@/composables/use-pro-request'
// import { $t } from '@/locales/locales'
import { Api } from './index.api'

const route = useRoute()
const router = useRouter()
// const scrollbarRef = useTemplateRef<ScrollbarInst>('scrollbarRef')

const activeTab = ref<string>('')
// 面包屑
const breadcrumb = ref<any>([
  {
    name: '首页',
    path: '/',
  },
  {
    name: '小兔文创商城',
    path: '/',
  },
])
const isCategorySticky = ref(false)
const HEADER_BOTTOM_PX = 89
const goodaContentRef = useTemplateRef<HTMLElement>('goodaContentRef')
// 商品总数
const totalGoods = ref(0)
// 当前页码
const page = ref(1)
// 每页显示数量
const pageSize = ref(32)
// 总页数
const totalPages = ref(0)

function handleScroll() {
  const el = goodaContentRef.value
  if (!el)
    return
  const rect = el.getBoundingClientRect()
  isCategorySticky.value = rect.top <= HEADER_BOTTOM_PX
}

function openDetailPage(product: Goods) {
  router.push({
    path: '/goods-detail',
    query: {
      id: product.goodsId,
      categoryId: activeTab.value,
    },
  })
}

const {
  data: goodsList,
  loading: goodsListLoading,
  runAsync: runGetGoodsList,
} = useProRequest(
  async (params: ApiUtil.WithPaginationParams<{ categoryId: string }>) => {
    const result = await Api.getGoodsList(params)
    totalGoods.value = result.data.total
    if (result.data.total && pageSize.value) {
      totalPages.value = Math.ceil(result.data.total / pageSize.value)
    }
    return (result.data.records ?? []).sort((a, b) => a.sort - b.sort)
  },
  {
    manual: true,
  },
)

const {
  data: categoryInfoList,
  loading: categoryInfoLoading,
  runAsync: runGetCategoryList,
} = useProRequest(
  async () => {
    const result = await Api.getCategoryList()
    return (result.data ?? []).sort((a, b) => a.sort - b.sort)
  },
  {
    onSuccess(data) {
      if (data.length > 0) {
        if (route.query.categoryId) {
          activeTab.value = route.query.categoryId as string
          runGetGoodsList({
            categoryId: activeTab.value,
            pageNum: page.value,
            pageSize: pageSize.value,
          })
        }
        else {
          activeTab.value = data[0].categoryId
          runGetGoodsList({
            categoryId: data[0].categoryId,
            pageNum: page.value,
            pageSize: pageSize.value,
          })
        }
      }
    },
    manual: true,
  },
)

// 监听页码变化
watch(page, (newPage) => {
  console.log('newPage', newPage)
  if (activeTab.value) {
    // 当页码变化时重新获取数据
    runGetGoodsList({
      categoryId: activeTab.value,
      pageNum: newPage,
      pageSize: pageSize.value,
    })
  }
})

async function handleTabChange(categoryId: string) {
  activeTab.value = categoryId
  page.value = 1
  await runGetGoodsList({
    categoryId,
    pageNum: page.value,
    pageSize: pageSize.value,
  })
}

// 添加购物车
// async function addCart(good: Goods) {
//   console.log(good)
// }

// 添加收藏
// async function addCollect(good: Goods) {
//   console.log(good)
// }

onMounted(async () => {
  await runGetCategoryList()
  document.querySelector('.n-pro-layout__content')?.addEventListener('scroll', handleScroll)
  setTimeout(handleScroll, 100)
})

onUnmounted(() => {
  // 移除滚动监听
  document.querySelector('.n-pro-layout__content')?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="h-[calc(var(--design-vh)-78px-16px)] content-box">
    <div class="content">
      <div class="breadcrumb-box">
        <div
          v-for="(item, index) in breadcrumb"
          :key="item.path"
          class="breadcrumb-item"
        >
          <div
            class="breadcrumb-item-name"
            :class="index === breadcrumb.length - 1 ? 'breadcrumb-item-last' : ''"
            @click="breadcrumb.length - 1 !== index ? router.push({ path: '/' }) : ''"
          >
            {{ item.name }}
          </div>
          <div
            v-if="breadcrumb.length - 1 !== index"
            class="separator"
          >
            /
          </div>
        </div>
      </div>
      <div class="headline-box">
        <div class="headline">
          创意商品库
        </div>
        <div class="subhead">
          甄选 AI 设计的创意周边，让艺术融入生活
        </div>
      </div>
      <div
        ref="goodaContentRef"
        class="good-content"
      >
        <div class="content-left">
          <div
            class="category-box"
            :class="{ 'category-box--sticky': isCategorySticky }"
          >
            <div class="category-title">
              分类
            </div>
            <div class="category-list">
              <div
                v-for="category in categoryInfoList"
                :key="category.categoryId"
                class="category-item"
                :class="{
                  'category-item--active': activeTab === category.categoryId,
                }"
                @click="handleTabChange(category.categoryId)"
              >
                {{ category.categoryName }}
              </div>
            </div>
          </div>
        </div>
        <div
          v-loading="goodsListLoading"
          class="content-right"
        >
          <div class="total-box">
            共找到 <span class="total-num">{{ totalGoods }}</span> 个产品
          </div>
          <div class="goods-list">
            <div
              v-for="(goods, index) in goodsList"
              :key="goods.goodsId"
              class="goods-item"
              @click="openDetailPage(goods)"
            >
              <div class="goods-img-box">
                <img
                  :src="`${goods.coverImg}?imageMogr2/thumbnail/504x504`"
                  :alt="goods.goodsName"
                  class="goods-img"
                >
                <div
                  v-show="index === 0 || index === 3 || index === 4"
                  class="tag"
                >
                  热销
                </div>
                <div
                  v-show="index === 1 || index === 2"
                  class="tag"
                >
                  新品
                </div>
                <!-- <div class="function-box">
                  <div
                    class="function-btn addCart"
                    @click.stop="addCart(goods)"
                  >
                    <img
                      class="icon"
                      src="@/assets/icon/addCart.svg"
                    >
                  </div>
                  <div
                    class="function-btn collect"
                    @click.stop="addCollect(goods)"
                  >
                    <img
                      class="icon"
                      src="@/assets/icon/collect.svg"
                    >
                  </div>
                </div> -->
              </div>
              <div class="goods-name">
                {{ goods.goodsName }}
              </div>
              <div class="goods-price-box">
                <div class="goods-price">
                  <span class="goods-price-symbol">¥</span>
                  {{ goods.realPrice ? goods.realPrice / 100 : 0 }}
                </div>
                <!-- <div class="goods-sale-num">
                  {{ Math.floor(Math.random() * 31) + 85 }}人付款
                </div> -->
              </div>
            </div>
            <div
              v-if="totalGoods < 1 && !goodsListLoading && !categoryInfoLoading"
              class="w-full min-h-200px h-[calc(100%-150px-28px)] flex items-center justify-center"
            >
              <img
                src="@/assets/images/data-null.png"
                class="w-240px"
              >
            </div>
          </div>
          <div
            v-show="totalGoods > 32"
            class="pagination-box"
          >
            <n-pagination
              v-model:page="page"
              :page-count="totalPages"
              :page-slot="5"
            />
          </div>
        </div>
      </div>
      <footer-box />
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-box {
  padding: 0 6.25rem;
  max-width: 132.5rem;
  min-width: 80rem;
  box-sizing: border-box;
  margin: auto;
  .content {
    width: 100%;
    height: 100%;
    padding: 2rem 3rem 0;
    box-sizing: border-box;
  }
}
.breadcrumb-box {
  width: 100%;
  height: 1.2188rem;
  display: flex;
  align-items: center;
  .breadcrumb-item {
    display: flex;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: bold;
    color: #9ca3af;
    .breadcrumb-item-name {
      cursor: pointer;
    }
    .breadcrumb-item-name:hover {
      color: #111111;
    }
    .breadcrumb-item-last {
      cursor: default;
      color: #111111;
    }
    .separator {
      margin: 0 0.5rem;
    }
  }
}
.headline-box {
  margin: 1.4688rem 0 3rem;
  font-family: 'Inter', sans-serif;
  .headline {
    margin-bottom: 0.5313rem;
    font-size: 2rem;
    font-weight: 900;
    line-height: 3rem;
    letter-spacing: -0.05rem;
    color: #111111;
  }
  .subhead {
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5rem;
    color: #6b7280;
  }
}
.good-content {
  display: flex;
  gap: 3rem;
  font-family: 'Inter', sans-serif;
  .content-left {
    width: 15rem;
    .category-box {
      width: 15rem;
      box-sizing: border-box;
      &.category-box--sticky {
        position: sticky;
        top: 0rem;
        z-index: 100;
        background: white;
        padding: 1.5rem 0;
        margin-top: -1.5rem;
      }
      .category-title {
        font-size: 1.125rem;
        font-weight: 900;
        line-height: 1.6875rem;
        color: #111111;
        margin-bottom: 1rem;
      }
      .category-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        .category-item {
          width: 15rem;
          height: 2.8125rem;
          box-sizing: border-box;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: bold;
          line-height: 1.3125rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          padding-left: 1rem;
          cursor: pointer;
        }
        .category-item:hover {
          background: #f9fafb;
          color: #111111;
        }
        .category-item--active,
        .category-item--active:hover {
          background: #111111;
          color: #ffffff;
        }
      }
    }
  }
  .content-right {
    flex: 1;
    box-sizing: border-box;
    .total-box {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: bold;
      line-height: 1.3125rem;
      color: #6b7280;
      border-bottom: 0.0625rem solid #f3f4f6;
      padding-bottom: 1.0625rem;
      margin-bottom: 2.0625rem;
      .total-num {
        color: #111111;
      }
    }
    .goods-list {
      display: flex;
      flex-wrap: wrap;
      gap: 3.0625rem 2.125rem;
      box-sizing: border-box;
      .goods-item {
        box-sizing: border-box;
        width: calc((100% - 6.375rem) / 4);
        display: flex;
        flex-direction: column;
        font-family: 'Inter', sans-serif;
        cursor: pointer;
        .goods-img-box {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 0.0625rem solid transparent;
          transition: all 0.4s ease;
          .goods-img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            transition: all 0.4s ease;
          }
          .tag {
            position: absolute;
            top: 3.5%;
            left: 3.5%;
            width: 3rem;
            height: 1.875rem;
            border-radius: 624.9375rem;
            background: rgba(255, 85, 0, 0.9);
            backdrop-filter: blur(0.25rem);
            box-shadow:
              0rem 0.25rem 0.375rem -0.25rem rgba(0, 0, 0, 0.1),
              0rem 0.625rem 0.9375rem -0.1875rem rgba(0, 0, 0, 0.1),
              0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
              0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 0.75rem;
            font-weight: 900;
            color: #ffffff;
          }
          .function-box {
            position: absolute;
            left: 0;
            bottom: 5%;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            display: none;
            .function-btn {
              width: 3rem;
              height: 3rem;
              border-radius: 624.9375rem;
              background: #ffffff;
              box-shadow:
                0rem 0.5rem 0.625rem -0.375rem rgba(0, 0, 0, 0.1),
                0rem 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.1),
                0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
                0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
              display: flex;
              justify-content: center;
              align-items: center;
              .icon {
                width: 1.25rem;
                height: 1.25rem;
                display: block;
              }
            }
            .addCart:hover {
              background: #ff5500;
              .icon {
                filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
              }
            }
            .collect:hover {
              background: #ef4444;
              .icon {
                filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
              }
            }
          }
        }
        .goods-name {
          flex: 1;
          margin: 1.0625rem 0 0.375rem;
          font-size: 1.125rem;
          font-weight: bold;
          line-height: 1.6875rem;
          color: #111111;
        }
        .goods-price-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .goods-price {
            font-size: 1.5rem;
            font-weight: 900;
            line-height: 2.25rem;
            color: #ff5500;
            .goods-price-symbol {
              font-size: 0.875rem;
              font-weight: bold;
              line-height: 1.3125rem;
            }
          }
          .goods-sale-num {
            font-size: 0.8125rem;
            font-weight: 500;
            line-height: 1.2188rem;
            color: #9ca3af;
          }
        }
      }
      .goods-item:hover {
        .goods-img-box {
          border: 0.0625rem solid #f7c4ac;
          box-shadow:
            0rem 0.5rem 0.625rem -0.375rem rgba(0, 0, 0, 0.1),
            0rem 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.1),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
          .goods-img {
            transform: scale(1.1);
          }
          .function-box {
            display: flex;
          }
        }
        .goods-name {
          color: #ff5500;
        }
      }
    }
    .pagination-box {
      margin-top: 6rem;
      display: flex;
      justify-content: center;
      :deep(.n-pagination) {
        --n-item-size: 3rem !important;
        --n-item-text-color: #6b7280 !important;
        --n-item-text-color-active: #ffffff !important;
        --n-item-text-color-hover: #6b7280 !important;
        --n-item-border-radius: 1rem !important;
        --n-item-border-active: 0.0625rem solid #111111 !important;
        --n-item-border: 0.0625rem solid #f9fafb !important;
        --n-item-border-disabled: 0.0625rem solid #f9fafb !important;
        --n-button-border-hover: 0.0625rem solid #f9fafb !important;
        --n-button-border: 0.0625rem solid #f9fafb !important;
        .n-pagination-item {
          font-family: 'Inter', sans-serif;
          font-size: 0.9375rem;
          font-weight: bold;
          background: #f9fafb;
        }
        .n-pagination-item:hover {
          background: #f3f4f6;
        }
        .n-pagination-item--active,
        .n-pagination-item--active:hover {
          background: #111111;
          box-shadow:
            0rem 0.25rem 0.375rem -0.25rem rgba(0, 0, 0, 0.1),
            0rem 0.625rem 0.9375rem -0.1875rem rgba(0, 0, 0, 0.1),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
        }
      }
    }
  }
}
</style>
