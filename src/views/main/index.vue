<script setup lang="ts">
import type { Goods } from '../custom-goods/index.api'
import type { OneTabInfo } from './index.api'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
// import searchSameGoods from '@/assets/icon/stars-filled.svg'
import footerBox from '@/components/footer/index.vue'
import MasonryGrid from '@/components/masonry-grid/index.vue'
import { useUserStore } from '@/store/use-user-store'
import Banner from './components/banner.vue'
import { Api } from './index.api'

const TabKey = { tab1: '1', tab2: '2', tab3: '4', tab4: '3' }

const router = useRouter()

const mainCategoryList = ref([
  { categoryId: TabKey.tab1, categoryName: '完美人像' },
  { categoryId: TabKey.tab2, categoryName: '特效大片' },
  { categoryId: TabKey.tab3, categoryName: '超级溶图' },
  { categoryId: TabKey.tab4, categoryName: '小兔文创' },
])

const routeMap = new Map([
  ['39', 'ActionReplacement'],
  ['38', 'SketchNew'],
  ['37', 'SceneReplacement'],
  ['41', 'LocalAdjustment'],
  ['35', 'OneClickMattingNew'],
  ['34', 'MotionAdjustment'],
  ['28', 'HDZoomNew'],
  ['33', 'ExpressionOptimizeNew'],
])

// const subCategoryList = ref([
//   { categoryId: '女生', categoryName: '女生' },
//   { categoryId: '男生', categoryName: '男生' },
// ])

const activeTabKey = ref<string>(TabKey.tab1)
const activeSubTabKey = ref<string>('女生')
// const isHaveSubCategory = ref(false)

// const tabDataMap = ref(new Map<string, any>([]))
// const TabListMap = ref(new Map<string, any[]>([]))
// 列表查询参数
const queryParams = ref({
  pageNum: '1',
  pageSize: '32',
})
// 列表数据
const list = ref<OneTabInfo[]>([])
// 列表加载状态
const isLoading = ref(false)
const hasMore = ref(true)

// const Tab1Data = computed<OneTabInfo[]>(() => {
//   const data: OneTabInfo[] = isHaveSubCategory.value
//     ? (TabListMap.value.get(activeSubTabKey.value) ?? []).flat()
//     : tabDataMap.value.get(TabKey.tab1) || []
//   return data
// })

// const Tab2Data = computed<OneTabInfo[]>(() => {
//   return isHaveSubCategory.value
//     ? (TabListMap.value.get(activeSubTabKey.value) ?? []).flat()
//     : tabDataMap.value.get(TabKey.tab2) || []
// })

// const Tab3Data = computed<OneTabInfo[]>(() => {
//   return isHaveSubCategory.value
//     ? (TabListMap.value.get(activeSubTabKey.value) ?? []).flat()
//     : tabDataMap.value.get(TabKey.tab3) || []
// })

// const Tab4Data = computed<OneTabInfo[]>(() => {
//   return isHaveSubCategory.value
//     ? (TabListMap.value.get(activeSubTabKey.value) ?? []).flat()
//     : tabDataMap.value.get(TabKey.tab4) || []
// })

async function handleTabChange(categoryId: string) {
  list.value = []
  queryParams.value.pageNum = '1'
  hasMore.value = true
  activeTabKey.value = categoryId
  await runCategoryList()
}

// function handleSubTabChange(subCategoryId: string) {
//   activeSubTabKey.value = subCategoryId
// }

function handleTabMakeSame(data: any) {
  const name = routeMap.get(data.effectId)
  const url = router.resolve({
    name,
    query: {
      id: data.id,
    },
  })
  window.open(url.href, '_self')
}

function handleTab4MakeSame(product: Goods & { goodId: string, id: string }) {
  const url = router.resolve({
    path: '/goods-detail',
    query: {
      id: product.goodId,
      templateId: product.id,
    },
  })
  window.open(url.href, '_self')
}

async function runCategoryList() {
  if (isLoading.value || !hasMore.value)
    return
  try {
    isLoading.value = true
    // subCategoryList.value = []
    // isHaveSubCategory.value = false
    const res = await Api.getCategoryList({
      id: Number(activeTabKey.value),
      ...queryParams.value,
    })
    if (res.data.list.length === 0 || res.data.list.length < Number.parseInt(queryParams.value.pageSize)) {
      hasMore.value = false
    }
    list.value = [...list.value, ...res.data.list]
  }
  catch (err: any) {
    console.log(err, 'err')
    hasMore.value = false
  }
  finally {
    isLoading.value = false
  }
}

// 滚动到底部加载更多
function handleScroll() {
  if (isLoading.value || !hasMore.value)
    return

  const scrollContainer = document.querySelector('.n-pro-layout__content')
    || document.documentElement
    || document.body

  if (!scrollContainer)
    return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer
  const isBottom = scrollTop + clientHeight >= scrollHeight - 700

  if (isBottom) {
    // 递增页码并加载更多
    queryParams.value.pageNum = String(Number.parseInt(queryParams.value.pageNum) + 1)
    runCategoryList()
  }
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: number | null = null
  return function (...args: Parameters<T>): void {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay) as unknown as number
  }
}

// 添加防抖的滚动处理
const debouncedHandleScroll = debounce(handleScroll, 200)

// runCategoryList()
async function loadMore() {}

onMounted(() => {
  const { isLogined, showLoginModal } = storeToRefs(useUserStore())
  if (!isLogined.value) {
    showLoginModal.value = true
  }
  // 添加滚动监听
  document.querySelector('.n-pro-layout__content')?.addEventListener('scroll', debouncedHandleScroll)
  // 初始加载
  runCategoryList()
})

onUnmounted(() => {
  // 移除滚动监听
  document.querySelector('.n-pro-layout__content')?.removeEventListener('scroll', debouncedHandleScroll)
})
</script>

<template>
  <div
    class="h-[calc(var(--design-vh)-78px-16px)] box-border content-box"
  >
    <div class="size-full box-border rounded-16px bg-#FFF content">
      <banner />
      <div class="classification-box">
        <div class="classification-center">
          <div
            v-for="n in mainCategoryList"
            :key="n.categoryId"
            class="classification-item"
            :class="activeTabKey === n.categoryId ? 'is-active' : ''"
            @click="handleTabChange(n.categoryId)"
          >
            {{ n.categoryName }}
          </div>
        </div>
      </div>
      <!-- <div class="w-full flex items-center mt-16px mb-16px gap-32px">
          <div
            v-for="n in subCategoryList"
            :key="n.categoryId"
            class="p-[8px_14px] c-#000 font-500 text-16px rounded-10px hover:bg-#000 hover:c-#FFF cursor-pointer"
            :class="activeSubTabKey === n.categoryId ? 'bg-#000 c-#FFF' : ''"
            @click="handleSubTabChange(n.categoryId)"
          >
            {{ n.categoryName }}
          </div>
        </div> -->
      <masonry-grid
        v-if="activeTabKey === TabKey.tab1"
        :key="TabKey.tab1 + activeSubTabKey"
        :list="list"
        :load-more="loadMore"
        :min-column-width="260"
        :gutter="16"
      >
        <template #default="{ item }">
          <n-card class="border-none! product-card">
            <template #cover>
              <div
                class="cover-wrapper cursor-pointer"
                @click="handleTabMakeSame(item)"
              >
                <n-image
                  :key="item.previewUrl"
                  :src="`${item.previewUrl}?imageMogr2/thumbnail/1004x1004`"
                  class="product-img"
                  object-fit="cover"
                  preview-disabled
                />
                <div class="cover-gradient" />
                <div class="make-same-wrap">
                  <img
                    class="btn"
                    src="@/assets/icon/arrow-right.svg"
                  >
                </div>
              </div>
            </template>
          </n-card>
        </template>
      </masonry-grid>
      <masonry-grid
        v-if="activeTabKey === TabKey.tab2"
        :key="TabKey.tab2 + activeSubTabKey"
        :list="list"
        :load-more="loadMore"
        :min-column-width="260"
        :gutter="16"
      >
        <template #default="{ item }">
          <n-card class="border-none! product-card">
            <template #cover>
              <div
                class="cover-wrapper cursor-pointer"
                @click="handleTabMakeSame(item)"
              >
                <n-image
                  :key="item.previewUrl"
                  :src="`${item.previewUrl}?imageMogr2/thumbnail/1004x1004`"
                  class="product-img"
                  object-fit="cover"
                  preview-disabled
                />
                <div class="cover-gradient" />
                <div class="make-same-wrap">
                  <img
                    class="btn"
                    src="@/assets/icon/arrow-right.svg"
                  >
                </div>
              </div>
            </template>
          </n-card>
        </template>
      </masonry-grid>
      <masonry-grid
        v-if="activeTabKey === TabKey.tab3"
        :key="TabKey.tab3 + activeSubTabKey"
        :list="list"
        :load-more="loadMore"
        :min-column-width="260"
        :gutter="16"
      >
        <template #default="{ item }">
          <n-card class="border-none! product-card">
            <template #cover>
              <div
                class="cover-wrapper cursor-pointer"
                @click="handleTabMakeSame(item)"
              >
                <n-image
                  :src="`${item.previewUrl}?imageMogr2/thumbnail/1004x1004`"
                  class="product-img"
                  object-fit="cover"
                  preview-disabled
                />
                <div class="cover-gradient" />
                <div class="make-same-wrap">
                  <img
                    class="btn"
                    src="@/assets/icon/arrow-right.svg"
                  >
                </div>
              </div>
            </template>
          </n-card>
        </template>
      </masonry-grid>
      <masonry-grid
        v-if="activeTabKey === TabKey.tab4"
        :key="TabKey.tab4 + activeSubTabKey"
        :list="list"
        :load-more="loadMore"
        :min-column-width="260"
        :gutter="16"
      >
        <template #default="{ item }">
          <n-card class="border-none! product-card">
            <template #cover>
              <div
                class="cover-wrapper cursor-pointer"
                @click="handleTab4MakeSame(item)"
              >
                <n-image
                  :src="
                    item?.picUrls?.length
                      ? `${item?.picUrls[0]}?imageMogr2/thumbnail/604x604`
                      : ''
                  "
                  class="product-img"
                  object-fit="cover"
                  preview-disabled
                />
                <div class="cover-gradient" />
                <div class="make-same-wrap">
                  <img
                    class="btn"
                    src="@/assets/icon/arrow-right.svg"
                  >
                </div>
              </div>
            </template>
          </n-card>
        </template>
      </masonry-grid>
      <div
        v-if="isLoading"
        class="loading-more"
      >
        加载中...
      </div>
      <footer-box />
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.mainTabs .n-tabs-tab--active) {
  font-weight: bold;
  font-size: 24px !important;
  color: #000000;
  background-size: 100% 38%;
  background-repeat: no-repeat;
  background-position: center 75%;
  background-image: url('../../assets/images/active-tab-bg.png');
  overflow: hidden;
}

:deep(.mainTabs .n-tabs-tab) {
  font-size: 20px;
  font-family:
    Alimama ShuHeiTi,
    Alimama ShuHeiTi;
}

.cover-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: block;
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center center;
}

.product-card {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: none;
  transform: translateY(0);
}

.product-card:hover {
  transform: translateY(-0.3rem);
  box-shadow: 0 0.25rem 0.5rem -0.125rem rgba(0, 0, 0, 0.15);
}

.product-card:hover .product-img {
  transform: scale(1.05);
}

.cover-gradient {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(to top, #0000006d 0%, #00000005 60%, #00000004 80%, transparent 100%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.product-card:hover .cover-gradient {
  opacity: 1;
}

.make-same-wrap {
  position: absolute;
  bottom: 15px;
  right: 15px;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.25s ease;
  background-color: #f2f2f2;
  display: flex;
  justify-content: center;
  align-items: center;
  .btn {
    width: 25px;
    height: 25px;
  }
}
.make-same-wrap:hover {
  background-color: #ff5500;
  .btn {
    filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }
}

.product-card:hover .make-same-wrap {
  opacity: 1;
}

.make-same-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 34px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: #000;
  color: #fff;
  border: none !important;
  gap: 3px;
}
.content-box {
  padding: 0 6.25rem;
  max-width: 132.5rem;
  min-width: 80rem;
  box-sizing: border-box;
  margin: auto;
}
.content {
  width: 100%;
  padding: 2.625rem 4.6875rem;
  box-sizing: border-box;
}
.classification-box {
  margin: 2.5625rem 0 3.0625rem;
  display: flex;
  justify-content: center;

  .classification-center {
    margin: auto;
    padding: 0.5625rem;
    height: 4.375rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    border-radius: 624.9375rem;
    border: 0.0625rem solid #e5e7eb;
    box-sizing: border-box;
    box-shadow: 0rem 0.0625rem 0.125rem 0rem rgba(0, 0, 0, 0.05);
  }
  .classification-item {
    padding: 0 2.5rem;
    height: 100%;
    display: flex;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 1.25rem;
    font-weight: bold;
    line-height: 1.75rem;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 624.9375rem;
  }
  .classification-item:hover {
    background-color: #f9fafb;
    color: #111111;
  }
  .is-active {
    background: #111111;
    color: #ffffff;
  }
  .is-active:hover {
    background: #111111;
    color: #ffffff;
  }
}
.loading-more {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  text-align: center;
  padding: 20px;
  color: #666;
  margin-top: 50px;
}
</style>
