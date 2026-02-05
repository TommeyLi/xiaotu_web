<script setup lang="ts">
import type { GoodsTemplateItem } from '@/views/custom-goods/detail/index.api'
import type { Goods } from '@/views/custom-goods/index.api'
import { useMessage } from 'naive-ui'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { $t } from '@/locales/locales'
import { Api as GoodsDetailApi } from '@/views/custom-goods/detail/index.api'
import { Api } from './index.api'

const router = useRouter()
const message = useMessage()
const recordsMode = ref<'uploadRecords' | 'generateRecords'>('uploadRecords')
const goodsCollectList = ref<Goods[]>([])
const templateCollectList = ref<GoodsTemplateItem[]>([])
const currentPage = ref(1)
const pageSize = ref(20) // 减少每页数量，提高加载体验
const loading = ref(false)
const loadingMore = ref(false) // 加载更多的loading状态
const total = ref(0) // 总数据量
const hasMore = ref(true) // 是否还有更多数据

async function getGoodsCollectList(isLoadMore = false) {
  if (isLoadMore) {
    loadingMore.value = true
  }
  else {
    loading.value = true
    // 重置分页状态
    currentPage.value = 1
    goodsCollectList.value = []
    hasMore.value = true
  }

  try {
    const res = await Api.getGoodsCollectList({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })
    if (res.rawData.code === 200) {
      total.value = res.data.total

      if (isLoadMore) {
        // 追加数据
        goodsCollectList.value.push(...res.data.records)
      }
      else {
        // 替换数据
        goodsCollectList.value = res.data.records
      }

      // 判断是否还有更多数据
      hasMore.value = goodsCollectList.value.length < total.value
    }
    else {
      message.error(res.rawData.msg)
    }
  }
  catch (error: any) {
    message.error(error.response.data.msg ? error.response.data.msg : ($t('myCollect.messages.fetchGoodsFail') as string))
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多数据
async function loadMoreGoods() {
  if (!hasMore.value || loadingMore.value || loading.value) {
    return
  }

  currentPage.value += 1
  await getGoodsCollectList(true)
}

async function getTemplateCollectList() {
  loading.value = true
  try {
    const res = await Api.getCollectedTemplateList({})
    if (res.rawData.code === 200) {
      templateCollectList.value = res.data.records
    }
    else {
      message.error(res.rawData.msg)
    }
  }
  catch (error: any) {
    message.error(error.response.data.msg ? error.response.data.msg : ($t('myCollect.messages.fetchTemplateFail') as string))
  }
  finally {
    loading.value = false
  }
}

// 滚动监听
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target

  // 当滚动到底部附近时（距离底部50px内）触发加载更多
  if (scrollHeight - scrollTop - clientHeight < 50) {
    if (recordsMode.value === 'uploadRecords' && hasMore.value) {
      loadMoreGoods()
    }
  }
}

onMounted(() => {
  getGoodsCollectList()
})

onUnmounted(() => {
  // 清理事件监听器
})

async function runGetTemplateDetail(templateId: string) {
  try {
    const { data } = await GoodsDetailApi.getTemplateDetail({ templateId })
    return data
  }
  catch (error: any) {
    message.error(error.response.data.msg ? error.response.data.msg : ($t('myCollect.messages.fetchTemplateDetailFail') as string))
    return null
  }
}

function openDetailPage(query: { id: string, templateId?: string }) {
  const url = router.resolve({
    path: '/goods-detail',
    query,
  })
  window.open(url.href, '_self')
}

function openTemplateDetailPage(templateId: string) {
  runGetTemplateDetail(templateId).then((data) => {
    if (data) {
      openDetailPage({ id: data.goodId, templateId })
    }
  })
}

async function updateValue(val: 'uploadRecords' | 'generateRecords') {
  if (val === 'uploadRecords') {
    await getGoodsCollectList()
  }
  else {
    await getTemplateCollectList()
  }
}
</script>

<template>
  <div class="w-full h-[calc(var(--design-vh)-78px-16px)] bg-#FFF rounded-16px p-24px box-border flex flex-col min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border">
    <!-- 固定头部 -->
    <div class="sticky top-0 left-0 bg-#FFF z-10 pb-16px outline outline-1 outline-white">
      <n-tabs
        v-model:value="recordsMode"
        type="segment"
        animated
        class="h-44px w-237px"
        :theme-overrides="{
          tabBorderRadius: '12px',
        }"
        @update-value="updateValue"
      >
        <n-tab-pane
          name="uploadRecords"
          :tab="$t('myCollect.tabs.goods')"
        />
        <n-tab-pane
          name="generateRecords"
          :tab="$t('myCollect.tabs.templates')"
        />
      </n-tabs>
    </div>

    <n-scrollbar
      :x-scrollable="false"
      class="flex-1"
      @scroll="handleScroll"
    >
      <div
        v-show="recordsMode === 'uploadRecords' && goodsCollectList.length > 0"
        v-loading="loading"
        class="grid grid-cols-[repeat(auto-fill,minmax(211px,1fr))] gap-15px pr-20px"
      >
        <div
          v-for="goods in goodsCollectList"
          :key="goods.goodsId"
          class="flex flex-col cursor-pointer transition-all duration-200 group"
        >
          <div class="relative w-full aspect-square rounded-16px overflow-hidden">
            <img
              :src="goods.coverImg"
              :alt="goods.goodsName"
              class="w-full h-full object-cover rounded-16px"
            >
            <div class="absolute bottom-0 left-0 right-0 h-132px bg-gradient-to-t from-black/40 via-black/10 to-transparent flex items-end justify-center opacity-0 transition-opacity duration-200 rounded-b-16px group-hover:opacity-100">
              <button
                class="bg-#000 text-white border-none w-75% h-36px py-4px rounded-8px text-16px mb-20px font-bold cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-black/90 hover:scale-105"
                @click="openDetailPage({ id: goods.goodsId })"
              >
                {{ $t('myCollect.actions.viewDetail') }}
              </button>
            </div>
          </div>

          <div class="flex flex-col justify-center pt-12px">
            <div class="text-14px text-#000 font-500 truncate">
              {{ goods.goodsName }}
            </div>
            <div class="text-24px text-#ff4e47 font-bold font-din">
              <span class="text-14px pr-2px">¥</span>
              {{ goods.realPrice || '-' }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="(recordsMode === 'uploadRecords' && goodsCollectList.length <= 0) && !loading">
        {{ $t('myCollect.empty.goods') }}
      </div>
      <!-- 加载更多状态 -->
      <div
        v-show="recordsMode === 'uploadRecords' && goodsCollectList.length > 0"
        class="flex justify-center items-center py-20px"
      >
        <div
          v-if="loadingMore"
          class="flex items-center gap-8px text-#666"
        >
          <n-spin size="small" />
          <span>{{ $t('common.often.loading') }}</span>
        </div>
        <!-- <div
          v-else-if="!hasMore && goodsCollectList.length > 0"
          class="text-#999 text-14px"
        >
          没有更多数据了
        </div> -->
      </div>

      <div
        v-show="recordsMode !== 'uploadRecords' && templateCollectList.length > 0"
        v-loading="loading"
        class="grid grid-cols-[repeat(auto-fill,minmax(211px,1fr))] gap-15px pr-20px"
      >
        <div
          v-for="template in templateCollectList"
          :key="template.id"
          class="flex flex-col cursor-pointer transition-all duration-200 group"
        >
          <div class="relative w-full aspect-square rounded-16px overflow-hidden">
            <img
              :src="template.picUrls[0]"
              :alt="template.name"
              class="w-full h-full object-cover rounded-16px"
            >
            <div class="absolute bottom-0 left-0 right-0 h-132px bg-gradient-to-t from-black/40 via-black/10 to-transparent flex items-end justify-center opacity-0 transition-opacity duration-200 rounded-b-16px group-hover:opacity-100">
              <button
                class="bg-#000 text-white border-none w-75% h-36px py-4px rounded-8px text-16px mb-20px font-bold cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-black/90 hover:scale-105"
                @click="openTemplateDetailPage(template.id)"
              >
                {{ $t('myCollect.actions.viewDetail') }}
              </button>
            </div>
          </div>

          <div class="flex flex-col justify-center pt-12px">
            <div class="font-14px text-#000 font-500 truncate">
              {{ template.name }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="(recordsMode !== 'uploadRecords' && templateCollectList.length <= 0) && !loading">
        {{ $t('myCollect.empty.templates') }}
      </div>
    </n-scrollbar>
  </div>
</template>
