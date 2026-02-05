<script setup lang="ts">
import type { OrderDetail } from '@/views/order-detail/confirm-order/index.api'
import { useIntervalFn } from '@vueuse/core'
import { useDialog, useMessage } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { $t } from '@/locales/locales'
import { Api } from './index.api'

const router = useRouter()
const dialog = useDialog()
const message = useMessage()

const activeTab = ref<string | number>(-1)
const orderModeList = [
  {
    label: $t('myOrder.tabs.all'),
    value: -1,
  },
  {
    label: $t('myOrder.tabs.pending'),
    value: 0,
  },
  {
    label: $t('myOrder.tabs.paid'),
    value: 1,
  },
  {
    label: $t('myOrder.tabs.shipped'),
    value: 2,
  },
  {
    label: $t('myOrder.tabs.completed'),
    value: 3,
  },
  {
    label: $t('myOrder.tabs.refunded'),
    value: 6,
  },
]

// 订单列表数据
const orders = ref<OrderDetail[]>([])
const loading = ref(false)
const total = ref(0)

// 分页参数
const pagination = ref({
  page: 1,
  pageSize: 10,
})

/** 倒计时逻辑 */
const countdowns = ref<Record<string, string>>({})

// 格式化倒计时时间（暂时未使用，可根据需要启用）
// function formatCountdownTime(seconds: number) {
//   const m = Math.floor(seconds / 60)
//   const s = seconds % 60
//   return `剩余${m.toString().padStart(2, '0')}时${s.toString().padStart(2, '0')}分`
// }

// 获取订单列表
async function getOrderList() {
  try {
    loading.value = true

    const params: any = {
      pageNum: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }

    // 全部订单（-1）时不传 orderStatus，其他情况直接使用标签页值
    if (activeTab.value !== -1) {
      params.orderStatus = activeTab.value
    }

    const result = await Api.getOrderList(params)
    orders.value = result.data.list
    total.value = result.data.total
  }
  catch (error: any) {
    message.error(error.response?.data?.msg || ($t('myOrder.messages.fetchFail') as string))
  }
  finally {
    loading.value = false
  }
}

// 分页变化处理
function handlePageChange(page: number) {
  pagination.value.page = page
  getOrderList()
}

// 标签页变化处理
async function handleTabChange(value: string | number) {
  activeTab.value = value
  pagination.value.page = 1 // 切换标签时重置到第一页
  await getOrderList()
}

// 格式化时间
function formatDateTime(timeStr: string | null) {
  if (!timeStr)
    return '-'
  return timeStr.split(' ')[0] // 只显示日期部分
}

// 获取订单状态显示文本
function getOrderStatusText(status: number) {
  const statusMap: Record<number, string> = {
    0: $t('myOrder.status.pending'),
    1: $t('myOrder.status.paid'),
    2: $t('myOrder.status.shipped'),
    3: $t('myOrder.status.completed'),
    4: $t('myOrder.status.cancelled'),
    5: $t('myOrder.status.refunding'),
    6: $t('myOrder.status.refunded'),
  }
  return statusMap[status] || $t('myOrder.status.unknown')
}

useIntervalFn(() => {
  orders.value.forEach((order) => {
    // 待付款状态才需要倒计时
    if (order.orderStatus === 1) {
      // 这里可以根据实际需求处理倒计时逻辑
      // 暂时显示固定文本
      countdowns.value[order.orderId] = $t('myOrder.countdown.remaining', { hours: 23, minutes: 59 })
    }
  })
}, 1000)

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
    message.warning($t('myOrder.messages.selectPayMethod'))
    return
  }

  dialog.create({
    type: 'warning',
    title: $t('myOrder.dialogs.payTitle'),
    content: $t('myOrder.dialogs.payContent'),
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: {
      color: '#000',
    },
    negativeButtonProps: {
      color: '#000',
    },
    onPositiveClick: () => {
      message.success($t('myOrder.messages.paySuccess'))
      showPaymentModal.value = !showPaymentModal.value
    },
  })
}

// 取消订单弹窗相关
const showCancelModal = ref(false)
const selectedCancelReason = ref($t('myOrder.cancelReasons.deliveryInfoError')) // 默认选择第一项

// 取消订单原因选项
const cancelReasons = [
  $t('myOrder.cancelReasons.deliveryInfoError'),
  $t('myOrder.cancelReasons.wrongProduct'),
  $t('myOrder.cancelReasons.duplicateOrder'),
  $t('myOrder.cancelReasons.forgotCoupon'),
  $t('myOrder.cancelReasons.lowerPrice'),
  $t('myOrder.cancelReasons.notWant'),
]

// function openCancelModal() {
//   showCancelModal.value = true
// }

function closeCancelModal() {
  showCancelModal.value = false
}

function confirmCancelOrder() {
  message.success($t('myOrder.messages.cancelSuccess'))
  showCancelModal.value = false
}

// 组件挂载时获取订单列表
onMounted(() => {
  getOrderList()
})
</script>

<template>
  <div class="w-full h-[calc(var(--design-vh)-78px-16px)] bg-#FFF rounded-16px p-24px box-border flex flex-col min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border">
    <n-scrollbar
      :x-scrollable="false"
      class="w-full h-full"
    >
      <div class="w-full flex sticky top-0 left-0 bg-#FFF z-10 outline outline-1 outline-white">
        <n-config-provider
          :theme-overrides="{
            Tabs: {
              tabGapLargeLine: '24px',
              barColor: 'transparent',
              tabFontWeightActive: 600,
              tabTextColorLine: '#999999',
              tabBorderColor: 'transparent',
              tabTextColorHoverLine: '#000000',
              tabTextColorActiveLine: '#000000',
              tabPaddingLargeLine: '0',
              tabFontSizeLarge: '16px',
            },
          }"
        >
          <n-tabs
            v-model:value="activeTab"
            type="line"
            size="large"
            @update:value="handleTabChange"
          >
            <n-tab
              v-for="n in orderModeList"
              :key="n.value"
              :name="n.value"
            >
              {{ n.label }}
            </n-tab>
          </n-tabs>
        </n-config-provider>
      </div>
      <div class="mt-16px">
        <!-- 表头 -->
        <div
          class="grid select-none grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] bg-white text-#666 text-14px pb-5px pt-16px sticky outline outline-1 outline-white top-25px left-0 z-10"
        >
          <div>{{ $t('myOrder.table.productInfo') }}</div>
          <div>{{ $t('myOrder.table.price') }}</div>
          <div>{{ $t('myOrder.table.quantity') }}</div>
          <div>{{ $t('myOrder.table.total') }}</div>
          <div>{{ $t('myOrder.table.status') }}</div>
          <div class="text-center">
            {{ $t('myOrder.table.actions') }}
          </div>
        </div>

        <!-- 加载状态 -->
        <div
          v-if="loading"
          class="flex justify-center items-center py-20"
        >
          <n-spin size="large" />
          <span class="ml-3 text-gray-500">{{ $t('common.often.loading') || '加载中...' }}</span>
        </div>

        <!-- 空状态 -->
        <div
          v-else-if="!loading && orders.length === 0"
          class="text-center py-20"
        >
          <div class="text-gray-400 text-6xl mb-4">
            📦
          </div>
          <div class="text-gray-500 text-lg mb-2">
            {{ $t('myOrder.empty.title') }}
          </div>
          <div class="text-gray-400 text-sm">
            {{ $t('myOrder.empty.desc') }}
          </div>
        </div>

        <!-- 表格主体 -->
        <div
          v-for="order in orders"
          v-else
          :key="order.orderId"
          class="mt-16px border border-#eee rounded-4px overflow-hidden"
        >
          <!-- 顶部信息行 -->
          <div class="flex justify-between items-center bg-#F7F7F7 text-14px h-40px px-16px box-border">
            <div class="flex gap-24px">
              <div class="text-#000">
                {{ $t('myOrder.labels.orderTime') }}：{{ formatDateTime(order.createTime) }}
              </div>
              <div class="text-#000">
                {{ $t('myOrder.labels.orderId') }}：{{ order.orderId }}
              </div>
              <div class="text-#000">
                {{ $t('myOrder.labels.orderAccount') }}：{{ order.userName || $t('myOrder.labels.user') }}
              </div>
            </div>
            <!-- <div
              v-if="order.orderStatus === 1"
              class="flex items-center gap-8px text-#FF6A00"
            >
              <img
                src="@/assets/icon/time.svg"
                class="size-18px"
              >
              <span>付款截止：</span>
              <span>{{ countdowns[order.orderId] || '剩余时间' }}</span>
            </div> -->
          </div>

          <!-- 商品列表 -->
          <div
            v-for="item in order.orderItemList"
            :key="item.orderItemId"
            class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center bg-white py-16px px-10px text-14px border-b border-gray-100 last:border-b-0"
          >
            <!-- 商品信息 -->
            <div class="flex items-center gap-12px">
              <img
                :src="item.goodsImageUrl"
                :alt="item.goodsName"
                class="size-70px rounded-8px object-cover"
              >
              <div class="flex flex-col gap-4px">
                <div class="text-#000 font-500">
                  {{ item.goodsName }}
                </div>
                <div class="text-#999 text-12px">
                  {{ `${$t('myOrder.labels.size')}：${JSON.parse(item.customParams).size} ${$t('myOrder.labels.color')}：${JSON.parse(item.customParams).color_name}` }}
                </div>
              </div>
            </div>

            <!-- 单价 -->
            <div class="font-500 text-#FF4E47 font-bold text-20px font-din">
              <span class="text-12px pr-2px">¥</span>
              {{ item.goodsPrice.toFixed(2) }}
            </div>

            <!-- 数量 -->
            <div class="text-#000">
              {{ item.quantity }}
            </div>

            <!-- 小计 -->
            <div class="text-#000 text-12px flex flex-col items-start">
              <div class="flex flex-col">
                <div class="text-#FF4E47 font-din">
                  <span class="text-12px pr-2px">¥</span>
                  <span class="text-20px font-bold font-din">{{ item.subAmount.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- 订单状态 -->
            <div class="text-#000">
              {{ getOrderStatusText(order.orderStatus) }}
            </div>

            <!-- 操作 -->
            <div class="flex flex-col gap-8px items-center">
              <n-button
                v-if="order.orderStatus === 0"
                color="#FF6A00"
                class="h-28px rounded-8px"
                @click="handlerPayment"
              >
                {{ $t('myOrder.actions.payNow') }}
              </n-button>
              <n-button
                text
                @click="router.push(`/order-detail?orderId=${order.orderId}`)"
              >
                {{ $t('myOrder.actions.viewDetail') }}
              </n-button>
              <!-- <n-button
                v-if="order.orderStatus === 1"
                text
                @click="openCancelModal"
              >
                取消订单
              </n-button> -->
            </div>
          </div>
        </div>

        <!-- 分页器 -->
        <div
          v-if="Number(total) > 0"
          class="absolute bottom-0 w-full flex justify-center bg-white pt-5px"
        >
          <n-pagination
            v-model:page="pagination.page"
            :page-size="pagination.pageSize"
            :item-count="Number(total)"
            :show-size-picker="true"
            :page-sizes="[10, 20, 50]"
            show-quick-jumper
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </n-scrollbar>
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
          {{ $t('myOrder.paymentModal.orderId') }} 23456764345676543234567
        </div>
        <n-tag
          :bordered="false"
          type="warning"
          size="small"
        >
          {{ $t('myOrder.status.pending') }}
        </n-tag>
      </div>
    </template>
    <div class="text-#666666">
      {{ $t('myOrder.paymentModal.orderTime') }} 2024-09-08 16:20
    </div>
    <div class="mt-14px rounded-16px bg-#F7F7F7 w-full box-border p-16px flex flex-col gap-16px">
      <div class="font-bold text-24px color-#000000">
        {{ $t('myOrder.paymentModal.amountDetail') }}
      </div>
      <div class="flex flex-col gap-2px">
        <div class="flex justify-between items-center">
          <span>{{ $t('myOrder.paymentModal.goodsTotal') }}：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            79.00
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>{{ $t('myOrder.paymentModal.discount') }}：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            1.00
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>{{ $t('myOrder.paymentModal.freight') }}：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            0
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>{{ $t('myOrder.paymentModal.payable') }}：</span>
          <span class="text-#FF4E47 font-din">
            <span class="text-12px pr-2px">¥</span>
            <span class="font-bold text-24px">79.00</span>
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
          {{ $t('myOrder.paymentModal.balancePay', { amount: '500.00' }) }}
        </div>
      </n-checkbox>
    </div>
    <template #footer>
      <div class="flex gap-3 justify-end">
        <n-button @click="closeModal">
          {{ $t('common.often.cancel') }}
        </n-button>
        <n-button
          type="primary"
          @click="confirmPay"
        >
          {{ $t('myOrder.actions.confirmPay') }}
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
        {{ $t('myOrder.cancelModal.title') }}
      </div>
    </template>

    <div class="text-#000000E5 text-14px">
      {{ $t('myOrder.cancelModal.content') }}
    </div>

    <div class="text-#999999 text-14px mt-24px">
      {{ $t('myOrder.cancelModal.selectReason') }}
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
          {{ $t('common.often.cancel') }}
        </n-button>
        <n-button
          type="primary"
          color="#000"
          @click="confirmCancelOrder"
        >
          {{ $t('common.often.submit') }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
:deep(.n-tabs-tab--active) {
  font-size: 18px;
}
</style>
