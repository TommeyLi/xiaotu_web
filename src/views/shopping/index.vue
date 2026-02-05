<script setup lang="tsx">
import type { ProDataTableColumns } from 'pro-naive-ui'
import type { GoodsItem } from './index.api'
import Decimal from 'decimal.js'
import { NButton, NImage, useDialog, useMessage } from 'naive-ui'
import { useNDataTable } from 'pro-naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import QuantityInput from '@/components/quantity-input/index.vue'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { encodeDataToHash } from '@/utils/common'
import { SourceEnum } from '../order-detail/confirm-order/const'
import { Api } from './index.api'

const message = useMessage()
const dialog = useDialog()
const router = useRouter()

// 防抖状态管理
const loadingStates = ref({
  updateQuantity: new Set<string>(), // 正在更新数量的商品ID集合
  deleteItem: new Set<string>(), // 正在删除的商品ID集合
  deleteSelected: false, // 是否正在删除选中商品
  checkout: false, // 是否正在下单结算
})

// 使用 pro-data-table
const { table } = useNDataTable(({
  current,
  pageSize,
  sorter,
  filters,
}) => fetchCartList({ current, pageSize, sorter, filters }))

const { tableProps } = table

// 获取购物车商品列表
async function fetchCartList(params: any) {
  try {
    const { data } = await Api.getGoodsList({
      pageNum: params.current || 1,
      pageSize: params.pageSize || 100,
    })
    return { list: data.records, total: Number(data.total) }
  }
  catch (error: any) {
    console.error('获取购物车商品失败:', error)
    message.error(error.response?.data?.msg || '获取购物车商品失败，请稍后再试')
    return { list: [], total: 0, pageNum: 1, pageSize: 10 }
  }
}

// 全选状态
const isAllSelected = computed(() => {
  const cartItems = tableProps.value.data || []
  return cartItems.length > 0 && cartItems.every((item: GoodsItem) => item.isSelected === 1)
})

// 选中商品数量
const selectedCount = computed(() => {
  const cartItems = tableProps.value.data || []
  return cartItems.filter((item: GoodsItem) => item.isSelected === 1).length
})

// 总商品数量
const totalCount = computed(() => {
  const cartItems = tableProps.value.data || []
  return cartItems.length
})

// 选中商品总价
const selectedTotalPrice = computed(() => {
  const cartItems = tableProps.value.data || []
  return cartItems
    .filter((item: GoodsItem) => item.isSelected === 1)
    .reduce((total: number, item: GoodsItem) => total + item.subAmount, 0)
})

// 表格列定义
const columns = ref<ProDataTableColumns<GoodsItem>>([
  {
    type: 'selection',
    width: 50,
  },
  {
    title: $t('shopping.table.productInfo') as string,
    key: 'productInfo',
    width: 300,
    render: (row: GoodsItem) => {
      const goodsInfo = JSON.parse(row.customParams)
      const imageRef = ref<any>(null)

      const handleZoomImage = () => {
        imageRef.value?.click()
      }
      return (
        <div class="flex items-center gap-12px">
          <img
            src={row.goodsImageUrl}
            alt={$t('shopping.labels.productImage') as string}
            onClick={(e) => {
              e.stopPropagation()
              handleZoomImage()
            }}
            class="size-70px rounded-8px object-cover cursor-pointer"
          />
          <NImage
            ref={imageRef}
            src={row.goodsImageUrl}
            preview-src={row.goodsImageUrl}
            style={{ display: 'none' }}
            render-toolbar={createImageToolbar(row.goodsImageUrl, false)}
          />
          <div class="flex flex-col gap-4px">
            <div class="text-#000 font-400 text-14px">{row.goodsName}</div>
            <div class="text-#999 text-12px">
              {$t('shopping.labels.size')}
              {' '}
              {goodsInfo?.size ?? '-'}
              {' '}
              {$t('shopping.labels.color')}
              {' '}
              {goodsInfo?.color_name ?? '-'}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    title: $t('shopping.table.price') as string,
    key: 'price',
    width: 100,
    render: (row: GoodsItem) => (
      <div class="font-500 text-#FF4E47 font-bold text-20px">
        <span class="text-12px pr-2px">¥</span>
        <span class="font-din">{row.goodsPrice.toString()}</span>
      </div>
    ),
  },
  {
    title: $t('shopping.table.quantity') as string,
    key: 'quantity',
    width: 150,
    render: (row: GoodsItem) => (
      <QuantityInput
        modelValue={row.quantity}
        min={1}
        max={999}
        disabled={loadingStates.value.updateQuantity.has(row.cartId)}
        onUpdate:modelValue={async (value: number) => {
          await updateQuantity(row.cartId, value)
        }}
      />
    ),
  },
  {
    title: $t('shopping.table.subtotal') as string,
    key: 'subtotal',
    width: 100,
    render: (row: GoodsItem) => (
      <div class="font-500 text-#FF4E47 font-bold text-20px font-din">
        <span class="text-12px pr-2px">¥</span>
        <span class="font-din">{row.subAmount.toString()}</span>
      </div>
    ),
  },
  {
    title: $t('shopping.table.actions') as string,
    key: 'actions',
    width: 100,
    render: (row: GoodsItem) => (
      <div class="flex justify-start items-start">
        <NButton
          text
          type="warning"
          class="text-14px"
          loading={loadingStates.value.deleteItem.has(row.cartId)}
          disabled={loadingStates.value.deleteItem.has(row.cartId)}
          onClick={() => deleteItem(row.cartId)}
        >
          {$t('common.often.delete')}
        </NButton>
      </div>
    ),
  },
])

// 更新商品数量
async function updateQuantity(cartId: string, quantity: number) {
  // 防抖检查：如果该商品正在更新中，则忽略本次请求
  if (loadingStates.value.updateQuantity.has(cartId)) {
    return
  }

  // 标记为正在更新
  loadingStates.value.updateQuantity.add(cartId)

  try {
    await Api.updateQuantity({
      cartId,
      quantity: quantity.toString(),
    })
    // 更新本地数据
    const cartItems = tableProps.value.data || []
    const item = cartItems.find((item: GoodsItem) => item.cartId === cartId)
    if (item) {
      item.quantity = quantity
      item.subAmount = new Decimal(item.goodsPrice).mul(quantity).toNumber()
    }
    message.success($t('shopping.messages.updateQuantitySuccess'))
  }
  catch (error: any) {
    console.error('更新数量失败:', error)
    message.info(error.response?.data?.msg || ($t('shopping.messages.updateQuantityFail') as string))
    // 重新获取数据以保持同步
    table.onChange()
  }
  finally {
    // 移除更新状态
    loadingStates.value.updateQuantity.delete(cartId)
  }
}

// 全选/取消全选
function toggleSelectAll() {
  const newSelectAll = !isAllSelected.value
  const cartItems = tableProps.value.data || []
  cartItems.forEach((item: GoodsItem) => {
    item.isSelected = newSelectAll ? 1 : 0
  })
}

// 删除单个商品
function deleteItem(cartId: string) {
  // 防抖检查：如果该商品正在删除中，则忽略本次请求
  if (loadingStates.value.deleteItem.has(cartId)) {
    return
  }

  dialog.warning({
    title: $t('shopping.dialogs.removeOneTitle'),
    content: $t('shopping.dialogs.removeOneContent'),
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      // 标记为正在删除
      loadingStates.value.deleteItem.add(cartId)

      try {
        await Api.removeGoodsRecords({
          cartIds: [cartId],
        })
        // 重新加载数据
        table.onChange()
        useUserStore().fetchUpdateUserInfo()
        message.success($t('shopping.messages.deleteSuccess'))
      }
      catch (error: any) {
        console.error('删除商品失败:', error)
        message.error(error.response?.data?.msg || ($t('shopping.messages.deleteFail') as string))
      }
      finally {
        // 移除删除状态
        loadingStates.value.deleteItem.delete(cartId)
      }
    },
  })
}

// 删除选中商品
function deleteSelected() {
  if (selectedCount.value === 0) {
    message.warning($t('shopping.messages.chooseItemsToDelete'))
    return
  }

  // 防抖检查：如果正在删除选中商品，则忽略本次请求
  if (loadingStates.value.deleteSelected) {
    return
  }

  dialog.warning({
    title: $t('shopping.dialogs.removeSelectedTitle'),
    content: $t('shopping.dialogs.removeSelectedContent', { count: selectedCount.value }) as string,
    positiveText: $t('common.often.confirm'),
    negativeText: $t('common.often.cancel'),
    positiveButtonProps: { color: '#000' },
    negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
    onPositiveClick: async () => {
      // 标记为正在删除
      loadingStates.value.deleteSelected = true

      try {
        const cartItems = tableProps.value.data || []
        const selectedCartIds = cartItems
          .filter((item: GoodsItem) => item.isSelected === 1)
          .map((item: GoodsItem) => item.cartId)

        await Api.removeGoodsRecords({
          cartIds: selectedCartIds,
        })

        // 重新加载数据
        table.onChange()
        useUserStore().fetchUpdateUserInfo()
        message.success($t('shopping.messages.deleteSelectedSuccess', { count: selectedCount.value }) as string)
      }
      catch (error: any) {
        console.error('删除选中商品失败:', error)
        message.error(error.response?.data?.msg || ($t('shopping.messages.deleteSelectedFail') as string))
      }
      finally {
        // 移除删除状态
        loadingStates.value.deleteSelected = false
      }
    },
  })
}

// 下单结算
function checkout() {
  if (selectedCount.value === 0) {
    message.warning($t('shopping.messages.chooseItemsToCheckout'))
    return
  }

  // 防抖检查：如果正在下单结算，则忽略本次请求
  if (loadingStates.value.checkout) {
    return
  }

  // 标记为正在结算
  loadingStates.value.checkout = true

  try {
    const cartItems = tableProps.value.data || []
    const selectedItems = cartItems.filter((item: GoodsItem) => item.isSelected === 1)
    const shoppingIds = selectedItems.map((item: GoodsItem) => item.cartId)
    const goodsInfo = selectedItems.map((item: GoodsItem) => {
      return {
        orderData: {
          goodsId: item.goodsId,
          quantity: item.quantity,
          draftId: item.draftId,
          templateId: item.templateId,
          choice: JSON.parse(item.customParams),
        },
        coverImg: item.goodsImageUrl,
        goodsName: item.goodsName,
        realPrice: item.goodsPrice,
      }
    })

    console.log('总计:', selectedTotalPrice.value)
    console.log('选中商品ID:', shoppingIds)

    const encodedData = encodeDataToHash({
      goodsInfo,
      source: SourceEnum.SHOPPING,
      shoppingIds,
      totalPrice: selectedTotalPrice.value,
    })
    router.push({
      name: 'ConfirmOrder',
      hash: `#data=${encodedData}`,
    })
  }
  finally {
    // 延迟移除结算状态，防止用户快速连续点击
    setTimeout(() => {
      loadingStates.value.checkout = false
    }, 1000)
  }
}

// 处理表格选中状态变化
function handleCheck(rowKeys: (string | number)[]) {
  const cartItems = tableProps.value.data || []
  cartItems.forEach((item: GoodsItem) => {
    item.isSelected = rowKeys.includes(item.cartId) ? 1 : 0
  })
}
</script>

<template>
  <div class="w-full h-[calc(var(--design-vh)-78px-16px)] bg-#FFF rounded-16px p-24px box-border flex flex-col min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border">
    <div class="flex-1 overflow-hidden">
      <div class="bg-white size-full rounded-8px border border-#eee overflow-hidden">
        <pro-data-table
          :theme-overrides="{
            borderColor: 'rgba(0,0,0,0)',
          }"
          class="size-full"
          :columns="columns"
          row-key="cartId"
          v-bind="tableProps"
          :checked-row-keys="(tableProps.data || []).filter((item: GoodsItem) => item.isSelected === 1).map((item: GoodsItem) => item.cartId)"
          :bordered="false"
          :single-line="false"
          :paginate-single-page="false"
          @update:checked-row-keys="handleCheck"
        />
      </div>
    </div>

    <!-- 固定在底部的操作栏 -->
    <div class="flex justify-between items-center mt-16px bg-white rounded-8px p-16px border border-#eee flex-shrink-0">
      <!-- 左侧操作 -->
      <div class="flex items-center gap-16px">
        <n-checkbox
          :checked="isAllSelected"
          @update:checked="toggleSelectAll"
        >
          {{ $t('shopping.toolbar.selectAll') }}
        </n-checkbox>
        <n-button
          ghost
          :loading="loadingStates.deleteSelected"
          :disabled="loadingStates.deleteSelected"
          @click="deleteSelected"
        >
          {{ $t('shopping.toolbar.deleteSelected') }}
        </n-button>
      </div>

      <!-- 右侧信息 -->
      <div class="flex items-center gap-16px">
        <div class="text-14px text-#666 font-['PingFang_SC']">
          共<span class="text-18px text-#FF6A00 px-4px">{{ totalCount }}</span>件商品, 已选择<span class="text-18px text-#FF6A00 px-4px">{{ selectedCount }}</span>件 | 共计(不含运费):
        </div>
        <div class="text-#FF4E47 font-bold text-24px font-din">
          <span class="text-12px pr-2px">¥</span>
          {{ selectedTotalPrice.toFixed(2) }}
        </div>
        <n-button
          type="primary"
          color="#FF6A00"
          size="large"
          class="rounded-8px px-24px py-12px min-w-255px"
          :loading="loadingStates.checkout"
          :disabled="loadingStates.checkout"
          @click="checkout"
        >
          {{ $t('shopping.toolbar.checkout') }}
        </n-button>
      </div>
    </div>
  </div>
</template>
