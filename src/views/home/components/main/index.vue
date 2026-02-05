<script setup lang='tsx'>
import type { TemplateItem } from './index.api'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import searchSameGoods from '@/assets/images/search-same-goods.png'
import FooterBox from '@/components/layout/footer.vue'
import ProductSkeleton from '@/components/skeleton/product-skeleton.vue'
import { useProRequest } from '@/composables/use-pro-request'
import { $t } from '@/locales/locales'
import { useAppStore } from '@/store/use-app-store'
import { Api } from './index.api'

const app = useAppStore()
const router = useRouter()

const activeTabKey = ref<string>('')

const {
  data: bannerListInfo,
  loading: bannerLoading,
} = useProRequest(async () => {
  const result = await Api.getBannerList({ langCode: app.lang })
  return (result.data ?? []).sort((a, b) => a.sort - b.sort)
})

const {
  data: templateInfo,
  loading: templateLoading,
} = useProRequest(async () => {
  const result = await Api.getTemplateInfo()
  return (result.data.records ?? []).sort((a, b) => a.sort - b.sort)
}, {
  onSuccess(data) {
    activeTabKey.value = data[0].categoryId
  },
})

const templateList = computed(() => {
  const list = templateInfo.value.find(t => t.categoryId === activeTabKey.value)
  return list?.templates ?? []
})

async function handleTabChange(categoryId: string) {
  activeTabKey.value = categoryId
}

function openNewTab(name: string | any) {
  const url = router.resolve({
    path: name,
  })
  window.open(url.href, '_self')
}

function handleMakeSame(item: TemplateItem) {
  const url = router.resolve({
    path: '/goods-detail',
    query: {
      id: item.goodId,
      templateId: item.id,
    },
  })
  window.open(url.href, '_self')
}
</script>

<template>
  <div class="size-full fit-content bg-#F2F2F2 rounded-16px select-none font-['PingFang_HK']">
    <n-scrollbar
      :x-scrollable="false"
      class="size-full"
    >
      <div class="size-full p-32px box-border rounded-16px bg-#FFF">
        <div class="banner-row">
          <template v-if="bannerLoading">
            <div class="rounded-16px h-200px! p-0! w-49%!">
              <n-skeleton
                height="100%"
                width="100%"
                :sharp="false"
              />
            </div>
            <div class="rounded-16px h-200px! p-0! w-49%!">
              <n-skeleton
                height="100%"
                width="100%"
                :sharp="false"
              />
            </div>
          </template>
          <template v-else>
            <div class="w-full flex justify-between items-center">
              <!-- AI绘图 Banner -->
              <div
                class="banner-card ai"
                @click="openNewTab(bannerListInfo[0].jumpUrl || '/ai-draw')"
              >
                <div class="content">
                  <div class="text">
                    <div class="title">
                      {{ bannerListInfo[0].bannerText }}
                    </div>
                    <div class="desc">
                      {{ bannerListInfo[0].bannerSubText }}
                    </div>
                  </div>
                  <div class="flex items-center h-[calc(100%+30px)] mt-30px">
                    <img
                      :src="bannerListInfo[0].bannerImageUrl ?? ''"
                      class="object-contain h-full"
                    >
                  </div>
                </div>
              </div>

              <!-- 定制商品 Banner -->
              <div
                class="banner-card custom"
                @click="openNewTab(bannerListInfo[1].jumpUrl || '/custom-goods')"
              >
                <div class="content">
                  <div class="text">
                    <div class="title">
                      {{ bannerListInfo[1].bannerText }}
                    </div>
                    <div class="desc">
                      {{ bannerListInfo[1].bannerSubText }}
                    </div>
                  </div>
                  <div class="flex items-center h-[calc(100%+30px)] mt-30px">
                    <img
                      :src="bannerListInfo[1].bannerImageUrl ?? ''"
                      class="object-contain h-full"
                    >
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
        <!-- Tab 区 -->
        <n-config-provider
          class="sticky top-0 left-0 z-10 bg-white outline outline-1 outline-white"
          :theme-overrides="{
            Tabs: {
              tabGapLargeLine: '24px',
              barColor: 'transparent',
              tabFontWeightActive: 600,
              tabTextColorLine: '#999999',
              tabBorderColor: 'transparent',
              tabTextColorHoverLine: '#000000',
              tabTextColorActiveLine: '#000000',
            },
          }"
        >
          <n-tabs
            v-model:value="activeTabKey"
            type="line"
            size="large"
            @update:value="handleTabChange"
          >
            <n-tab
              v-for="n in templateInfo"
              :key="n.categoryId"
              :name="n.categoryId"
            >
              {{ n.categoryName }}
            </n-tab>
          </n-tabs>
        </n-config-provider>
        <!-- 商品列表 -->
        <div class="grid grid-cols-[repeat(auto-fill,minmax(244px,1fr))] gap-18px pr-20px">
          <!-- 骨架屏 -->
          <product-skeleton
            v-if="templateLoading"
            class="pr-20px"
          />

          <!-- 实际内容 -->
          <template v-else>
            <div
              v-for="goods in templateList"
              :key="goods.id"
              class="product-card"
            >
              <n-card class="border-none!">
                <template #cover>
                  <div
                    class="cover-wrapper cursor-pointer"
                    @click="handleMakeSame(goods)"
                  >
                    <n-image
                      :src="goods.picUrls[0]"
                      class="product-img"
                      object-fit="cover"
                      preview-disabled
                    />
                    <!-- 悬停渐变阴影 -->
                    <div class="cover-gradient" />
                    <!-- 图片内部的按钮 -->
                    <div class="make-same-wrap">
                      <div
                        class="make-same-btn"
                        size="small"
                      >
                        <img
                          :src="searchSameGoods"
                          class="size-18px! truncate"
                        >
                        {{ $t('home.main.actions.makeSame') }}
                      </div>
                    </div>
                  </div>
                </template>
              </n-card>
              <div class="product-title">
                {{ goods.name }}
              </div>
            </div>
          </template>
        </div>
      </div>
      <footer-box class="" />
    </n-scrollbar>
  </div>
</template>

<style scoped lang="scss">
:deep(.n-tabs-tab--active) {
  font-size: 20px;
}

.banner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-card {
  width: 45%;
  height: 160px;
  padding: 20px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  border-radius: 16px;
}

.banner-card .content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.banner-card .text {
  flex: 1;
  height: 100%;
  z-index: 1;
}

.banner-card .title {
  font-family:
    Alimama ShuHeiTi,
    Alimama ShuHeiTi;
  color: #000000;
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 4px;
}

.banner-card .desc {
  font-family:
    PingFang SC,
    PingFang SC;
  color: #666666;
  font-size: 14px;
  font-weight: 100;
}

/* 背景图区域控制 */
.banner-card.ai {
  background-size: 100% 100%;
  background-image: url('../../../../assets/images/banner1.png');
  overflow: hidden;
}

.banner-card.custom {
  background-size: 100% 100%;
  background-image: url('../../../../assets/images/banner2.png');
  overflow: hidden;
}

/* ====== Product Grid ====== */
.grid {
  margin-top: 10px;
}

/* ====== Card / Image ====== */
.product-card {
  width: 264px;
  height: 300px;
  overflow: hidden;
  --img-radius: 12px;
}

.cover-wrapper {
  position: relative;
  border-radius: var(--img-radius);
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  border-radius: var(--img-radius);
  display: block;
}

/* 渐变阴影（默认透明，悬停时显示） */
.cover-gradient {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 80%;
  pointer-events: none;
  background: linear-gradient(to top, #0000006d 0%, #00000005 60%, #00000004 80%, transparent 100%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.product-card:hover .cover-gradient {
  opacity: 1;
}

/* ====== Make Same Button ====== */
.make-same-wrap {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  text-align: center;
  opacity: 0;
  transition: opacity 0.25s ease;
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

/* ====== Title ====== */
.product-title {
  margin-top: 8px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

/* 响应式网格布局 */
@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
    gap: 12px !important;
  }
}

// @media (max-width: 768px) {
//   .grid {
//     grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
//     gap: 16px !important;
//   }
// }

// @media (max-width: 480px) {
//   .grid {
//     grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
//     gap: 8px !important;
//   }
// }
</style>
