<script setup lang="ts">
import type { TabsInst } from 'naive-ui'
import type { AddGoodsParams, Colors, FinalGoodsType, GoodsTemplateItem } from './index.api'
import { Icon } from '@iconify/vue'
import Decimal from 'decimal.js'
import { useMessage } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import footerBox from '@/components/footer/index.vue'
import QuantityInput from '@/components/quantity-input/index.vue'
import { useContactServiceModal } from '@/composables/use-contact-service-modal'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { encodeDataToHash } from '@/utils/common'
import { SourceEnum } from '@/views/order-detail/confirm-order/const'
import { Api as CustomBuyApi } from '../custom-buy/index.api'
import { Api } from './index.api'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { openContactServiceModal } = useContactServiceModal()
const detail = ref<FinalGoodsType>()
const templateList = ref<GoodsTemplateItem[]>()

const loading = ref(false)
const collected = ref(false)
const selectedSizeKey = ref('')
const selectedColorKey = ref('')
const mockList = ref<string[]>([])
const isTemplateGoods = !!route.query.templateId
const categoryId = route.query.categoryId
const previewImageBoxRef = ref<HTMLElement | null>(null)
// 是否打开模版弹窗
const showDialog = ref(false)
// 默认左侧可以显示出来的 Tab 数量
const tabShowNum = ref(0)

async function runGoodsDetail() {
  try {
    const { data, rawData: { msg } } = await Api.getGoodsDetail({ goodsId: route.query.id as string })
    if (!data) {
      message.error(msg ?? ($t('goodsDetail.messages.fetchFail') as string))
      return
    }
    const details = JSON.parse(data.details)
    console.log('details', details)
    detail.value = {
      ...data,
      realPrice: data.realPrice ? (new Decimal(data.realPrice).div(100).toNumber()) : 0,
      originPrice: data.originPrice ? (new Decimal(data.originPrice).div(100).toNumber()) : 0,
      colors: details.colors,
      introduce: details.introduce,
      sizes: details.sizes,
      mainImageUrl: isTemplateGoods ? [] : JSON.parse(data.mainImageUrl).map((t: any) => t.url),
    }
    selectedSizeKey.value = (detail.value.sizes ?? [])[0].id
    selectedColorKey.value = (detail.value.colors ?? [])[0].color_id
    collected.value = !!(detail.value.isCollected)
    mockList.value = data.categoryName ? [data.categoryName, data.goodsName] : [data.goodsName]
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('goodsDetail.messages.fetchInfoFail') as string))
  }
}

async function runGetTemplateList() {
  try {
    const { data } = await Api.getTemplateList({ goodId: route.query.id as string })

    if (isTemplateGoods) {
      templateList.value = data.filter(t => t.id !== route.query.templateId)
    }
    else {
      templateList.value = data
    }
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('goodsDetail.messages.fetchTemplateListFail') as string))
  }
}

async function runGetTemplateDetail() {
  try {
    const { data } = await Api.getTemplateDetail({ templateId: route.query.templateId as string })
    detail.value!.mainImageUrl = data.picUrls
    collected.value = !!(data.isCollect)
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('goodsDetail.messages.fetchTemplateDetailFail') as string))
  }
}

// 更新容器高度的函数
function updateContainerHeight() {
  nextTick(() => {
    const previewImage = document.querySelector('.preview-image')
    if (!(previewImage instanceof HTMLElement))
      return
    const previewImageHeight = previewImage.offsetHeight
    if (previewImageBoxRef.value) {
      previewImageBoxRef.value.style.height = `${previewImageHeight}px`
      tabShowNum.value = Math.floor(previewImageHeight / 60)
      console.log('tabShowNum.value', tabShowNum.value)
    }
  })
}

// 窗口大小改变处理函数
function handleResize() {
  updateContainerHeight()
}

onMounted(async () => {
  updateContainerHeight()
  window.addEventListener('resize', handleResize)
  loading.value = true
  try {
    await runGoodsDetail()
    await runGetTemplateList()
    if (isTemplateGoods) {
      await runGetTemplateDetail()
    }
  }
  catch (error: any) {
    console.log(error, 'error')
    message.error(error.response.data.msg || ($t('goodsDetail.messages.fetchDetailFail') as string))
  }
  finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function openGoodsDetail(item: GoodsTemplateItem) {
  const url = router.resolve({
    path: '/goods-detail',
    query: {
      id: route.query.id,
      templateId: item.id,
    },
  })
  window.open(url.href, '_self')
}

/** ----- UI 状态 ----- */
const currentIndex = ref(0)
const quantity = ref(1)
const isContactServiceFocused = ref(false)
// const overlap = ref(false)

/** ----- refs ----- */
const tabsContainerRef = useTemplateRef<TabsInst>('tabsContainerRef')
// const scrollbarRef = useTemplateRef<ScrollbarInst>('scrollbarRef')

/** ----- methods ----- */
function selectIndex(i: number) {
  currentIndex.value = i
}

/** 处理联系客服点击事件 */
function handleContactServiceClick() {
  isContactServiceFocused.value = true
  openContactServiceModal()
}

/** 处理联系客服失去焦点事件 */
// function handleContactServiceBlur() {
//   isContactServiceFocused.value = false
// }

// 需要传递的订单数据信息
const orderData = computed<AddGoodsParams>(() => {
  const size = detail.value?.sizes.find(t => t.id === selectedSizeKey.value)
  const colors = detail.value?.colors.find(t => t.color_id === selectedColorKey.value)

  return {
    goodsId: route.query.id as string,
    quantity: quantity.value,
    templateId: route.query.templateId as string || '',
    choice: {
      size: size!.name,
      size_id: selectedSizeKey.value,
      color_id: colors!.id,
      sku_code: detail.value?.sku_code ?? '',
      color_name: colors!.color_name,
    },
  }
})

function handleBuy() {
  const encodedData = encodeDataToHash({
    goodsInfo: [{
      orderData: orderData.value,
      coverImg: detail.value?.coverImg,
      goodsName: detail.value?.goodsName,
      realPrice: detail.value!.realPrice,
    }],
    source: SourceEnum.ONE_ORDER,
    totalPrice: new Decimal(detail.value!.realPrice).mul(orderData.value!.quantity).toNumber(),
  })

  router.push({
    name: 'ConfirmOrder',
    hash: `#data=${encodedData}`,
  })
}

async function handleAddCart() {
  try {
    await Api.addGoodsCart(orderData.value)
    message.success($t('goodsDetail.messages.addCartSuccess'))
    useUserStore().fetchUpdateUserInfo()
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('goodsDetail.messages.addCartFail') as string))
  }
}

function handleCustom() {
  const encodedData = encodeDataToHash(orderData.value)
  router.push({
    name: 'CustomBuy',
    hash: `#data=${encodedData}`,
  })
}

// async function handleCopyLink() {
//   try {
//     const currentUrl = window.location.href
//     await navigator.clipboard.writeText(currentUrl)
//     message.success($t('goodsDetail.messages.copyLinkSuccess'))
//   }
//   catch {
//     // 降级方案：使用传统的复制方法
//     try {
//       const textArea = document.createElement('textarea')
//       textArea.value = window.location.href
//       document.body.appendChild(textArea)
//       textArea.select()
//       document.execCommand('copy')
//       document.body.removeChild(textArea)
//       message.success($t('goodsDetail.messages.copyLinkSuccess'))
//     }
//     catch {
//       message.error($t('goodsDetail.messages.copyLinkFail'))
//     }
//   }
// }

/** 处理滚轮横向滚动 */
// function handleWheel(event: WheelEvent) {
//   if (scrollbarRef.value) {
//     // 判断手势决定使用水平滚动量还是纵向滚动量
//     scrollbarRef.value.scrollBy({
//       left: Math.abs(event.deltaX) > Math.abs(event.deltaY)
//         ? event.deltaX
//         : event.deltaY,
//     })
//   }
// }

async function collectGoods() {
  try {
    if (collected.value) {
      await Api.collectGoods({ goodsId: route.query.id as string })
      message.success($t('goodsDetail.messages.collectSuccess'))
    }
    else {
      await Api.cancelCollectGoods({ goodsId: route.query.id as string })
      message.success($t('goodsDetail.messages.cancelCollectSuccess'))
    }
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('goodsDetail.messages.operationFail') as string))
  }
}

async function collectTemplates() {
  try {
    if (collected.value) {
      await CustomBuyApi.collectTemplate({ templateId: route.query.templateId as string })
      message.success($t('goodsDetail.messages.collectSuccess'))
    }
    else {
      await CustomBuyApi.cancelCollectTemplate({ templateId: route.query.templateId as string })
      message.success($t('goodsDetail.messages.cancelCollectSuccess'))
    }
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('goodsDetail.messages.operationFail') as string))
  }
}

async function handleCollect() {
  collected.value = !collected.value
  if (isTemplateGoods) {
    collectTemplates()
  }
  else {
    collectGoods()
  }
}

function handleSelectColor(c: Colors) {
  selectedColorKey.value = c.color_id
  detail.value!.realPrice = new Decimal(c.real_price).div(100).toNumber() || 0
}

/** 滚动缩略图 */
function scrollThumbs(direction: number) {
  if (!tabsContainerRef.value)
    return

  const container = (tabsContainerRef.value as any).yScrollElRef
  if (!container)
    return

  const scrollAmount = 300 // 每次滚动的像素数
  const currentScrollTop = container.scrollTop
  const maxScrollTop = container.scrollHeight - container.clientHeight

  let targetScrollTop: number

  if (direction === -1) {
    // 向上滚动
    targetScrollTop = Math.max(0, currentScrollTop - scrollAmount)
  }
  else {
    // 向下滚动
    targetScrollTop = Math.min(maxScrollTop, currentScrollTop + scrollAmount)
  }

  // 使用平滑滚动
  container.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth',
  })
}

// const containerRef = ref<HTMLElement | null>(null)
// const tabRef = ref<HTMLElement | null>(null)
// const containerWidth = ref(0)

// 监听容器宽度变化
// function updateWidth() {
//   if (containerRef.value) {
//     containerWidth.value = containerRef.value.clientWidth
//   }
//   if (tabRef.value) {
//     tabShowNum.value = Math.floor(tabRef.value.clientHeight / 104)
//     console.log('tabRef.value.clientHeight', tabRef.value.clientHeight)
//     console.log('tabShowNum', tabShowNum.value)
//   }
// }

// onMounted(() => {
//   updateWidth()
//   window.addEventListener('resize', updateWidth)
// })

// onBeforeUnmount(() => {
//   window.removeEventListener('resize', updateWidth)
// })

// 右侧实际宽度（你的 min-w 400 + w-40%）
// const rightWidthPx = computed(() => {
//   const w = containerWidth.value * 0.43 - 15
//   return Math.max(400, w)
// })

// 给操作栏用的宽度
// const actionBarWidth = computed(() => `${rightWidthPx.value}px`)
</script>

<template>
  <div
    v-loading="loading"
    class="h-[calc(var(--design-vh)-78px-16px)] content-box"
  >
    <div class="content">
      <div class="breadcrumb-box">
        <div
          v-for="(breadcrumb, index) in mockList"
          :key="breadcrumb"
          class="breadcrumb-item"
        >
          <div
            class="breadcrumb-item-name"
            :class="index === mockList.length - 1 ? 'breadcrumb-item-last' : ''"
            @click="breadcrumb.length - 1 !== index ? router.push({ path: '/custom-goods', query: { categoryId } }) : ''"
          >
            {{ breadcrumb }}
          </div>
          <div
            v-if="mockList.length - 1 !== index"
            class="separator"
          >
            /
          </div>
        </div>
      </div>
      <div class="good-detail">
        <div class="detail-left">
          <div
            ref="previewImageBoxRef"
            class="preview-image-box"
          >
            <div
              class="image-list"
            >
              <n-tabs
                ref="tabsContainerRef"
                type="line"
                animated
                class="h-full w-full relative [scrollbar-width:none]"
                placement="left"
                :theme-overrides="{
                  tabGapLargeLine: '24px',
                  barColor: 'transparent',
                  tabFontWeightActive: '600',
                  tabTextColorLine: '#999999',
                  tabBorderColor: 'transparent',
                  tabTextColorHoverLine: '#000000',
                  tabTextColorActiveLine: '#000000',
                  tabPaddingVerticalMediumLine: '0px',
                }"
              >
                <template #prefix>
                  <div
                    v-show="(detail?.mainImageUrl?.length ?? 0) > tabShowNum"
                    class="thumb-fader top"
                    @click="scrollThumbs(-1)"
                  >
                    <icon
                      icon="cuida:caret-up-outline"
                      class="size-28px"
                    />
                  </div>
                </template>
                <template #suffix>
                  <div
                    v-show="(detail?.mainImageUrl?.length ?? 0) > tabShowNum"
                    class="thumb-fader bottom"
                    @click="scrollThumbs(1)"
                  >
                    <icon
                      icon="cuida:caret-down-outline"
                      class="size-28px"
                    />
                  </div>
                </template>
                <n-tab
                  v-for="(img, i) in detail?.mainImageUrl"
                  :key="i"
                  name="oasis"
                  class="outline-none box-border rounded-[8px] overflow-hidden border-1 border-solid border-transparent cursor-pointer transition-all duration-150 bg-white flex items-center justify-center"
                  :class="{
                    'border-[#000]! z-100': i === currentIndex,
                    'mt-10px': i === 0,
                  }"
                  @click="selectIndex(i)"
                >
                  <div class="thumbItem">
                    <img
                      :src="img"
                      alt="thumb"
                      class="max-w-full max-h-full vertical-middle block"
                    >
                  </div>
                </n-tab>
              </n-tabs>
            </div>
            <div
              class="preview-image"
            >
              <n-image
                v-show="detail?.mainImageUrl[currentIndex]"
                class="image-item"
                object-fit="cover"
                :src="detail?.mainImageUrl[currentIndex]"
              />
            </div>
          </div>
          <div class="productDetail-box">
            <div class="title">
              {{ $t('goodsDetail.sections.productDetail') }}
            </div>
            <div
              class="introduce"
              v-html="detail?.introduce"
            />
          </div>
        </div>
        <div class="detail-right">
          <n-scrollbar>
            <div class="actual-box">
              <div class="goodsName-box">
                <div class="goodsName">
                  {{ detail?.goodsName }}
                </div>
                <div
                  :class="{ 'is-collect': collected }"
                  class="collect-box"
                  @click="handleCollect"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="collect-icon"
                  ><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                </div>
              </div>
              <div class="service-box">
                {{ $t('goodsDetail.labels.service') }}{{ detail?.goodsDesc }}
              </div>
              <div class="price-box">
                <span>¥{{ detail?.realPrice }}</span>
              </div>
              <div class="line" />
              <div class="custom-box">
                <div class="custom-title-box">
                  <div class="title">
                    {{ $t('goodsDetail.sections.customTemplates') }}
                  </div>
                  <div
                    v-if="templateList && templateList.length > 3"
                    class="more-btn"
                    @click="showDialog = true"
                  >
                    {{ $t('goodsDetail.actions.more') }}
                    <img
                      class="more-icon"
                      src="@/assets/icon/right.png"
                    >
                  </div>
                </div>
                <div class="custom-list">
                  <div
                    v-for="item in templateList?.slice(0, 3)"
                    :key="item.id"
                    class="custom-item"
                    @click="openGoodsDetail(item)"
                  >
                    <div class="img-box">
                      <img
                        class="img object-cover"
                        :src="`${item.picUrls[0]}?imageMogr2/thumbnail/284x284`"
                      >
                      <div class="mask-box">
                        <img
                          class="more-icon"
                          src="@/assets/icon/mask-icon.png"
                        >
                      </div>
                    </div>
                    <div class="custom-text">
                      <span>{{ item.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="color-box">
                <div class="color-title">
                  {{ $t('goodsDetail.labels.color') }}<span class="color-name">{{ detail?.colors.find(item => item.color_id === selectedColorKey)?.name }}</span>
                </div>
                <div class="color-list">
                  <div
                    v-for="(c) in detail?.colors"
                    :key="c.color_id"
                    class="p-7px flex items-center cursor-pointer justify-center gap-8px color-item"
                    :class="[selectedColorKey === c.color_id ? 'border-#000! border-2px border-solid' : '', c.disabled ? 'opacity-50 cursor-not-allowed! bg-#F7F7F7!' : '']"
                    @click="!c.disabled && handleSelectColor(c)"
                  >
                    <img
                      class="size-40px overflow-hidden object-cover rounded-4px"
                      :src="c.img_url"
                    >
                    <div class="line-height-22px">
                      {{ c.color_name }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="size-box">
                <div class="size-title">
                  {{ $t('goodsDetail.labels.size') }}
                </div>
                <div class="size-list">
                  <div
                    v-for="(c) in detail?.sizes"
                    :key="c.id"
                    class="size-item"
                    :class="[selectedSizeKey === c.id ? 'size-activity' : '', c.disabled ? 'opacity-50 cursor-not-allowed! bg-#F7F7F7!' : '']"
                    @click="!c.disabled && (selectedSizeKey = c.id)"
                  >
                    <div>
                      {{ c.name }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="quantity-box">
                <div class="quantity-title">
                  {{ $t('goodsDetail.labels.quantity') }}
                </div>
                <div class="flex gap-24px items-center">
                  <quantity-input
                    v-model="quantity"
                    :min="1"
                    :max="100"
                  />
                  <div
                    class="c-#FF6A00 cursor-pointer text-14px"
                    @click="openContactServiceModal"
                  >
                    {{ $t('goodsDetail.actions.bulkPurchase') }}
                  </div>
                </div>
              </div>
              <div class="line line2" />
              <div class="btn-box">
                <div
                  class="addCart-btn cursor-pointer"
                  @click="handleAddCart"
                >
                  <img
                    class="addCart-icon"
                    src="@/assets/icon/addCart.svg"
                  >
                </div>
                <div
                  class="buy-btn cursor-pointer"
                  @click="handleBuy"
                >
                  {{ $t('goodsDetail.actions.buyNow') }}
                </div>
                <div
                  class="custom-btn cursor-pointer"
                  @click="handleCustom"
                >
                  <img
                    class="custom-icon"
                    src="@/assets/icon/mask-icon.png"
                  >
                  {{ $t('goodsDetail.actions.customBuy') }}
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>
      <footer-box />
    </div>
    <div
      class="floating-button"
      @click="handleContactServiceClick"
    >
      <img
        class="floating-button-icon"
        src="@/assets/icon/floating-button.png"
      >
    </div>
    <!-- <n-float-button
      position="fixed"
      right="0"
      bottom="20%"
      shape="square"
      width="71px"
    >
      <div class="w-71px h-146px flex flex-col box-border py-14px px-4px c-#000000 text-12px gap-8px">
        <div
          data-contact-service
          class="flex flex-col items-center justify-center size-55px py-8px box-border rounded-8px cursor-pointer transition-colors duration-200"
          :class="isContactServiceFocused ? 'bg-#F7F7F7' : 'bg-white hover:bg-#F7F7F7'"
          tabindex="0"
          @click="handleContactServiceClick"
          @blur="handleContactServiceBlur"
        >
          <img
            src="@/assets/icon/contact-service-active.svg"
            class="size-24px"
          >
          <span>{{ $t('common.contactService.title') }}</span>
        </div>
        <div
          class="flex flex-col items-center justify-center size-55px py-8px box-border cursor-pointer"
          @click="handleCopyLink"
        >
          <img
            src="@/assets/icon/attachment.svg"
            class="size-24px"
          >
          <span>{{ $t('goodsDetail.actions.copyLink') }}</span>
        </div>
      </div>
    </n-float-button> -->
  </div>
  <div
    v-show="showDialog"
    class="custom-dialog"
  >
    <div class="custom-dialog-content">
      <div class="dialog-content-top">
        <div class="dialog-title">
          全部定制模板
        </div>
        <div
          class="close-box"
          @click="showDialog = false"
        >
          <img
            src="@/assets/icon/close.svg"
            class="close-icon"
          >
        </div>
      </div>
      <div class="content">
        <n-scrollbar>
          <div class="custom-list">
            <div
              v-for="item in templateList"
              :key="item.id"
              class="custom-item"
              @click="openGoodsDetail(item)"
            >
              <div class="img-box">
                <img
                  class="img object-cover"
                  :src="`${item.picUrls[0]}?imageMogr2/thumbnail/284x284`"
                >
                <div class="mask-box">
                  <div class="mask-btn">
                    <img
                      class="more-icon"
                      src="@/assets/icon/mask-icon.png"
                    >
                    <span>使用模版</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.thumb-fader {
  width: 100%;
  height: 2.1875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: absolute;
  z-index: 9;

  &.top {
    top: -0.0625rem;
    background: linear-gradient(to bottom, rgb(255 255 255 / 98%), rgba(255, 255, 255, 0));
  }
  &.bottom {
    bottom: -0.0625rem;
    background: linear-gradient(to top, rgb(255 255 255 / 98%), rgba(255, 255, 255, 0));
  }
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
  }

  &.bottom::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0));
  }
}
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
.good-detail {
  box-sizing: border-box;
  width: 100%;
  margin-top: 2.375rem;
  display: flex;
  gap: 3rem;
  .detail-left {
    flex: 1;
    box-sizing: border-box;
    .preview-image-box {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      .image-list {
        box-sizing: border-box;
        width: 3.75rem;
        height: 100%;
      }
      .preview-image {
        flex: 1;
        aspect-ratio: 1;
        box-sizing: border-box;
        border-radius: 0.75rem;
        overflow: hidden;
        .image-item {
          width: 100%;
          height: 100%;
          display: block;
        }
        :deep(.n-image img) {
          width: 100%;
          height: 100%;
        }
      }
    }
    .productDetail-box {
      margin-top: 4.5rem;
      .title {
        font-family: 'Inter', sans-serif;
        font-size: 1.25rem;
        font-weight: 900;
        line-height: 1.875rem;
        color: #111111;
        margin-bottom: 1.625rem;
      }
      .introduce {
        width: 100%;
        font-family: 'Inter', sans-serif;
        font-size: 0.9375rem;
        font-weight: normal;
        line-height: 1.5237rem;
        color: #333333;
        :deep(img) {
          width: 100%;
        }
      }
    }
  }
  .detail-right {
    width: 48.6%;
    max-height: calc(100vh - 11.25rem);
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    position: sticky;
    top: 5.75rem;
    .actual-box {
      width: 100%;
      .goodsName-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .goodsName {
          font-size: 2rem;
          font-weight: 900;
          line-height: 2.5rem;
          letter-spacing: -0.05rem;
          color: #111111;
        }
        .collect-box {
          width: 2.75rem;
          height: 2.75rem;
          box-sizing: border-box;
          border-radius: 50%;
          border: 0.0625rem solid #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          .collect-icon {
            width: 1.375rem;
            height: 1.375rem;
          }
        }
        .collect-box:hover,
        .is-collect {
          background: #fef2f2;
          border-color: #fee5e5;
          .collect-icon {
            color: #ff4d4f;
          }
        }
      }
      .service-box {
        margin: 1rem 0 1.125rem;
        font-size: 0.9375rem;
        font-weight: 500;
        line-height: 1.4063rem;
        color: #6b7280;
      }
      .price-box {
        font-size: 1.75rem;
        font-weight: 900;
        line-height: 1.75rem;
        color: #111111;
      }
      .line {
        width: 100%;
        height: 0.0625rem;
        background-color: #f3f4f6;
        margin: 2.25rem 0 2rem;
      }
      .custom-box {
        .custom-title-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          .title {
            font-size: 0.875rem;
            font-weight: bold;
            line-height: 1.3125rem;
            color: #111111;
          }
          .more-btn {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.75rem;
            font-weight: bold;
            line-height: 1.125rem;
            color: #ff5500;
            .more-icon {
              width: 0.875rem;
              height: 0.875rem;
            }
          }
          .more-btn:hover {
            text-decoration: underline;
          }
        }
        .custom-list {
          box-sizing: border-box;
          display: flex;
          gap: 0.875rem;
          .custom-item {
            box-sizing: border-box;
            width: calc((100% - 1.75rem) / 3);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            .img-box {
              width: 100%;
              aspect-ratio: 1;
              border-radius: 0.75rem;
              background: #f6f6f6;
              box-sizing: border-box;
              border: 0.125rem solid rgba(0, 0, 0, 0);
              overflow: hidden;
              position: relative;
              .img {
                width: 100%;
                height: 100%;
                display: block;
              }
              .mask-box {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2;
                backdrop-filter: blur(0.0625rem);
                background: rgba(0, 0, 0, 0.1);
                display: flex;
                justify-content: center;
                align-items: center;
                display: none;
                .more-icon {
                  width: 1.125rem;
                  height: 1.125rem;
                }
              }
            }
            .custom-text {
              font-size: 0.75rem;
              font-weight: 500;
              line-height: 1.125rem;
              color: #6b7280;
            }
          }
          .custom-item:hover {
            .img-box {
              border: 0.125rem solid #000000;
              .mask-box {
                display: flex;
              }
            }
            .custom-text {
              color: #000000;
            }
          }
        }
      }
      .color-box {
        margin-top: 2rem;
        .color-title {
          font-size: 0.875rem;
          font-weight: bold;
          line-height: 1.3125rem;
          color: #111111;
          margin-bottom: 0.75rem;
          .color-name {
            color: #6b7280;
            font-weight: normal;
          }
        }
        .color-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          .color-item {
            font-size: 0.8125rem;
            font-weight: bold;
            color: #333333;
            border-radius: 0.5rem;
            background: #f9fafb;
            border: 0.125rem solid transparent;
          }
        }
      }
      .size-box {
        margin-top: 2rem;
        .size-title {
          font-size: 0.875rem;
          font-weight: bold;
          line-height: 1.3125rem;
          color: #111111;
          margin-bottom: 0.75rem;
        }
        .size-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          .size-item {
            border-radius: 0.5rem;
            height: 2.75rem;
            background: #f9fafb;
            box-sizing: border-box;
            border: 0.125rem solid rgba(0, 0, 0, 0);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 1.25rem;
            cursor: pointer;
            font-size: 0.8125rem;
            font-weight: bold;
            line-height: 1.2188rem;
            color: #333333;
          }
          .size-item:hover {
            border: 0.125rem solid #e5e7eb;
          }
          .size-activity,
          .size-activity:hover {
            background-color: #ffffff;
            border: 0.125rem solid #111111;
          }
        }
      }
      .line2 {
        margin: 2rem 0 25x;
      }
      .quantity-box {
        margin-top: 2rem;
        .quantity-title {
          font-size: 0.875rem;
          font-weight: bold;
          line-height: 1.3125rem;
          color: #111111;
          margin-bottom: 0.75rem;
        }
      }
      .btn-box {
        position: sticky;
        left: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        background-color: #ffffff;
        padding: 10px 0 30px;
        .addCart-btn {
          width: 3.75rem;
          height: 3.75rem;
          border-radius: 50%;
          background: #ffffff;
          box-sizing: border-box;
          border: 0.125rem solid #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          .addCart-icon {
            width: 1.5rem;
            height: 1.5rem;
          }
        }
        .addCart-btn:hover {
          border: 0.125rem solid #111111;
        }
        .buy-btn {
          margin: 0 2.75rem 0 0.75rem;
          width: 37.6%;
          height: 3.75rem;
          border-radius: 624.9375rem;
          background: #111111;
          box-shadow:
            0rem 0.5rem 0.625rem -0.375rem rgba(0, 0, 0, 0.05),
            0rem 1.25rem 1.5625rem -0.3125rem rgba(0, 0, 0, 0.05),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1rem;
          font-weight: bold;
          line-height: 1.5rem;
          color: #ffffff;
        }
        .buy-btn:hover {
          background-color: #1f2937;
        }
        .custom-btn {
          width: 38.21%;
          height: 3.75rem;
          border-radius: 624.9375rem;
          background: #ff5500;
          box-shadow:
            0rem 0.5rem 0.625rem -0.375rem rgba(255, 85, 0, 0.2),
            0rem 1.25rem 1.5625rem -0.3125rem rgba(255, 85, 0, 0.2),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
            0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
          font-weight: bold;
          line-height: 1.5rem;
          color: #ffffff;
          .custom-icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
        .custom-btn:hover {
          background-color: #e04800;
        }
      }
    }
  }
}
.custom-dialog {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(0.25rem);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Inter', sans-serif;
  .custom-dialog-content {
    width: 50%;
    height: 70%;
    max-width: 56.25rem;
    max-height: 62.5rem;
    background-color: #ffffff;
    border-radius: 1.875rem;
    display: flex;
    flex-direction: column;
    .dialog-content-top {
      height: 6.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      padding: 0 2.5rem;
      .dialog-title {
        font-size: 1.5rem;
        font-weight: 900;
        line-height: 2.25rem;
        color: #111111;
      }
      .close-box {
        cursor: pointer;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        .close-icon {
          width: 1.5rem;
          height: 1.5rem;
        }
      }
      .close-box:hover {
        background: #f3f4f6;
        .close-icon {
          filter: brightness(8%) sepia(0%) saturate(0%) grayscale(100%);
        }
      }
    }
    .content {
      flex: 1;
      box-sizing: border-box;
      padding: 0 2.625rem 2.625rem;
      overflow: hidden;
      .custom-list {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 1.75rem;
        .custom-item {
          box-sizing: border-box;
          width: calc((100% - 3.5rem) / 3);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          .img-box {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 0.75rem;
            box-sizing: border-box;
            border: 0.125rem solid transparent;
            outline: none;
            overflow: hidden;
            position: relative;
            .img {
              width: 100%;
              height: 100%;
              display: block;
              object-fit: cover;
              transition: all 0.4s ease;
            }
            .mask-box {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 2;
              backdrop-filter: blur(0.0625rem);
              background: rgba(0, 0, 0, 0.1);
              display: flex;
              justify-content: center;
              align-items: center;
              display: none;
              .mask-btn {
                background: #ffffff;
                border-radius: 1.875rem;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 0.5rem;
                font-weight: 700;
                font-size: 0.8125rem;
                color: #111111;
                padding: 0.5rem 1.125rem;
                .more-icon {
                  width: 1.125rem;
                  height: 1.125rem;
                  filter: brightness(8%) sepia(0%) saturate(0%) grayscale(100%);
                }
              }
              .mask-btn:hover {
                background: #ff5500;
                color: #ffffff;
                .more-icon {
                  filter: none;
                }
              }
            }
          }
        }
        .custom-item:hover {
          .img-box {
            border: 0.125rem solid #f7c4ac;
            box-shadow:
              0rem 0.5rem 0.625rem -0.375rem rgba(255, 85, 0, 0.1),
              0rem 1.25rem 1.5625rem -0.3125rem rgba(255, 85, 0, 0.1),
              0rem 0rem 0rem 0rem transparent,
              0rem 0rem 0rem 0rem transparent;
            .img {
              transform: scale(1.1);
            }
            .mask-box {
              display: flex;
            }
          }
        }
      }
    }
  }
}
.floating-button {
  position: fixed;
  right: 2.5rem;
  bottom: 2.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 624.9375rem;
  background: #111111;
  box-shadow:
    0rem 0.25rem 1.25rem 0rem rgba(0, 0, 0, 0.25),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease;
  .floating-button-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
}
.floating-button:hover {
  transform: scale(1.1) rotate(-20deg);
  background-color: #ff5500;
}
</style>
