<script setup lang='tsx'>
import type { ScrollbarInst } from 'naive-ui'
import type { Goods } from '../index.api'
import type { CategoryItem, CustomRequestParams } from './index.api'
import type { GenerateStatus } from '@/components/image-display'
import type { AddGoodsParams } from '@/views/custom-goods/detail/index.api'
import Decimal from 'decimal.js'
import { isNil } from 'lodash-es'
// import { Icon } from '@iconify/vue'
import { useMessage } from 'naive-ui'
// import { useLayoutMenu } from 'pro-naive-ui'
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// import photoSvg from '@/assets/icon/photo.svg'
import headTemplateImage from '@/assets/images/head-template.png'
// import demoImage from '@/assets/images/demo.png'
import EditableInput from '@/components/editable-input/index.vue'
import { GenerateStatusEnum, TaskStatusEnum } from '@/components/image-display'
import ImageDisplay from '@/components/image-display/index.vue'
import ImageEditorModal from '@/components/image-editor-modal/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
// import { ProMenu } from '@/components/menu'
import { useProRequest } from '@/composables/use-pro-request'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { decodeDataFromHash, encodeDataToHash } from '@/utils/common'
import { Api as DetailApi } from '@/views/custom-goods/detail/index.api'
import { Api as DraftApi } from '@/views/home/components/drafts/index.api'
import { SourceEnum } from '@/views/order-detail/confirm-order/const'
import { Api } from './index.api'

const route = useRoute()
const router = useRouter()
const message = useMessage()
// const {
//   layout,
// } = useLayoutMenu({
//   mode: 'two-column',
//   menus: [
//     {
//       label: $t('routes.basic'),
//       show: true,
//       key: '/basic',
//       icon: () => <img src={photoSvg} class="size-full truncate" />,
//     },
//   ],
// })

const resultUrl = ref<string>('')
const curTemplateMaskUrl = ref('')

// 订单数据
const orderData = ref<AddGoodsParams>()

const goodsDetails = ref<Goods>()
// const carouselRef = useTemplateRef<CarouselInst>('carouselRef')
const scrollbarRef = useTemplateRef<ScrollbarInst>('scrollbarRef')
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
// const curPreviewIndex = ref<number>(0)

// 添加图片选择器的 ref
const imageGallerySelectorRef = ref()
const showImageEditor = ref(false)
const currentSelectorImg = ref<string | null>(null)

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

const {
  data: templateList,
  loading: templateListLoading,
  run: runGetCollectedTemplateList,
} = useProRequest(async () => {
  const params = { goodId: orderData.value?.goodsId as string }
  const result = await Api.getCollectedTemplateList(params)
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

const isShowPrompt = computed(() => {
  // 如果没有选中模板，直接返回 false
  if (!values.value.templateId) {
    return false
  }
  // 查找选中的模板
  const selectedTemplate = templateList.value?.find(t => t.id === values.value.templateId)
  // 如果找不到模板，返回 false
  if (!selectedTemplate) {
    return false
  }
  // 判断 replaceText 是否存在且不为空
  const replaceText = selectedTemplate.replaceText
  return replaceText !== '' && !isNil(replaceText)
})

// 监听模板ID变化，切换时清空prompt和imgUrl
watch(() => values.value.templateId, (newTemplateId, oldTemplateId) => {
  // 当模板ID发生变化时，先清空prompt和imgUrl
  if (newTemplateId !== oldTemplateId && oldTemplateId !== undefined) {
    console.log('123')
    values.value.prompt = ''
    values.value.imgUrl = ''
  }
  curTemplateMaskUrl.value = templateList.value?.find(t => t.id === newTemplateId)?.maskImage || ''
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
    // 如果当前没有选中模板，自动选中第一个
    if (!values.value.templateId && data && data.length > 0) {
      values.value.templateId = data[0].id
    }
    curTemplateMaskUrl.value = templateList.value?.find(t => t.id === values.value.templateId)?.maskImage || ''
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
// const curSelectSide = ref<number>(1)

// 智能分行逻辑
const firstRowProducts = computed(() => {
  const products = templateList.value
  const total = (products || []).length

  if (total <= 3) {
    // 如果总数小于等于3个，只显示一行
    return products
  }
  else if (total <= 6) {
    // 如果总数大于3小于等于6个，第一行显示3个，剩余显示到第二行
    return products.slice(0, 3)
  }
  else {
    // 如果总数大于6个，通过总数除以2进行动态分配
    const midIndex = Math.ceil(total / 2)
    return products.slice(0, midIndex)
  }
})

const secondRowProducts = computed(() => {
  const products = templateList.value
  const total = (products || []).length

  if (total <= 3) {
    // 如果总数小于等于3个，第二行为空
    return []
  }
  else if (total <= 6) {
    // 如果总数大于3小于等于6个，第二行显示剩余商品
    return products.slice(3)
  }
  else {
    // 如果总数大于6个，通过总数除以2进行动态分配
    const midIndex = Math.ceil(total / 2)
    return products.slice(midIndex)
  }
})

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

function handleConfirm(url: string | null) {
  currentSelectorImg.value = url
  showImageEditor.value = true
}

function handleImageEditorConfirm(_: Blob, url: string) {
  if (url) {
    values.value.imgUrl = url
  }
  imageGallerySelectorRef.value.resetAll()
}

function validateAll() {
  if (!values.value.templateId) {
    message.warning($t('customBuy.messages.selectTemplate'))
    return false
  }

  if (isShowPrompt.value && !values.value.prompt) {
    message.warning($t('customBuy.messages.addPrompt'))
    return false
  }

  if (!values.value.imgUrl) {
    message.warning($t('customBuy.messages.addMainImage'))
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
      resultUrl.value = data.resultUrl
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
    resultUrl.value = data.coverImg
    return data
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('customBuy.messages.fetchGoodsInfoFail') as string))
  }
}

async function saveDraft() {
  try {
    const {
      draftId = '',
      goodsId: goodId,
      quantity,
      choice,
    } = orderData.value!
    const params = {
      draftId,
      goodId,
      templateId: values.value.templateId as string,
      draftName: goodsDetails.value!.goodsName,
      draftContent: JSON.stringify({
        ...values.value,
        maojiGoodsId: orderData.value?.goodsId as string,
        templateId: values.value.templateId,
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
  if (!validateAll())
    return
  await saveDraft()
  await runGeneralCustomImage({
    ...values.value,
    maojiGoodsId: String(orderData.value?.goodsId) as string,
    templateId: values.value.templateId,
    draftId: orderData.value?.draftId as string,
  })
}

// 监听URL参数，如果有taskId则启动进度查询
watch(() => route.query.taskId, (taskId) => {
  if (taskId) {
    console.log('检测到taskId参数:', taskId)

    // 从用户store的任务列表中查找对应的任务
    const userStore = useUserStore()
    const task = userStore.pengdingTaskList.find(item => item.taskId.toString() === taskId)

    if (task) {
      console.log('找到对应任务:', task)

      runGetTaskProgress({ taskId: taskId as string })

      // 回显任务数据
      const requestData = typeof task.request === 'string' ? JSON.parse(task.request) : task.request
      if (requestData.customRequest) {
        values.value = {
          ...values.value,
          ...requestData.customRequest,
        }
      }
    }
    else {
      message.warning($t('customBuy.messages.taskNotFound'))
    }
  }
}, { immediate: true })

function handleWheel(event: WheelEvent) {
  if (scrollbarRef.value) {
    // 判断手势决定使用水平滚动量还是纵向滚动量
    scrollbarRef.value.scrollBy({
      left: Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY,
    })
  }
}

function deleteMainImage() {
  values.value.imgUrl = ''
}

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
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('customBuy.messages.addCartFail') as string))
  }
}

function handleBuy() {
  const encodedData = encodeDataToHash({
    goodsInfo: [{
      orderData: orderData.value,
      coverImg: goodsDetails.value!.coverImg,
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
  runGetTaskProgress({ taskId: data.taskId })
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

onMounted(() => {
  parseOrderDataFromHash()
  runGoodsDetail()
  runGetTemplateList()
  if (orderData.value?.draftId) {
    showDraftInfo()
  }
})
</script>

<template>
  <div class="flex h-full">
    <!-- <div class="flex h-full ml--16px">
      <div class="flex h-full w-80px">
        <n-config-provider
          class="w-full"
          :theme-overrides="{
            Menu: {
              itemColorActiveCollapsed: '#FFF',
              itemColorActiveHover: '#FFF',
              itemIconColorActive: '#000',
              itemIconColorActiveHover: '#000',
              itemTextColorActive: '#000',
              itemTextColorActiveHover: '#000',
              itemColorHover: '#fefefe96',
            } }"
        >
          <n-scrollbar class="flex-[1_0_0]">
            <pro-menu
              v-bind="layout.verticalMenuProps"
              value="/basic"
              :indent="18"
              :collapsed-width="80"
              :collapsed-show-title="true"
              :options="layout.verticalMenuProps.options"
            />
          </n-scrollbar>
        </n-config-provider>
      </div>
    </div> -->
    <div class="flex w-full rounded-16px bg-#FFF">
      <div class="flex-1 h-full flex">
        <div class="relative h-[calc(var(--design-vh)-78px-16px)] w-360px border-x-2 box-border border-x-#F7F7F7 border-x-solid">
          <n-scrollbar
            :x-scrollable="false"
            class="size-full"
          >
            <div
              class="w-full w-360px p-y-22px p-x-16px box-border pb-104px flex gap-16px flex-col"
            >
              <div class="flex flex-col gap-8px">
                <span class="text-16px font-bold text-size-16px c-#000000">
                  {{ $t('customBuy.sections.selectTemplate') }}
                </span>
                <div class="w-full flex items-center gap-8px">
                  <div
                    v-for="item in templateCategoryList"
                    :key="item.value"
                    class="border-1px border-solid border-#EEEEEE text-#999999 text-12px rounded-8px flex items-center justify-center cursor-pointer h-28px px-11px py-0 box-border transition-all duration-300"
                    :class="{ 'border-#000000! text-#000000!': selectTemplateCategory === item.value }"
                    @click="changeCategory(item)"
                  >
                    {{ item.label }}
                  </div>
                </div>
                <n-scrollbar
                  ref="scrollbarRef"
                  :x-scrollable="true"
                  :y-scrollable="false"
                  class="product-scrollbar"
                  @wheel.prevent="handleWheel"
                >
                  <div
                    v-loading="templateListLoading"
                    class="product-container min-h-132px"
                  >
                    <!-- 第一行商品 -->
                    <template v-if="templateListLoading || firstRowProducts?.length > 0">
                      <div class="flex gap-6px mb-8px">
                        <div
                          v-for="product in firstRowProducts"
                          :key="product.id"
                          class="product-item relative w-104px h-132px bg-#fff rounded-8px cursor-pointer flex-shrink-0"
                          @click="selectTemplate(product.id)"
                        >
                          <div class="relative w-104px h-104px rounded-8px overflow-hidden">
                            <n-image
                              :ref="(el: any) => { if (el) imageRefs[product.id] = el }"
                              :src="`${product.picUrls[0]}?imageMogr2/thumbnail/284x284`"
                              :preview-src="`${product.picUrls[0]}${product.picUrls[0].includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                              :alt="product.name"
                              class="size-full"
                              object-fit="cover"
                            />
                            <div class="absolute top-4px right-8px z-10">
                              <n-checkbox
                                :checked="values.templateId === product.id"
                                @update:checked="() => selectTemplate(product.id)"
                                @click.stop
                              />
                            </div>

                            <div
                              class="absolute inset-0 bg-#000 bg-opacity-50 rounded-8px flex items-end justify-end pb-4px opacity-0 hover:opacity-100 transition-opacity duration-200"
                            >
                              <div
                                class="w-32px h-32px flex items-center justify-center cursor-pointer"
                                @click.stop="previewImage(product.id)"
                              >
                                <img
                                  src="@/assets/icon/zoom-in.svg"
                                  class="size-20px"
                                >
                              </div>
                            </div>
                          </div>

                          <div class="mt-8px text-12px text-#666 text-center truncate px-4px">
                            {{ product.name }}
                          </div>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="w-full h-full flex items-center justify-center">
                        <img
                          src="@/assets/images/data-null.png"
                          class="w-180px"
                        >
                      </div>
                    </template>
                    <!-- 第二行商品 - 只有当第二行有商品时才显示 -->
                    <div
                      v-if="secondRowProducts.length > 0"
                      class="flex gap-6px"
                    >
                      <div
                        v-for="product in secondRowProducts"
                        :key="product.id"
                        class="product-item relative w-104px h-132px bg-#fff rounded-8px cursor-pointer flex-shrink-0"
                        @click="selectTemplate(product.id)"
                      >
                        <div class="relative w-104px h-104px rounded-8px overflow-hidden">
                          <n-image
                            :ref="(el: any) => { if (el) imageRefs[product.id] = el }"
                            :src="`${product.picUrls[0]}?imageMogr2/thumbnail/284x284`"
                            :preview-src="`${product.picUrls[0]}${product.picUrls[0].includes('?') ? '&' : '?'}response-content-disposition=attachment`"
                            :alt="product.name"
                            class="w-full h-full"
                            object-fit="cover"
                          />

                          <div class="absolute top-4px right-8px z-10">
                            <n-checkbox
                              :checked="values.templateId === product.id"
                              @update:checked="() => selectTemplate(product.id)"
                              @click.stop
                            />
                          </div>

                          <div
                            class="absolute inset-0 bg-#000 bg-opacity-50 rounded-8px flex items-end justify-end pb-4px opacity-0 hover:opacity-100 transition-opacity duration-200"
                          >
                            <div
                              class="w-32px h-32px flex items-center justify-center cursor-pointer"
                              @click.stop="previewImage(product.id)"
                            >
                              <img
                                src="@/assets/icon/zoom-in.svg"
                                class="size-20px"
                              >
                            </div>
                          </div>
                        </div>

                        <div class="mt-8px text-12px text-#666 text-center truncate px-4px">
                          {{ product.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </n-scrollbar>
              </div>
              <div
                v-if="isShowPrompt"
                class="flex flex-col gap-8px"
              >
                <span class="text-16px font-bold text-size-16px c-#000000">
                  {{ $t('customBuy.sections.prompt') }}
                </span>
                <n-input
                  v-model:value="values.prompt"
                  type="textarea"
                  :placeholder="$t('customBuy.placeholders.prompt')"
                  size="small"
                  :autosize="{
                    minRows: 3,
                    maxRows: 5,
                  }"
                />
              </div>
              <div class="flex flex-col gap-8px">
                <span class="text-16px font-bold text-size-16px c-#000000">
                  {{ $t('customBuy.sections.mainImage') }}
                </span>
                <div class="w-full flex flex-wrap gap-12px">
                  <template v-if="values.imgUrl">
                    <div
                      v-for="(item, index) in [values.imgUrl]"
                      :key="index"
                      class="size-100px rounded-12px overflow-hidden relative"
                    >
                      <n-image
                        :src="item"
                        :alt="item"
                        class="w-full h-full flex justify-center"
                        object-fit="cover"
                      />
                      <div
                        class="absolute inset-0 bg-#000 bg-opacity-50 rounded-8px flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                      >
                        <div
                          class="w-32px h-32px flex items-center justify-center cursor-pointer"
                          @click.stop="deleteMainImage()"
                        >
                          <img
                            src="@/assets/icon/trash.svg"
                            class="size-32px"
                          >
                        </div>
                      </div>
                    </div>
                  </template>
                  <image-gallery-selector
                    v-if="!values.imgUrl"
                    ref="imageGallerySelectorRef"
                    :model-value="null"
                    :confirm-text="$t('customBuy.actions.nextStep')"
                    @confirm="handleConfirm"
                  >
                    <div
                      class="size-100px rounded-12px bg-#F7F7F7 flex flex-col items-center justify-center cursor-pointer"
                      @click="imageGallerySelectorRef.openGalleryModal()"
                    >
                      <img src="@/assets/icon/add.svg">
                      <div class="text-#666666 text-12px">
                        {{ $t('customBuy.actions.addFromGallery') }}
                      </div>
                    </div>
                  </image-gallery-selector>
                </div>
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
          <div
            class="absolute bottom-0 left-0 right-0 h-104px box-border p-y-24px p-x-16px bg-#FFF border-t-1px border-t-#E7E7E7"
          >
            <n-button
              class="w-full h-56px"
              color="#FF6A00"
              :disabled="isButtonDisabled"
              size="large"
              @click="handleGenerate"
            >
              <span class="text-#FFF text-16px font-500">{{ buttonText }}</span>
            </n-button>
          </div>
        </div>
        <div class="h-[calc(var(--design-vh)-78px-16px)] flex-1 box-border draw-area p-y-112px p-x-17px relative">
          <div
            v-if="generateStatus === GenerateStatusEnum.FINISHED"
            class="absolute bg-#FFF top-0 left-0 w-full h-40px flex items-center justify-between"
          >
            <div class="max-w-50%">
              <editable-input
                v-model="productName"
                :placeholder="$t('customBuy.placeholders.productName')"
                size="small"
                @change="(newName) => handleImageNameChange(newName)"
              />
            </div>
            <div class="flex items-center gap-8px py-8px px-16px box-border">
              <div class="flex gap-4px items-center">
                <img
                  src="@/assets/icon/finished.svg"
                  class="size-16px"
                >
                <div class="text-#666666">
                  {{ $t('customBuy.messages.savedToDraft') }}
                </div>
              </div>
              <n-button
                size="small"
                @click="handleCollectTemplate"
              >
                {{ $t('customBuy.actions.collectTemplate') }}
              </n-button>
              <n-button
                size="small"
                color="#FFC727"
                @click="handleAddToCart"
              >
                {{ $t('customBuy.actions.addToCart') }}
              </n-button>
              <n-button
                size="small"
                color="#FF6A00"
                @click="handleBuy"
              >
                {{ $t('customBuy.actions.buyNow') }}
              </n-button>
            </div>
          </div>
          <div class="size-full flex gap-21px">
            <div
              class="size-full flex flex-col gap-12px items-center"
            >
              <!-- :class="generateStatus === GenerateStatusEnum.FINISHED ? 'w-70%' : 'w-full'" -->
              <div class="size-full rounded-16px bg-#FFF relative overflow-hidden">
                <!-- 图片展示区域 -->
                <image-display
                  :generate-status="generateStatus"
                  :result-url="resultUrl"
                />
              </div>
              <!-- 多面切换按钮 -->
              <!-- <div
                v-if="generateStatus === GenerateStatusEnum.FINISHED"
                class="w-full flex items-center justify-center gap-16px"
              >
                <div
                  v-for="item in sideList"
                  :key="item.value"
                  class="rounded-8px cursor-pointer border-1px border-solid border-#EEE bg-#FFF px-24px py-2px text-12px text-#999"
                  :class="{ 'border-#000000! text-#000000!': curSelectSide === item.value }"
                  @click="curSelectSide = item.value"
                >
                  {{ item.label }}
                </div>
              </div> -->
            </div>
            <!-- <div
              v-if="generateStatus === GenerateStatusEnum.FINISHED"
              class="flex-1 rounded-16px bg-#FFF flex flex-col h-255px"
            >
              <n-carousel
                ref="carouselRef"
                v-model:current-index="curPreviewIndex"
                class="size-230px"
              >
                <img
                  v-for="item in 4"
                  :key="item"
                  :src="demoImage"
                  class="size-full object-cover"
                >
              </n-carousel>
              <div class="flex items-center justify-center gap-8px select-none">
                <icon
                  icon="material-symbols:keyboard-arrow-left"
                  class="cursor-pointer"
                  @click="carouselRef?.prev()"
                />
                <div>预览图 {{ curPreviewIndex + 1 }} / {{ 4 }} </div>
                <icon
                  icon="material-symbols:keyboard-arrow-right"
                  class="cursor-pointer"
                  @click="carouselRef?.next()"
                />
              </div>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 商品滚动条样式优化 */
.product-scrollbar {
  height: 280px; /* 两行商品的高度 */
  user-select: none;
}

.product-scrollbar :deep(.n-scrollbar-content) {
  padding: 0;
}

.product-scrollbar :deep(.n-scrollbar-rail) {
  background-color: transparent;
}

.product-scrollbar :deep(.n-scrollbar-rail--horizontal) {
  height: 6px;
  bottom: 0;
}

.product-scrollbar :deep(.n-scrollbar-rail--horizontal .n-scrollbar-rail__scrollbar) {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* 商品容器 - 包裹两行商品 */
.product-container {
  width: fit-content;
  min-width: 100%;
}
</style>
