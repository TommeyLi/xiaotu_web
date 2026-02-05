<script setup lang="ts">
import type { OrderInfo } from './index.api'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { $t } from '@/locales/locales'
import { decodeDataFromHash } from '@/utils/common'
import { Api } from './index.api'

const route = useRoute()
const message = useMessage()
const router = useRouter()

const orderInfo = ref<OrderInfo>()

const isSuccess = computed(() => orderInfo.value?.status === 'success')

const paymentAmount = ref()

function goToHome() {
  router.push('/')
}

function viewOrder() {
  router.push({
    name: 'OrderDetail',
    query: {
      orderId: orderInfo.value!.orderId,
    },
  })
}

function reorder() {
  router.push({
    name: 'ConfirmOrder',
    hash: orderInfo.value!.oldOrderHash,
  })
}

function viewShoppingCart() {
  router.push('/shopping')
}

async function getOrderDetail() {
  try {
    const result = await Api.getOrderDetail({
      orderId: orderInfo.value!.orderId,
    })
    paymentAmount.value = result.data.totalAmount
    console.log(result, 'result')
  }
  catch (error: any) {
    message.error(error.response.data.msg || ($t('orderResult.messages.fetchFail') as string))
  }
}

function parseOrderDataFromHash() {
  try {
    if (route.hash) {
      const final = route.hash.split('#data=')[1]
      orderInfo.value = decodeDataFromHash<OrderInfo>(final)
      console.log('从 hash 解析到的订单数据:', orderInfo.value)
    }
  }
  catch (error) {
    console.error('解析订单数据失败:', error)
  }
}

onMounted(() => {
  parseOrderDataFromHash()
  if (isSuccess.value) {
    getOrderDetail()
  }
  else {
    paymentAmount.value = orderInfo.value!.totalPrice
  }
})
</script>

<template>
  <div class="h-[calc(var(--design-vh)-78px-16px)]  bg-gray-50 flex items-center justify-center min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border">
    <div class="max-w-md w-full text-center">
      <div class="mb-6">
        <div
          v-if="isSuccess"
          class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto"
        >
          <svg
            class="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div
          v-else
          class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto"
        >
          <svg
            class="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      <!-- 主标题 -->
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        {{ isSuccess ? $t('orderResult.title.success') : $t('orderResult.title.fail') }}
      </h1>

      <!-- 描述信息 -->
      <div class="text-gray-600 mb-6">
        <p v-if="isSuccess">
          {{ $t('orderResult.desc.success') }}
        </p>
        <p v-else>
          {{ $t('orderResult.desc.fail') }}
        </p>
      </div>

      <!-- 支付信息（仅成功状态显示） -->
      <div
        v-if="isSuccess"
        class="bg-gray-50 my-24px text-center w-full flex items-center justify-center"
      >
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-600">{{ $t('orderResult.labels.payMethod') }}：</span>
            <span class="text-orange-500 font-medium">{{ $t('orderResult.payMethod.balance') }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">{{ $t('orderResult.labels.payAmount') }}：</span>
            <span class="flex-1 text-orange-500 font-medium text-left font-din">
              <span class="text-12px pr-2px">¥</span>
              {{ paymentAmount }}
            </span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-around">
        <n-button
          v-if="isSuccess"
          type="primary"
          color="#FF6A00"
          class="w-47% h-12 rounded-lg"
          @click="goToHome"
        >
          {{ $t('orderResult.actions.backHome') }}
        </n-button>
        <n-button
          v-if="isSuccess"
          class="w-47% h-12 rounded-lg border-gray-300"
          @click="viewOrder"
        >
          {{ $t('orderResult.actions.viewOrder') }}
        </n-button>

        <n-button
          v-if="!isSuccess"
          type="primary"
          color="#FF6A00"
          class="w-47%  h-12 rounded-lg"
          @click="reorder"
        >
          {{ $t('orderResult.actions.reorder') }}
        </n-button>
        <n-button
          v-if="!isSuccess"
          class="w-47%  h-12 rounded-lg border-gray-300"
          @click="viewShoppingCart"
        >
          {{ $t('orderResult.actions.viewCart') }}
        </n-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保按钮样式正确 */
.n-button {
  font-weight: 500;
}
</style>
