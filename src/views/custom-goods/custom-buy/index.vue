<script setup lang='tsx'>
import type { CarouselInst } from 'naive-ui'
import type { Goods } from '../index.api'
import type { ReplaceImageItem } from './components/dynamic-image-list.vue'
import type { CategoryItem, CustomRequestParams, TemplateCustomDetail } from './index.api'
import type { GenerateStatus } from '@/components/image-display'
import type { AddGoodsParams } from '@/views/custom-goods/detail/index.api'
import Decimal from 'decimal.js'
import { useMessage } from 'naive-ui'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import chevronLeftBlack from '@/assets/icon/chevron-left-black.svg'
import fallbackImg from '@/assets/images/generated-failed-bg.png'
import headTemplateImage from '@/assets/images/head-template.png'
import EditableInput from '@/components/editable-input/index.vue'
import { GenerateStatusEnum, TaskStatusEnum } from '@/components/image-display'
import ImageDisplay from '@/components/image-display/index.vue'
import ImageEditorModal from '@/components/image-editor-modal/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import { useProRequest } from '@/composables/use-pro-request'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { decodeDataFromHash, encodeDataToHash } from '@/utils/common'
import { Api as DetailApi } from '@/views/custom-goods/detail/index.api'
import { Api as DraftApi } from '@/views/home/components/drafts/index.api'
import { SourceEnum } from '@/views/order-detail/confirm-order/const'
import DynamicImageList from './components/dynamic-image-list.vue'
import { Api } from './index.api'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const resultUrl = ref<string[]>([])
const curTemplateMaskUrl = ref('')

// 订单数据
const orderData = ref<AddGoodsParams>()

const goodsDetails = ref<Goods>()
const imageListRef = ref()
const carouselRef = useTemplateRef<CarouselInst>('carouselRef')
// const scrollbarRef = useTemplateRef<ScrollbarInst>('scrollbarRef')
const generateStatus = ref<GenerateStatus>(GenerateStatusEnum.IDLE)
const values = ref<CustomRequestParams>({
  templateId: '',
  maojiGoodsId: '',
  imgUrl: '',
  prompt: '',
})
const templateCategoryList = computed<CategoryItem[]>(() => [{
  label: $t('customBuy.categories.myCollect'),
  value: 1,
}, {
  label: $t('customBuy.categories.all'),
  value: 2,
}])

const selectTemplateCategory = ref<number>(2)
const curPreviewIndex = ref<number>(0)
const templateDetail = ref<TemplateCustomDetail>({
  replaceText: [],
  replaceImageList: [],
})
// 模版分页列表
const templateLaypageList = ref<(typeof templateList.value)[]>([])
const pageNumber = ref<number>(0)

// 添加图片选择器的 ref

// 图片预览相关（非响应式，减少重渲染）
const imageRefs: Record<string, any> = {}

// 预览图片
function previewImage(productId: string) {
  const imageRef = imageRefs[productId]
  if (imageRef) {
    imageRef.click()
  }
}

// 可编辑输入框的数据
const productName = ref($t('customBuy.placeholders.productName'))
const imageGallerySelectorRef = ref()

const {
  data: templateList,
  loading: templateListLoading,
  run: runGetCollectedTemplateList,
} = useProRequest(async () => {
  const params = { goodId: orderData.value?.goodsId as string }
  const result = await Api.getCollectedTemplateList(params)
  const pages = []
  const totalPages = Math.ceil(result.data.records.length / 4)
  for (let i = 0; i < totalPages; i++) {
    const start = i * 4
    const end = start + 4
    pages.push(result.data.records.slice(start, end))
  }
  templateLaypageList.value = pages
  return result.data.records
}, {
  manual: true,
  onSuccess: () => {
    // 如果当前没有选中模板，自动选中第一个
    if (!values.value.templateId && templateList.value && templateList.value.length > 0) {
      values.value.templateId = templateList.value[0].id
    }
  },
})

async function runGetTemplateDetail(templateId: string) {
  try {
    const { data } = await DetailApi.getTemplateDetail({ templateId })
    console.log(templateDetail.value, 'data')
    templateDetail.value = {
      replaceText: data.replaceText.filter(Boolean).map((t) => {
        return {
          label: t,
          value: '',
        }
      }),
      replaceImageList: data.replaceImageList,
    }
    curTemplateMaskUrl.value = data.replaceImageList.length ? data.replaceImageList[0].maskImage : headTemplateImage
  }
  catch (error: any) {
    console.log(error)
    message.error(error.response.data.msg || ($t('goodsDetail.messages.fetchTemplateDetailFail') as string))
  }
}

// 监听模板ID变化，切换时清空prompt和imgUrl
watch(() => values.value.templateId, (newTemplateId, oldTemplateId) => {
  // 当模板ID发生变化时，先清空prompt和imgUrl
  if (newTemplateId !== oldTemplateId && oldTemplateId !== undefined) {
    newTemplateId && runGetTemplateDetail(newTemplateId)
  }
  // curTemplateMaskUrl.value = templateList.value?.find(t => t.id === newTemplateId)?.maskImage || ''
})

// 监听模板列表变化，如果当前没有选中模板，自动选中第一个
watch(() => templateList.value, (newList) => {
  if (!values.value.templateId && newList && newList.length > 0) {
    values.value.templateId = newList[0].id
  }
})

async function runGetTemplateList() {
  try {
    templateListLoading.value = true
    const { data } = await DetailApi.getTemplateList({ goodId: orderData.value?.goodsId as string })
    templateList.value = data
    const pages = []
    const totalPages = Math.ceil(data.length / 4)
    for (let i = 0; i < totalPages; i++) {
      const start = i * 4
      const end = start + 4
      pages.push(data.slice(start, end))
    }
    templateLaypageList.value = pages
    console.log('templateList', templateList.value)
    console.log('templateLaypageList.value', templateLaypageList.value)
    // 如果当前没有选中模板，自动选中第一个
    if (!values.value.templateId && data && data.length > 0) {
      values.value.templateId = data[0].id
    }
    // curTemplateMaskUrl.value = templateList.value?.find(t => t.id === values.value.templateId)?.maskImage || ''
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('customBuy.messages.fetchTemplateListFail') as string))
  }
  finally {
    templateListLoading.value = false
  }
}

function changeCategory(item: CategoryItem) {
  selectTemplateCategory.value = item.value
  // 切换分类时，清空prompt和imgUrl，让isShowPrompt根据新列表重新判断
  values.value.prompt = ''
  values.value.imgUrl = ''
  pageNumber.value = 0
  if (item.value === 1) {
    runGetCollectedTemplateList()
  }
  else {
    runGetTemplateList()
  }
}

// const sideList = ref<any[]>([{
//   label: 'A面',
//   value: 1,
// }, {
//   label: 'B面',
//   value: 2,
// }])

// 智能分行逻辑
// const firstRowProducts = computed(() => {
//   const products = templateList.value
//   console.log('products', products)
//   const total = (products || []).length

//   if (total <= 3) {
//     // 如果总数小于等于3个，只显示一行
//     return products
//   }
//   else if (total <= 6) {
//     // 如果总数大于3小于等于6个，第一行显示3个，剩余显示到第二行
//     return products.slice(0, 3)
//   }
//   else {
//     // 如果总数大于6个，通过总数除以2进行动态分配
//     const midIndex = Math.ceil(total / 2)
//     return products.slice(0, midIndex)
//   }
// })

// const secondRowProducts = computed(() => {
//   const products = templateList.value
//   const total = (products || []).length

//   if (total <= 3) {
//     // 如果总数小于等于3个，第二行为空
//     return []
//   }
//   else if (total <= 6) {
//     // 如果总数大于3小于等于6个，第二行显示剩余商品
//     return products.slice(3)
//   }
//   else {
//     // 如果总数大于6个，通过总数除以2进行动态分配
//     const midIndex = Math.ceil(total / 2)
//     return products.slice(midIndex)
//   }
// })

function selectTemplate(templateId: string) {
  values.value.templateId = templateId
}

const buttonText = computed(() => {
  switch (generateStatus.value) {
    case GenerateStatusEnum.GENERATING:
      return $t('customBuy.buttonText.generating')
    case GenerateStatusEnum.FAILED:
      return $t('customBuy.buttonText.regenerate')
    default:
      return $t('customBuy.buttonText.generate')
  }
})

const isButtonDisabled = computed(() => {
  return generateStatus.value === GenerateStatusEnum.GENERATING
})

function validateAll() {
  if (!values.value.templateId) {
    message.warning($t('customBuy.messages.selectTemplate'))
    return false
  }

  if (!imageListRef.value.isAllReplaced) {
    message.warning('请将定制内容所有图片更换后再提交')
    return false
  }

  return true
}
const {
  runAsync: runGetTaskProgress,
  cancel: cancelGetTaskProgress,
} = useProRequest(Api.getTaskProgress, {
  manual: true,
  pollingInterval: 5000,
  pollingWhenHidden: false,
  onSuccess: ({ data }) => {
    if ([TaskStatusEnum.WAIT, TaskStatusEnum.PENGDING].includes(data.status as any)) {
      // 防止状态改变导致 loading 闪烁
      if (generateStatus.value === GenerateStatusEnum.GENERATING) {
        return
      }
      generateStatus.value = GenerateStatusEnum.GENERATING
      return
    }
    if (data.status === TaskStatusEnum.FAILED) {
      generateStatus.value = GenerateStatusEnum.FAILED
      message.error($t('customBuy.messages.generateFail'))
      cancelGetTaskProgress()
      return
    }
    if (data.status === TaskStatusEnum.SUCCESS) {
      resultUrl.value = data.resultUrl.split(',')
      generateStatus.value = GenerateStatusEnum.FINISHED
      message.success($t('customBuy.messages.generateSuccess'))
      cancelGetTaskProgress()
      return
    }
    return data
  },
  onError: (error) => {
    generateStatus.value = GenerateStatusEnum.FAILED
    message.error($t('customBuy.messages.generateFail'))
    throw error
  },
})

async function runGoodsDetail() {
  try {
    const { data, rawData: { msg } } = await DetailApi.getGoodsDetail({ goodsId: orderData.value!.goodsId })
    if (!data) {
      message.error(msg ?? ($t('customBuy.messages.fetchGoodsDetailFail') as string))
    }
    goodsDetails.value = data
    resultUrl.value = [data.coverImg]
    return data
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('customBuy.messages.fetchGoodsInfoFail') as string))
  }
}

async function saveDraft(imageInfoList: ReplaceImageItem[]) {
  try {
    const {
      draftId = '',
      goodsId: goodId,
      quantity,
      choice,
    } = orderData.value!
    const { replaceText } = imageListRef.value.getValue() as TemplateCustomDetail
    const textArr = replaceText.map(t => t.value ? t.value : t.label)
    const params = {
      draftId,
      goodId,
      templateId: values.value.templateId as string,
      draftName: goodsDetails.value!.goodsName,
      draftContent: JSON.stringify({
        ...values.value,
        maojiGoodsId: orderData.value?.goodsId as string,
        templateId: values.value.templateId,
        draftId,
        imgUrl: imageInfoList.map(t => t.imageUrl).join(','), // 多图逗号分隔
        prompt: JSON.stringify(textArr), // 多文字
        context: {
          ...values.value,
          maojiGoodsId: orderData.value?.goodsId as string,
          templateId: values.value.templateId,
          templateDetail: {
            replaceText,
            replaceImageList: imageInfoList,
          },
        },
      }),
      choice: {
        quantity,
        ...choice,
      },
    }
    const result = await DraftApi.saveDraft(params)
    productName.value = goodsDetails.value!.goodsName
    orderData.value!.draftId = result.data.draftId
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('customBuy.messages.saveDraftFail') as string))
  }
}

const {
  runAsync: runGeneralCustomImage,
} = useProRequest(Api.generalCustomImage, {
  manual: true,
  onSuccess: ({ data }) => {
    runGetTaskProgress({ taskId: data.taskId })
    orderData.value!.draftId = data.draftId
    return data
  },
  onError: (error: any) => {
    message.error(error.response.data.msg ? error.response.data.msg : '哎呀生成失败了...请重新生成或稍后再试吧')
    throw error
  },
})

// 生成任务
async function handleGenerate() {
  try {
    if (!validateAll())
      return
    generateStatus.value = GenerateStatusEnum.GENERATING
    const result = imageListRef.value.getValue() as TemplateCustomDetail
    console.log('最终数据：', result)
    const imageInfoList = result.replaceImageList

    await saveDraft(imageInfoList)
    await runGeneralCustomImage({
      draftId: orderData.value?.draftId as string,
    })
  }
  catch (error: any) {
    console.log(error, 'error')
    generateStatus.value = GenerateStatusEnum.FAILED
  }
}

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

async function handleImageNameChange(newName: string) {
  const result = await DraftApi.updateDraftName({
    draftId: orderData.value?.draftId as string,
    draftName: newName,
  })
  if (result.rawData.code === 200) {
    productName.value = newName
    message.success($t('customBuy.messages.updateDraftNameSuccess'))
  }
  else {
    message.error(result.rawData.msg || ($t('customBuy.messages.updateDraftNameFail') as string))
  }
}

const showImageEditor = ref(false)
const currentSelectorImg = ref<string | null>(null)
const curEditIndex = ref(0)
function updateImage(index: number) {
  imageGallerySelectorRef.value.openGalleryModal()
  curEditIndex.value = index
}

function handleImageEditorConfirm(_: Blob, url: string) {
  if (url) {
    const { replaceImageList } = imageListRef.value.getValue() as TemplateCustomDetail
    replaceImageList[curEditIndex.value].imageUrl = url
    console.log(replaceImageList, 'replaceImageList')
    imageListRef.value.setReplaceImageListValue(replaceImageList)
  }
  imageGallerySelectorRef.value.resetAll()
}

function handleConfirm(url: string | null) {
  currentSelectorImg.value = url
  showImageEditor.value = true
}

async function handleCollectTemplate() {
  const result = await Api.collectTemplate({
    templateId: values.value.templateId || '',
  })
  if (result.rawData.code === 200) {
    message.success($t('customBuy.messages.collectTemplateSuccess'))
  }
  else {
    message.error(result.rawData.msg || ($t('customBuy.messages.collectTemplateFail') as string))
  }
}

async function handleAddToCart() {
  try {
    await DetailApi.addGoodsCart({
      ...orderData.value!,
    })
    message.success($t('customBuy.messages.addCartSuccess'))
    useUserStore().fetchUpdateUserInfo()
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('customBuy.messages.addCartFail') as string))
  }
}

function handleBuy() {
  const encodedData = encodeDataToHash({
    goodsInfo: [{
      orderData: orderData.value,
      coverImg: resultUrl.value[0],
      goodsName: goodsDetails.value!.goodsName,
      realPrice: new Decimal(goodsDetails.value!.realPrice).div(100).toNumber(),
    }],
    source: SourceEnum.ONE_ORDER,
    totalPrice: new Decimal(goodsDetails.value!.realPrice).div(100).mul(orderData.value!.quantity).toNumber(),
  })
  router.push({
    name: 'ConfirmOrder',
    hash: `#data=${encodedData}`,
  })
}

async function showDraftInfo() {
  const { data } = await DraftApi.getDraftDetail({
    draftId: orderData.value?.draftId as string,
  })
  const info = JSON.parse(data.draftContent)
  values.value = info
  productName.value = data.draftName
  const {
    quantity = 1,
    ...rest
  } = JSON.parse(data.choice) ?? { quantity: 1 }
  orderData.value = {
    ...orderData.value!,
    quantity,
    choice: rest,
  }

  nextTick(() => {
    templateDetail.value = info.context.templateDetail
  })
}

// 解析 hash 中的订单数据
function parseOrderDataFromHash() {
  try {
    if (route.hash) {
      const final = route.hash.split('#data=')[1]
      orderData.value = decodeDataFromHash<AddGoodsParams>(final)
      values.value.templateId = orderData.value.templateId || ''
      console.log('从 hash 解析到的订单数据:', orderData.value)
    }
  }
  catch (error) {
    console.error('解析订单数据失败:', error)
    message.error($t('customBuy.messages.parseOrderDataFail'))
  }
}

onMounted(async () => {
  await parseOrderDataFromHash()
  await runGoodsDetail()
  await runGetTemplateList()
  if (orderData.value?.draftId) {
    showDraftInfo()
  }
  if (orderData.value?.taskId) {
    runGetTaskProgress({ taskId: orderData.value?.taskId })
  }
})
</script>

<template>
  <div class="flex h-full">
    <div class="flex w-full">
      <div class="flex-1 h-full flex">
        <div class="relative h-[calc(var(--design-vh)-78px-16px)] left-box">
          <n-scrollbar
            :x-scrollable="false"
            class="size-full"
          >
            <div class="scrollbar-box">
              <div class="template-title-box">
                <div class="template-title">
                  {{ $t('customBuy.sections.selectTemplate') }}
                </div>
                <div class="template-type">
                  <div
                    v-for="item in templateCategoryList"
                    :key="item.value"
                    class="template-type-item"
                    :class="{ 'item-activity': selectTemplateCategory === item.value }"
                    @click="changeCategory(item)"
                  >
                    {{ item.label }}
                  </div>
                </div>
              </div>
              <div
                v-loading="templateListLoading"
                class="template-list-box"
              >
                <div
                  class="template-list"
                  :class="templateList && templateList.length > 2 ? 'twoRows' : 'oneRows'"
                >
                  <div
                    v-for="(item, index) in templateLaypageList[pageNumber]"
                    :key="index"
                    class="template-item"
                    :class="[values.templateId === item.id && 'template-item-active']"
                    @click="selectTemplate(item.id)"
                  >
                    <div class="img-box relative">
                      <n-image
                        :ref="(el: any) => { if (el) imageRefs[item.id] = el }"
                        :src="`${item.picUrls[0]}?imageMogr2/thumbnail/284x284`"
                        :preview-src="`${item.picUrls[0]}${item.picUrls[0].includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                        :alt="item.name"
                        class="size-full"
                        object-fit="cover"
                        :render-toolbar="createImageToolbar(item.picUrls[0])"
                      />
                      <div class="absolute inset-0 bg-#000 bg-opacity-50 rounded-8px flex items-end justify-end pb-4px opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <div
                          class="w-32px h-32px flex items-center justify-center cursor-pointer"
                          @click.stop="previewImage(item.id)"
                        >
                          <img
                            src="@/assets/icon/zoom-in.svg"
                            class="size-20px"
                          >
                        </div>
                      </div>
                      <div
                        v-if="values.templateId === item.id"
                        class="check-box"
                      >
                        <img
                          src="@/assets/icon/check.png"
                          class="check-icon"
                        >
                      </div>
                    </div>
                    <div class="template-text">
                      {{ item.name }}
                    </div>
                  </div>
                  <div
                    v-show="templateList && templateList.length === 0"
                    class="w-full h-full flex items-center justify-center"
                  >
                    <img
                      src="@/assets/images/data-null.png"
                      class="h-full"
                    >
                  </div>
                </div>
                <div
                  v-if="templateLaypageList.length > 1"
                  class="template-list-laypage"
                >
                  <div
                    v-for="(_item, index) in templateLaypageList"
                    :key="index"
                    class="laypage-item"
                    :class="[index === pageNumber && 'laypage-item-active']"
                    @click="pageNumber = index"
                  />
                </div>
              </div>
              <div class="customize-content">
                <div
                  v-show="templateDetail.replaceImageList.length > 0 || templateDetail.replaceText.length > 0"
                  class="customize-title"
                >
                  设置定制内容
                </div>
              </div>
              <div class="customize-detail">
                <dynamic-image-list
                  ref="imageListRef"
                  :replace-text="templateDetail.replaceText"
                  :replace-image-list="templateDetail.replaceImageList"
                  @update-image="updateImage"
                />
                <image-gallery-selector
                  ref="imageGallerySelectorRef"
                  :model-value="null"
                  :confirm-text="$t('customBuy.actions.nextStep')"
                  @confirm="handleConfirm"
                >
                  <div />
                  <!-- <div
                    class="size-100px rounded-12px bg-#F7F7F7 flex flex-col items-center justify-center cursor-pointer"
                    @click="imageGallerySelectorRef.openGalleryModal()"
                  >
                    <img src="@/assets/icon/add.svg">
                    <div class="text-#666666 text-12px">
                      {{ $t('customBuy.actions.addFromGallery') }}
                    </div>
                  </div> -->
                </image-gallery-selector>
              </div>
              <image-editor-modal
                v-model="showImageEditor"
                :img-url="currentSelectorImg || ''"
                :mask-image-url="curTemplateMaskUrl ? curTemplateMaskUrl : headTemplateImage"
                @confirm="handleImageEditorConfirm"
                @cancel="imageGallerySelectorRef.openGalleryModal()"
              />
            </div>
          </n-scrollbar>
          <!-- 固定底部按钮 -->
          <div class="generate-box">
            <n-button
              class="generate-btn"
              :class="isButtonDisabled ? 'generate-activity' : ''"
              color="#FF6A00"
              :disabled="isButtonDisabled"
              size="large"
              @click="handleGenerate"
            >
              <span class="generate-text">{{ buttonText }}</span>
            </n-button>
          </div>
        </div>
        <div class="h-[calc(var(--design-vh)-78px-16px)] flex-1 box-border p-y-112px p-x-17px relative right-box">
          <div
            v-if="generateStatus === GenerateStatusEnum.FINISHED"
            class="top-btn-box"
          >
            <div class="max-w-50%">
              <editable-input
                v-model="productName"
                :placeholder="$t('customBuy.placeholders.productName')"
                size="small"
                @change="(newName) => handleImageNameChange(newName)"
              />
            </div>
            <div class="btn-box">
              <div class="drafts">
                <img
                  src="@/assets/icon/check-icon.png"
                  class="icon"
                >
                <div class="text-#666666">
                  {{ $t('customBuy.messages.savedToDraft') }}
                </div>
              </div>
              <div
                class="btn collect"
                @click="handleCollectTemplate"
              >
                {{ $t('customBuy.actions.collectTemplate') }}
              </div>
              <div
                class="btn addCart"
                @click="handleAddToCart"
              >
                {{ $t('customBuy.actions.addToCart') }}
              </div>
              <div
                class="btn buyNow"
                @click="handleBuy"
              >
                {{ $t('customBuy.actions.buyNow') }}
              </div>
            </div>
          </div>
          <div class="size-full flex gap-17px">
            <div
              class="size-full flex flex-col gap-12px items-center"
            >
              <!--  :class="generateStatus === GenerateStatusEnum.FINISHED ? 'w-70%' : 'w-full'" -->
              <div
                class="size-full rounded-16px bg-#FFF relative overflow-hidden w-full"
              >
                <!-- 图片展示区域 -->
                <image-display
                  :generate-status="generateStatus"
                  :result-url="resultUrl[curPreviewIndex] || fallbackImg"
                />
              </div>
            </div>
            <div
              v-if="generateStatus === GenerateStatusEnum.FINISHED"
              class="flex-1 justify-center rounded-16px bg-#FFF flex flex-col h-280px [box-shadow:0px_4px_7px_0px_rgba(0,0,0,0.08)]"
            >
              <n-carousel
                ref="carouselRef"
                v-model:current-index="curPreviewIndex"
                class="size-230px"
              >
                <img
                  v-for="item in resultUrl"
                  :key="item"
                  :src="item"
                  class="size-full object-cover"
                >
              </n-carousel>
              <div class="flex items-center justify-center gap-8px select-none">
                <img
                  :src="chevronLeftBlack"
                  class="cursor-pointer size-18px"
                  @click="carouselRef?.prev()"
                >
                <div class="text-12px c-#000 line-height-24px">
                  预览图 {{ curPreviewIndex + 1 }} / {{ resultUrl.length }}
                </div>
                <img
                  :src="chevronLeftBlack"
                  class="cursor-pointer size-18px transform-rotate-180"
                  @click="carouselRef?.next()"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.left-box {
  width: 400px;
  border-right: 1px solid #e5e7eb;
  padding-bottom: 105px;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  .scrollbar-box {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 32px;
    .template-title-box {
      height: 38px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      .template-title {
        font-size: 16px;
        font-weight: bold;
        line-height: 24px;
        color: #111111;
      }
      .template-type {
        height: 38px;
        padding: 4px;
        box-sizing: border-box;
        background: #f9fafb;
        border-radius: 8px;
        display: flex;
        gap: 8px;
        .template-type-item {
          cursor: pointer;
          height: 30px;
          padding: 0 12px;
          border-radius: 6px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 12px;
          font-weight: bold;
          line-height: 18px;
          color: #9ca3af;
        }
        .template-type-item:hover {
          color: #111111;
        }
        .item-activity,
        .item-activity:hover {
          background: #111111;
          box-shadow:
            0px 1px 2px 0px rgba(0, 0, 0, 0.05),
            0px 0px 0px 0px rgba(0, 0, 0, 0),
            0px 0px 0px 0px rgba(0, 0, 0, 0);
          color: #ffffff;
        }
      }
    }
    .template-list-box {
      box-sizing: border-box;
      .template-list {
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        .template-item {
          box-sizing: border-box;
          width: calc((100% - 16px) / 2);
          cursor: pointer;
          .img-box {
            box-sizing: border-box;
            width: 100%;
            aspect-ratio: 1;
            border-radius: 16px;
            overflow: hidden;
            background: #f9fafb;
            border: 2px solid rgba(0, 0, 0, 0);
            margin-bottom: 8px;
            :deep(.n-image img) {
              width: 100%;
              height: 100%;
            }
            .check-box {
              position: absolute;
              top: 10px;
              right: 10px;
              width: 24px;
              height: 24px;
              border-radius: 9999px;
              background: #111111;
              box-sizing: border-box;
              border: 2px solid #ffffff;
              box-shadow:
                0px 1px 2px 0px rgba(0, 0, 0, 0.05),
                0px 0px 0px 0px rgba(0, 0, 0, 0),
                0px 0px 0px 0px rgba(0, 0, 0, 0);
              display: flex;
              justify-content: center;
              align-items: center;
              .check-icon {
                width: 14px;
                height: 14px;
              }
            }
          }
          .template-text {
            font-size: 13px;
            font-weight: bold;
            line-height: 16.25px;
            color: #9ca3af;
            text-align: center;
          }
        }
        .template-item-active {
          .img-box {
            border: 2px solid #111111;

            box-shadow:
              0px 0px 0px 0px rgba(0, 0, 0, 0),
              0px 0px 0px 1px rgba(17, 17, 17, 0.1),
              0px 0px 0px 0px #ffffff;
          }
          .template-text {
            color: #111111;
          }
        }
      }
      .twoRows {
        height: 383.5px;
      }
      .oneRows {
        height: 183.5px;
      }
    }
    .template-list-laypage {
      margin-top: 14px;
      display: flex;
      justify-content: center;
      gap: 6px;
      .laypage-item {
        cursor: pointer;
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: #d1d5db;
      }
      .laypage-item-active {
        width: 16px;
        height: 6px;
        background: #ff5500;
        box-shadow: 0px 0px 15px 0px rgba(255, 85, 0, 0.6);
        margin: 0 4px;
      }
    }
    .customize-content {
      margin-top: 20px;
      .customize-title {
        font-size: 16px;
        font-weight: bold;
        line-height: 24px;
        color: #111111;
        margin-bottom: 18px;
      }
    }
    .customize-detail {
      box-sizing: border-box;
    }
  }
  .generate-box {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 12;
    box-sizing: border-box;
    width: 100%;
    padding: 17px 32px 32px;
    background: #ffffff;
    border-top: 0.0625rem solid #e5e7eb;
    display: flex;
    justify-content: center;
    align-items: center;
    .generate-btn {
      width: 100%;
      height: 56px;
      border-radius: 18px;
      box-sizing: border-box;
      background: #ff5500;
      box-shadow:
        0px 12px 30px -8px rgba(255, 85, 0, 0.4),
        0px 0px 0px 0px rgba(0, 0, 0, 0),
        0px 0px 0px 0px rgba(0, 0, 0, 0);
      cursor: pointer;
      :deep(.n-button__content) {
        display: flex;
        flex-direction: column;
      }
      .generate-text {
        font-size: 16px;
        font-weight: 900;
        line-height: 24px;
        color: #ffffff;
      }
    }
    .generate-btn:hover {
      background: #ea580c;
    }
    .generate-activity,
    .generate-activity:hover {
      cursor: not-allowed;
      .generate-text {
        .arrow-right {
          transform: none;
        }
      }
    }
  }
}
.right-box {
  font-family: 'Inter', sans-serif;
  .top-btn-box {
    box-sizing: border-box;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32px 32px 0;
    .btn-box {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      font-weight: bold;
      line-height: 19.5px;
      .drafts {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: 8px;
        color: #9ca3af;
        .icon {
          width: 20px;
          height: 20px;
        }
      }
      .btn {
        padding: 10px 21px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        cursor: pointer;
        box-sizing: border-box;
      }
      .collect {
        border: 1px solid #e5e7eb;
        box-shadow:
          0px 2px 8px 0px rgba(0, 0, 0, 0.04),
          0px 0px 0px 0px rgba(0, 0, 0, 0),
          0px 0px 0px 0px rgba(0, 0, 0, 0);
        background: #ffffff;
        color: #4b5563;
      }
      .collect:hover {
        border: 1px solid #d1d5db;
        color: #111111;
      }
      .addCart {
        background: #111111;
        box-shadow:
          0px 4px 6px -4px #d1d5db,
          0px 10px 15px -3px #d1d5db,
          0px 0px 0px 0px rgba(0, 0, 0, 0),
          0px 0px 0px 0px rgba(0, 0, 0, 0);
        color: #ffffff;
      }
      .addCart:hover {
        background: #1f2937;
      }
      .buyNow {
        background: #ff5500;
        box-shadow:
          0px 4px 6px -4px rgba(255, 85, 0, 0.2),
          0px 10px 15px -3px rgba(255, 85, 0, 0.2),
          0px 0px 0px 0px rgba(0, 0, 0, 0),
          0px 0px 0px 0px rgba(0, 0, 0, 0);
        color: #ffffff;
      }
      .buyNow:hover {
        background: #e04800;
      }
    }
  }
}
</style>
