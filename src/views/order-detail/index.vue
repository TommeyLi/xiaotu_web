<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui'
import type { OrderDetail } from './confirm-order/index.api'
import type { LogisticsDetailItem } from './order-result/index.api'
import { NImage, NSpin, useDialog, useMessage } from 'naive-ui'
import { h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactServiceModal } from '@/composables/use-contact-service-modal'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { Api as ShoppingApi } from '@/views/shopping/index.api'
import { Api as OrderResultApi } from './order-result/index.api'

const message = useMessage()
const route = useRoute()
const dialog = useDialog()
const router = useRouter()
const { openContactServiceModal } = useContactServiceModal()
// 订单详情数据
const orderInfo = ref<OrderDetail>()
const loading = ref(false)

// 取消订单弹窗相关
const showCancelModal = ref(false)
const selectedCancelReason = ref('配送信息有误') // 默认选择第一项

// 取消订单原因选项
const cancelReasons = [
  '配送信息有误',
  '商品买错了',
  '重复下单/误下单',
  '忘记使用优惠券',
  '其他渠道价格更低',
  '不想买了',
]

function openCancelModal() {
  showCancelModal.value = true
}

function closeCancelModal() {
  showCancelModal.value = false
}

function confirmCancelOrder() {
  message.success('订单取消成功')
  showCancelModal.value = false
}

const showPaymentModal = ref(false)
const isBalancePayChekcout = ref(true)
function handlerPayment() {
  showPaymentModal.value = true
}

function closeModal() {
  showPaymentModal.value = false
}

function confirmPay() {
  if (!isBalancePayChekcout.value) {
    message.warning('请先选择支付方式')
    return
  }

  dialog.create({
    type: 'warning',
    title: '温馨提示',
    content: '定制品下单后不支持非质量问题的无理由退款退货，请确认是否下单！',
    positiveText: '确定',
    negativeText: '取消',
    positiveButtonProps: {
      color: '#000',
    },
    negativeButtonProps: {
      color: '#000',
    },
    onPositiveClick: () => {
      message.success('支付成功')
      showPaymentModal.value = !showPaymentModal.value
    },
  })
}

async function handlerResetPayment() {
  try {
    const cartIds = orderInfo.value!.orderItemList.map(t => t.cartId)
    await ShoppingApi.recoverCarts({ cartIds })
    router.push('/shopping')
  }
  catch (error: any) {
    console.log(error, 'error')
    message.error(error.response.data.msg || '恢复购物车数据失败，请重试！')
  }
}

function handlerComfirmReceive() {
  dialog.create({
    type: 'warning',
    title: '温馨提示',
    content: '是否确认收货?',
    positiveText: '确定',
    negativeText: '取消',
    positiveButtonProps: {
      color: '#000',
    },
    negativeButtonProps: {
      color: '#000',
    },
    onPositiveClick: () => {
      message.success('收货成功')
      // 重新获取订单详情以更新状态
      getOrderDetail()
    },
  })
}

const timeline = ref<LogisticsDetailItem[]>()
async function getLogisticsInfo() {
  try {
    const { data } = await OrderResultApi.getDeliveryDetail((orderInfo.value!.logisticsList ?? [])[0])
    timeline.value = data
  }
  catch (error: any) {
    message.error(error.response?.data?.msg || '获取物流信息失败，请重试')
  }
}
const showLogisticsModal = ref(false)
async function lookLogistics() {
  await getLogisticsInfo()
  showLogisticsModal.value = true
}
function closeLogisticsModal() {
  showLogisticsModal.value = false
}

function createColumns(): DataTableColumns<any> {
  return [
    {
      title: '商品信息',
      key: 'productInfo',
      width: 300,
      render: (row: any) => {
        const imageRef = ref<any>(null)

        const handleZoomImage = () => {
          imageRef.value?.click()
        }
        return h('div', { class: 'flex items-center gap-12px' }, [
          h('img', {
            src: row.goodsImageUrl,
            alt: '商品图片',
            class: 'size-70px rounded-8px object-cover cursor-pointer',
            onClick: (e: MouseEvent) => {
              e.stopPropagation()
              handleZoomImage()
            },
          }),
          h(NImage, {
            'ref': imageRef,
            'src': row.coverImg,
            'preview-src': row.coverImg,
            'style': { display: 'none' },
            'render-toolbar': createImageToolbar(row.coverImg, false),
          }),
          h('div', { class: 'flex flex-col gap-4px' }, [
            h('div', { class: 'text-#000 font-500 text-14px' }, row.goodsName),
            h('div', { class: 'text-#999 text-12px' }, `尺码：${JSON.parse(row.customParams).size} 颜色：${JSON.parse(row.customParams).color_name}`),
          ]),
        ])
      },
    },
    {
      title: '单价',
      key: 'price',
      width: 100,
      render: (row: any) => {
        return h('div', { class: 'font-500 text-#FF4E47 font-bold text-20px font-din' }, [
          h('span', { class: 'text-12px pr-2px' }, '¥'),
          h('span', { class: 'font-din' }, row.goodsPrice.toFixed(2)),
        ])
      },
    },
    {
      title: '数量',
      key: 'quantity',
      width: 150,
      render: (row: any) => {
        return h('div', { class: 'text-#000' }, row.quantity.toString())
      },
    },
    {
      title: '小计',
      key: 'subtotal',
      width: 100,
      render: (row: any) => {
        return h('div', { class: 'font-500 text-#FF4E47 font-bold text-20px font-din' }, [
          h('span', { class: 'text-12px pr-2px' }, '¥'),
          h('span', { class: 'font-din' }, row.subAmount.toFixed(2)),
        ])
      },
    },
  ]
}

// 格式化时间
function formatDateTime(timeStr: string | null) {
  if (!timeStr)
    return '-'
  return timeStr.split(' ')[0] // 只显示日期部分
}

// 获取订单详情
async function getOrderDetail() {
  try {
    loading.value = true
    const result = await OrderResultApi.getOrderDetail({
      orderId: route.query.orderId as string,
    })
    orderInfo.value = result.data
    console.log('订单详情:', result.data)
  }
  catch (error: any) {
    message.error(error.response?.data?.msg || '获取订单信息失败，请重试')
  }
  finally {
    loading.value = false
  }
}

// 组件挂载时获取订单详情
onMounted(() => {
  getOrderDetail()
})
</script>

<template>
  <div
    v-if="loading"
    class="flex justify-center items-center h-[calc(var(--design-vh)-78px-16px)] "
  >
    <n-spin size="large" />
    <span class="ml-3 text-gray-500">加载中...</span>
  </div>
  <div
    v-else-if="!orderInfo"
    class="flex justify-center items-center h-[calc(var(--design-vh)-78px-16px)] "
  >
    <div class="text-center">
      <div class="text-gray-400 text-6xl mb-4">
        📦
      </div>
      <div class="text-gray-500 text-lg mb-2">
        订单不存在
      </div>
      <div class="text-gray-400 text-sm">
        请检查订单号是否正确
      </div>
    </div>
  </div>
  <div
    v-else
    class="w-full h-[calc(var(--design-vh)-78px-16px)]  flex box-border gap-16px justify-between min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border"
  >
    <div class="w-67% flex flex-col gap-16px">
      <div class="w-full h-191px rounded-16px border-1px border-#F7F7F7 border-solid px-40px box-border flex items-center justify-between bg-#FFF">
        <template v-if="orderInfo?.orderStatus === 0">
          <div class="w-63px flex flex-col items-center gap-4px">
            <img
              src="@/assets/icon/time.svg"
              class="size-56px"
            >
            <span class="c-#000 font-bold">等待付款</span>
          </div>
          <div class="text-#030303">
            付款截止：{{ formatDateTime(orderInfo?.createTime) }}
          </div>
          <div class="flex w-336px h-54px gap-16px">
            <n-button
              type="primary"
              color="#FF6A00"
              class="w-160px h-56px rounded-8px"
              @click="handlerPayment"
            >
              立即付款
            </n-button>
            <n-button
              class="w-160px h-56px rounded-8px"
              @click="openCancelModal"
            >
              取消订单
            </n-button>
          </div>
        </template>
        <template v-else-if="orderInfo?.orderStatus === 4">
          <div class="w-63px flex flex-col items-center gap-4px">
            <img
              src="@/assets/icon/cancel.svg"
              class="size-56px"
            >
            <span class="c-#000 font-bold">已取消</span>
          </div>
          <div class="text-#030303">
            订单已取消
          </div>
          <div class="flex w-336px h-54px gap-16px">
            <n-button
              type="primary"
              color="#FF6A00"
              class="w-160px h-56px rounded-8px"
              @click="handlerResetPayment"
            >
              重新下单
            </n-button>
          </div>
        </template>
        <template v-else-if="orderInfo?.orderStatus === 1">
          <div class="w-63px flex flex-col items-center gap-4px">
            <img
              src="@/assets/icon/drop-shipping.svg"
              class="size-56px"
            >
            <span class="c-#000 font-bold">待发货</span>
          </div>
          <div class="text-#030303">
            定制商品将在6个工作日内发货，请耐心等待
          </div>
          <div class="flex w-336px h-54px gap-16px" />
        </template>
        <template v-else-if="orderInfo?.orderStatus === 2">
          <div class="w-63px flex flex-col items-center gap-4px">
            <img
              src="@/assets/icon/wait-receiving.svg"
              class="size-56px"
            >
            <span class="c-#000 font-bold">待收货</span>
          </div>
          <div class="text-#030303">
            商品已发货，请耐心等待
          </div>
          <div class="flex w-336px h-54px gap-16px">
            <n-button
              type="primary"
              color="#FF6A00"
              class="w-160px h-56px rounded-8px"
              @click="handlerComfirmReceive"
            >
              确认收货
            </n-button>
            <n-button
              class="w-160px h-56px rounded-8px"
              @click="openContactServiceModal"
            >
              申请售后
            </n-button>
          </div>
        </template>
        <template v-else-if="orderInfo?.orderStatus === 3">
          <div class="w-63px flex flex-col items-center gap-4px">
            <img
              src="@/assets/icon/order-finished.svg"
              class="size-56px"
            >
            <span class="c-#000 font-bold">已完成</span>
          </div>
          <div class="text-#030303">
            感谢你对小兔快跑的支持，欢迎再次光临
          </div>
          <div class="flex w-336px h-54px gap-16px">
            <n-button
              type="primary"
              color="#FF6A00"
              class="w-160px h-56px rounded-8px"
              @click="handlerResetPayment"
            >
              再次购买
            </n-button>
            <n-button
              class="w-160px h-56px rounded-8px"
              @click="openContactServiceModal"
            >
              申请售后
            </n-button>
          </div>
        </template>
        <template v-else-if="orderInfo?.orderStatus === 6">
          <div class="w-63px flex flex-col items-center gap-4px">
            <img
              src="@/assets/icon/refund.svg"
              class="size-56px"
            >
            <span class="c-#000 font-bold">已退款</span>
          </div>
          <div class="text-#030303">
            感谢你对小兔快跑的支持，欢迎再次光临
          </div>
          <div class="flex w-336px h-54px gap-16px" />
        </template>
      </div>
      <div class="w-full rounded-16px border-1px border-#F7F7F7 border-solid p-24px box-border bg-#FFF">
        <div class="font-bold text-16px mb-6px">
          商品信息
        </div>
        <div class=" rounded-12px border border-#eee overflow-hidden">
          <n-data-table
            :columns="createColumns()"
            :data="orderInfo?.orderItemList || []"
            :row-key="(row: any) => row.orderItemId"
            :bordered="false"
          />
        </div>
        <div class="mt-16px font-bold text-16px mt-16px mb-6px">
          收货地址
        </div>
        <div class="bg-#FAFAFA rounded-16px gap-4px p-12px box-border">
          <div class="flex items-center">
            <div class="w-70px text-#666666">
              收货人：
            </div>
            <span>{{ orderInfo?.receiverName || '-' }}</span>
          </div>
          <div class="flex items-center">
            <div class="w-70px text-#666666">
              联系方式：
            </div>
            <span>{{ orderInfo?.receiverPhone || '-' }}</span>
          </div>
          <div class="flex items-center">
            <div class="w-70px text-#666666">
              收货地址：
            </div>
            <span>{{ orderInfo?.receiverAddress || '-' }}</span>
          </div>
        </div>
        <template v-if="[2, 3, 6].includes(orderInfo?.orderStatus || 0)">
          <div class="mt-16px bg-#FAFAFA rounded-16px p-16px box-border flex justify-between">
            <div class="flex flex-1 gap-8px">
              <div class="text-#666">
                {{ orderInfo?.shipTime || orderInfo?.createTime || '-' }}
              </div>
              <div>商品已发货，请耐心等待</div>
            </div>
            <n-button
              color="#000"
              class="rounded-8px"
              @click="lookLogistics"
            >
              查看物流
            </n-button>
          </div>
        </template>
      </div>
    </div>
    <div class="w-32% h-fit p-24px box-border rounded-16px flex flex-col bg-#FFF">
      <div class="flex gap-16px flex-col">
        <div class="text-16px font-bold">
          支付详情
        </div>
        <div class="flex flex-col gap-2px pl-20px">
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              商品总价：
            </div>
            <div class="text-#FF4E47">
              <span class="text-12px">¥</span>
              {{ orderInfo?.totalAmount?.toFixed(2) || '0.00' }}
            </div>
          </div>
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              商品优惠：
            </div>
            <div class="text-#FF4E47">
              <span class="text-12px">¥</span>
              {{ orderInfo?.discountAmount?.toFixed(2) || '0.00' }}
            </div>
          </div>
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              运费：
            </div>
            <div class="text-#FF4E47">
              <span class="text-12px">¥</span>
              0.00
            </div>
          </div>
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              应付总额：
            </div>
            <div class="font-500 text-#FF4E47 font-bold text-20px font-din">
              <span class="text-12px">¥</span>
              {{ orderInfo?.payAmount?.toFixed(2) || '0.00' }}
            </div>
          </div>
        </div>
      </div>
      <n-divider />
      <div class="flex gap-16px flex-col">
        <div class="text-16px font-bold">
          订单详情
        </div>
        <div class="flex flex-col gap-2px">
          <div class="w-full flex items-center justify-between text-#000">
            <div>
              订单号：
            </div>
            <div>
              {{ orderInfo?.orderId || '-' }}
            </div>
          </div>
          <div class="w-full flex items-center justify-between text-#000">
            <div>
              下单时间：
            </div>
            <div>
              {{ orderInfo?.createTime || '-' }}
            </div>
          </div>
          <div class="w-full flex items-center justify-between text-#000">
            <div>
              备注：
            </div>
            <div>
              {{ orderInfo?.orderRemark || '无' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <n-modal
    v-model:show="showPaymentModal"
    preset="card"
    header-style="padding-bottom:0px !important"
    style="width: 500px;border-radius: 24px;background-color: #FFF;"
  >
    <template #header>
      <div class="flex gap-4px">
        <div class="text-#000 text-16px!">
          订单号 {{ orderInfo?.orderNo || '-' }}
        </div>
        <n-tag
          :bordered="false"
          type="warning"
          size="small"
        >
          待付款
        </n-tag>
      </div>
    </template>
    <div class="text-#666666">
      下单时间 {{ orderInfo?.createTime || '-' }}
    </div>
    <div class="mt-14px rounded-16px bg-#F7F7F7 w-full box-border p-16px flex flex-col gap-16px">
      <div class="font-bold text-24px color-#000000">
        金额明细
      </div>
      <div class="flex flex-col gap-2px">
        <div class="flex justify-between items-center">
          <span>商品总价：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            {{ orderInfo?.totalAmount?.toFixed(2) || '0.00' }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>商品优惠：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            {{ orderInfo?.discountAmount?.toFixed(2) || '0.00' }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>运费：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            0.00
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>应付总额：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            <span class="font-bold text-24px font-din">{{ orderInfo?.payAmount?.toFixed(2) || '0.00' }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="rounded-12px mt-16px h-46px p-12px box-border">
      <n-checkbox
        v-model:checked="isBalancePayChekcout"
        color="#000"
      >
        <div class="flex items-center">
          <img
            src="@/assets/icon/balance.svg"
            class="size-18px"
          >
          余额支付（可用500.00）
        </div>
      </n-checkbox>
    </div>
    <template #footer>
      <div class="flex gap-3 justify-end">
        <n-button @click="closeModal">
          取消
        </n-button>
        <n-button
          type="primary"
          @click="confirmPay"
        >
          确认支付
        </n-button>
      </div>
    </template>
  </n-modal>
  <!-- 取消订单弹窗 -->
  <n-modal
    v-model:show="showCancelModal"
    preset="card"
    style="width: 500px;border-radius: 24px;background-color: #FFF;"
  >
    <template #header>
      <div class="text-#000 text-16px font-bold">
        取消订单
      </div>
    </template>

    <div class="text-#000000E5 text-14px">
      请确认是否取消订单?可在订单详情页重新下单
    </div>

    <div class="text-#999999 text-14px mt-24px">
      请选择取消订单的原因(必选):
    </div>

    <!-- 取消原因选择 -->
    <div class="grid grid-cols-2 gap-9px mt-8px">
      <div
        v-for="reason in cancelReasons"
        :key="reason"
        class="border-solid border-#EEEEEE border-1px rounded-4px cursor-pointer mt-8px w-216px h-44px box-border flex items-center justify-center"
        :class="selectedCancelReason === reason ? 'border-black' : ''"
        @click="selectedCancelReason = reason"
      >
        <div class="text-14px text-#000">
          {{ reason }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <n-button
          class="border border-gray-300"
          @click="closeCancelModal"
        >
          取消
        </n-button>
        <n-button
          type="primary"
          color="#000"
          @click="confirmCancelOrder"
        >
          提交
        </n-button>
      </div>
    </template>
  </n-modal>
  <n-modal
    v-model:show="showLogisticsModal"
    preset="card"
    style="width: 580px;border-radius: 24px;background-color: #FFF;"
  >
    <template #header>
      <div class="text-#000 text-16px font-bold">
        查看物流
      </div>
    </template>
    <n-scrollbar class="max-h-850px">
      <div class="rounded-8px h-94px w-full p-12px box-border flex gap-12px items-center bg-#F7F7F7">
        <img
          v-if="orderInfo?.orderItemList?.[0]?.goodsImageUrl"
          :src="orderInfo.orderItemList[0].goodsImageUrl"
          class="size-70px rounded-8px overflow-hidden"
        >
        <div class="flex flex-col text-12px">
          <div class="flex">
            <span class="text-#666">
              配送企业：
            </span>
            <span>
              {{ (orderInfo?.logisticsList ?? [])[0]!.deliveryCompany || '-' }}
            </span>
          </div>
          <div class="flex">
            <span class="text-#666">
              快递单号：
            </span>
            <span>
              {{ (orderInfo?.logisticsList ?? [])[0]!.deliveryNo || '暂无' }}
            </span>
          </div>
        <!-- <div class="flex">
          <span class="text-#666">
            联系电话：
          </span>
          <span>
            {{ orderInfo?.logisticsPhone || '暂无' }}
          </span>
        </div> -->
        </div>
      </div>
      <!-- 时间线 -->
      <n-timeline class="mt-16px">
        <n-timeline-item
          v-for="(item, index) in timeline"
          :key="index"
          :type="index === 0 ? 'warning' : 'default'"
          :title="item.context"
          :time="item.time"
        />
      </n-timeline>
    </n-scrollbar>
    <template #footer>
      <div class="flex gap-3 justify-end">
        <n-button
          type="primary"
          color="#000"
          @click="closeLogisticsModal"
        >
          确定
        </n-button>
      </div>
    </template>
  </n-modal>
</template>
