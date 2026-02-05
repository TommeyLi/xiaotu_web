<script setup lang="tsx">
import type { DataTableColumns } from 'naive-ui'
import type { GoodsItem, ReceiveRouteQuery } from './index.api'
import type { AddressItem } from '@/views/personal-center/components/address-manage/index.api'
import Decimal from 'decimal.js'
import { NImage, useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuantityInput from '@/components/quantity-input/index.vue'
import { createImageToolbar } from '@/composables/useImageToolbar'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import { decodeDataFromHash, encodeDataToHash } from '@/utils/common'
import AddressModal from '@/views/personal-center/components/address-manage/address-modal.vue'
import { Api as AddressApi } from '@/views/personal-center/components/address-manage/index.api'
import { Api as ShoppingApi } from '@/views/shopping/index.api'
import { SourceEnum } from './const'
import { Api } from './index.api'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const {
  user,
} = storeToRefs(useUserStore())

// 路由参数数据
const routeQueryData = ref<ReceiveRouteQuery>()

// 支付相关状态
const isBalancePayChekcout = ref(true)

// 地址相关状态
const showAddressModal = ref(false)
const showAddressSelectModal = ref(false)
const isEditMode = ref(false)
const editingAddress = ref<AddressItem | null>(null)
const selectedAddressId = ref<string | null>(null)
const addressList = ref<AddressItem[]>([])
const addressLoading = ref(false)

// 当前选中的地址
const currentAddress = ref<AddressItem | null>(null)

const remark = ref('')

// 格式化手机号（中间四位加密）
const formattedPhone = computed(() => {
  if (!currentAddress.value?.receiverPhone)
    return ''
  const phone = currentAddress.value.receiverPhone
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(7)}`
  }
  return phone
})

const totalPrice = computed(() => {
  if (!routeQueryData.value?.goodsInfo)
    return 0
  const total = routeQueryData.value.goodsInfo.reduce((total, item) => {
    return new Decimal(total).add(new Decimal(item.realPrice).mul(item.orderData.quantity)).toNumber()
  }, 0)
  return total
})

// 同步当前内存中的 routeQueryData 到路由 hash
function syncRouteHash() {
  if (!routeQueryData.value)
    return
  const encodedData = encodeDataToHash(routeQueryData.value)
  // 使用 History API 静默更新 URL，不触发路由导航与组件重渲染
  const newUrl = `${location.pathname}${location.search}#data=${encodedData}`
  history.replaceState(history.state, document.title, newUrl)
}

function createColumns(): DataTableColumns<GoodsItem> {
  return [
    {
      title: $t('confirmOrder.table.productInfo') as string,
      key: 'productInfo',
      width: 300,
      render: (row) => {
        const imageRef = ref<any>(null)

        const handleZoomImage = () => {
          imageRef.value?.click()
        }
        return h('div', { class: 'flex items-center gap-12px' }, [
          h('img', {
            src: row.coverImg,
            alt: $t('confirmOrder.labels.productImage') as string,
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
            h('div', { class: 'text-#999 text-12px' }, `${$t('confirmOrder.labels.size')}：${row.orderData.choice.size}  ${$t('confirmOrder.labels.color')}：${row.orderData.choice.color_name}`),
          ]),
        ])
      },
    },
    {
      title: $t('confirmOrder.table.price') as string,
      key: 'price',
      width: 100,
      render: (row) => {
        return h('div', { class: 'font-500 text-#FF4E47 font-bold text-20px font-din' }, [
          h('span', { class: 'text-12px pr-2px' }, '¥'),
          h('span', { class: 'font-din' }, row.realPrice),
        ])
      },
    },
    {
      title: $t('confirmOrder.table.quantity') as string,
      key: 'quantity',
      width: 150,
      render: (row, index) => {
        return h(QuantityInput, {
          'modelValue': row.orderData.quantity,
          'min': 1,
          'max': 999,
          'onUpdate:modelValue': async (value: number) => {
            const oldValue = row.orderData.quantity
            row.orderData.quantity = value

            // 如果是一键下单且有购物车ID，需要调用接口更新
            if (routeQueryData.value!.source !== SourceEnum.ONE_ORDER && routeQueryData.value!.shoppingIds) {
              const cartId = routeQueryData.value!.shoppingIds[index]

              if (cartId) {
                try {
                  await ShoppingApi.updateQuantity({
                    cartId,
                    quantity: value.toString(),
                  })
                  message.success($t('confirmOrder.messages.updateQuantitySuccess'))
                  // 接口更新成功后，同步最新数量到路由 hash，防止刷新回退
                  // 更新 routeQueryData 中对应项的数量（已赋值），然后同步 hash
                  syncRouteHash()
                }
                catch (error: any) {
                  console.error('更新数量失败:', error)
                  message.error(error.response?.data?.msg || ($t('confirmOrder.messages.updateQuantityFail') as string))
                  // 恢复原值
                  row.orderData.quantity = oldValue
                }
              }
            }
            else {
              // 一键下单场景没有服务端购物车数量更新接口，但仍需在本地持久化到 hash
              syncRouteHash()
            }
          },
        })
      },
    },
    {
      title: $t('confirmOrder.table.subtotal') as string,
      key: 'subtotal',
      width: 100,
      render: (row) => {
        const subtotal = new Decimal(row.realPrice).mul(row.orderData.quantity).toNumber()
        return h('div', { class: 'font-500 text-#FF4E47 font-bold text-20px font-din' }, [
          h('span', { class: 'text-12px pr-2px' }, '¥'),
          h('span', { class: 'font-din' }, subtotal.toString()),
        ])
      },
    },
  ]
}

async function getAddressList() {
  try {
    addressLoading.value = true
    const { data } = await AddressApi.getCollectedTemplateList()
    addressList.value = data || []

    if (addressList.value.length <= 0) {
      return
    }

    // 如果没有选中地址，自动选择默认地址
    if (selectedAddressId.value) {
      currentAddress.value = addressList.value.find(t => t.addressId === selectedAddressId.value)!
    }
    else {
      const defaultAddress = addressList.value.find(addr => addr.isDefault === 1)
      if (defaultAddress) {
        currentAddress.value = defaultAddress
        selectedAddressId.value = defaultAddress.addressId
      }
      else {
        currentAddress.value = addressList.value[0]
        selectedAddressId.value = addressList.value[0].addressId
      }
    }
  }
  catch (error: any) {
    console.error('获取地址列表失败:', error)
    message.error(error.response?.data?.msg || ($t('confirmOrder.messages.fetchAddressFail') as string))
  }
  finally {
    addressLoading.value = false
  }
}

// 解析 hash 中的订单数据
function parseOrderDataFromHash() {
  try {
    if (route.hash) {
      const final = route.hash.split('#data=')[1]
      routeQueryData.value = decodeDataFromHash<ReceiveRouteQuery>(final)
      console.log('从 hash 解析到的订单数据:', routeQueryData.value)
    }
  }
  catch (error) {
    console.error('解析订单数据失败:', error)
    message.error($t('confirmOrder.messages.parseOrderDataFail'))
  }
}

// 组件挂载时获取地址列表和解析订单数据
onMounted(() => {
  getAddressList()
  parseOrderDataFromHash()
})

// 地址相关处理函数
function editAddress() {
  isEditMode.value = true
  editingAddress.value = currentAddress.value || null
  showAddressModal.value = true
}

function openCancelModal() {
  isEditMode.value = false
  editingAddress.value = null
  showAddressModal.value = true
}

function switchAddress() {
  showAddressSelectModal.value = true
}

function selectAddress(addressId: string) {
  selectedAddressId.value = addressId
}

function confirmAddressSelection() {
  if (selectedAddressId.value) {
    const selectedAddress = addressList.value.find(addr => addr.addressId === selectedAddressId.value)
    if (selectedAddress) {
      currentAddress.value = selectedAddress
      showAddressSelectModal.value = false
      message.success($t('confirmOrder.messages.selectAddressSuccess'))
    }
    else {
      message.error($t('confirmOrder.messages.selectValidAddress'))
    }
  }
  else {
    message.error($t('confirmOrder.messages.selectAnAddress'))
  }
}

function handleAddressSave(_addressData: AddressItem) {
  // 保存成功后重新获取地址列表
  getAddressList()
  showAddressModal.value = false
  editingAddress.value = null
}

async function confirmOrder() {
  // 校验地址是否填写
  if (!selectedAddressId.value) {
    message.warning($t('confirmOrder.messages.fillAddress'))
    return
  }

  if (!isBalancePayChekcout.value) {
    message.warning($t('confirmOrder.messages.selectPayMethod'))
    return
  }

  // 二次确认弹窗
  // dialog.warning({
  //   title: $t('confirmOrder.dialogs.submitTitle'),
  //   content: $t('confirmOrder.dialogs.submitContent'),
  //   positiveText: $t('confirmOrder.dialogs.submitPositive'),
  //   negativeText: $t('common.often.cancel'),
  //   positiveButtonProps: { color: '#000' },
  //   negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
  //   onPositiveClick: async () => {

  //   },
  // })
  try {
    if (routeQueryData.value!.source === SourceEnum.ONE_ORDER) {
      const { data, rawData: { msg } } = await Api.createOrder({
        addressId: selectedAddressId.value!,
        remark: remark.value,
        good: routeQueryData.value!.goodsInfo[0].orderData,
      })
      if (!data) {
        message.error(msg ?? ($t('confirmOrder.messages.submitFail') as string))
        return
      }
      const encodedData = encodeDataToHash({
        status: 'success',
        orderId: data.orderId,
      })
      router.push({
        name: 'OrderResult',
        hash: `#data=${encodedData}`,
      })
    }

    if (routeQueryData.value!.source === SourceEnum.SHOPPING) {
      const { data, rawData: { msg } } = await Api.createShoppingCart({
        addressId: selectedAddressId.value!,
        remark: remark.value,
        ids: routeQueryData.value!.shoppingIds!,
      })
      if (!data) {
        message.error(msg ?? ($t('confirmOrder.messages.submitFail') as string))
        return
      }

      const encodedData = encodeDataToHash({
        status: 'success',
        orderId: data.orderId,
      })
      router.push({
        name: 'OrderResult',
        hash: `#data=${encodedData}`,
      })
    }
    message.success($t('confirmOrder.messages.submitSuccess'))
  }
  catch (error: any) {
    console.error('提交订单失败:', error)
    const encodedData = encodeDataToHash({
      status: 'fail',
      oldOrderHash: route.hash,
      totalPrice: totalPrice.value,
    })
    router.push({
      name: 'OrderResult',
      hash: `#data=${encodedData}`,
    })
    message.error(error.response?.data?.msg || ($t('confirmOrder.messages.submitOrderFail') as string))
  }
}

const showPaymentModal = ref(false)
function handlerPayment() {
  showPaymentModal.value = true
}

function closeModal() {
  showPaymentModal.value = false
}

function formatNow() {
  const d = new Date()

  const pad = (n: number) => String(n).padStart(2, '0')

  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hour = pad(d.getHours())
  const minute = pad(d.getMinutes())

  return `${year}-${month}-${day} ${hour}:${minute}`
}
</script>

<template>
  <div class="w-full h-[calc(var(--design-vh)-78px-16px)] flex py-18px box-border gap-16px min-[1750px]:px-20 max-w-1760px m-[0_auto] box-border">
    <div class="w-69% flex flex-col gap-16px">
      <div class="w-full h-192px rounded-16px border-1px border-#F7F7F7 border-solid px-24px justify-center box-border flex flex-col gap-8px bg-#FFF">
        <div class="font-bold text-16px text-#000">
          {{ $t('confirmOrder.sections.address') }}
        </div>
        <div class="bg-#FAFAFA w-full p-16px box-border flex rounded-16px justify-between items-center">
          <div
            v-if="currentAddress"
            class="w-34% flex flex-col gap-4px"
          >
            <div class="flex items-center">
              <div class="w-80px text-#666666">
                {{ $t('confirmOrder.labels.receiver') }}：
              </div>
              <span>{{ currentAddress.receiverName }}</span>
            </div>
            <div class="flex items-center">
              <div class="w-80px text-#666666">
                {{ $t('confirmOrder.labels.contact') }}：
              </div>
              <span>{{ formattedPhone }}</span>
            </div>
            <div class="flex items-center">
              <div class="w-80px text-#666666">
                {{ $t('confirmOrder.labels.address') }}：
              </div>
              <span>{{ currentAddress.province }}{{ currentAddress.city }}{{ currentAddress.district }}{{ currentAddress.detailAddress }}</span>
            </div>
          </div>
          <div
            v-else
            class="w-30% flex flex-col gap-4px text-#999"
          >
            <span>{{ $t('confirmOrder.messages.pleaseSelectAddress') }}</span>
          </div>
          <div
            v-if="currentAddress"
            class="text-#030303 w-27% text-center"
          >
            <n-button
              text
              color="#FF6A00"
              @click="editAddress"
            >
              {{ $t('confirmOrder.actions.editAddress') }}
            </n-button>
          </div>
          <div class="flex min-w-30% h-54px gap-16px items-center">
            <n-button
              v-if="currentAddress"
              class="w-131px h-43px rounded-8px"
              :theme-overrides="{
                textColor: '#000',
                textColorFocus: '#000',
                textColorHover: '#000',
                border: '1px solid #000',
                borderHover: '1px solid #000',
                borderFocus: '1px solid #000',
              }"
              @click="switchAddress"
            >
              <template #icon>
                <img
                  src="@/assets/icon/change-address.svg"
                  class="size-16px"
                >
              </template>
              {{ $t('confirmOrder.actions.switchAddress') }}
            </n-button>
            <n-button
              class="w-131px h-43px rounded-8px border-#000!"
              :theme-overrides="{
                textColor: '#000',
                textColorFocus: '#000',
                textColorHover: '#000',
                border: '1px solid #000',
                borderHover: '1px solid #000',
                borderFocus: '1px solid #000',
              }"
              @click="openCancelModal"
            >
              <template #icon>
                <img
                  src="@/assets/icon/add.svg"
                  class="size-16px"
                >
              </template>
              {{ $t('confirmOrder.actions.addAddress') }}
            </n-button>
          </div>
        </div>
      </div>
      <div class="w-full rounded-16px border-1px border-#F7F7F7 border-solid p-24px box-border bg-#FFF">
        <div class="font-bold text-16px mb-16px">
          {{ $t('confirmOrder.sections.goodsInfo') }}
        </div>
        <div class=" rounded-8px border border-#eee overflow-hidden">
          <n-data-table
            :columns="createColumns()"
            :data="routeQueryData?.goodsInfo ?? []"
            :row-key="(row: any) => row.id"
            :bordered="false"
          />
        </div>
        <div class="w-full mt-28px bg-#F3F3F3 p-12px box-border flex flex-col rounded-8px">
          <span>{{ $t('confirmOrder.labels.remark') }}</span>
          <n-input
            v-model:value="remark"
            class="w-full"
          />
        </div>
      </div>
    </div>
    <div class="w-31% h-fit p-24px box-border rounded-16px flex flex-col bg-#FFF">
      <div class="flex gap-16px flex-col">
        <div class="text-16px font-bold">
          {{ $t('confirmOrder.sections.amountDetail') }}
        </div>
        <div class="flex flex-col gap-2px">
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              {{ $t('confirmOrder.amount.goodsTotal') }}：
            </div>
            <div class="text-#FF4E47">
              <span class="text-12px">¥</span>
              {{ totalPrice }}
            </div>
          </div>
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              {{ $t('confirmOrder.amount.discount') }}：
            </div>
            <div class="text-#FF4E47">
              <span class="text-12px">¥</span>
              0
            </div>
          </div>
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              {{ $t('confirmOrder.amount.freight') }}：
            </div>
            <div class="text-#FF4E47">
              <span class="text-12px">¥</span>
              0
            </div>
          </div>
          <div class="w-full flex items-center justify-between">
            <div class="text-#000">
              {{ $t('confirmOrder.amount.payable') }}：
            </div>
            <div class="font-500 text-#FF4E47 font-bold text-24px font-din">
              <span class="text-12px">¥</span>
              {{ totalPrice }}
            </div>
          </div>
        </div>
      </div>
      <div class="mt-16px rounded-8px bg-#F3F3F3 p-12px box-border">
        <n-checkbox
          v-model:checked="isBalancePayChekcout"
          color="#000"
        >
          <div class="flex items-center">
            <img
              src="@/assets/icon/balance.svg"
              class="size-18px"
            >
            <span class="mt--1px pl-2px">{{ $t('confirmOrder.payMethod.balance') }}（{{ $t('confirmOrder.payMethod.available', { amount: (user.role === 1 ? user.enterpriseTotalBalance : user.balance) as any }) }}）</span>
          </div>
        </n-checkbox>
      </div>
      <div class="mt-28px w-full">
        <n-button
          type="primary"
          class="w-full h-56px"
          @click="handlerPayment"
        >
          {{ $t('confirmOrder.actions.submit') }}
        </n-button>
      </div>
    </div>

    <!-- 地址选择弹窗 -->
    <n-modal
      v-model:show="showAddressSelectModal"
      preset="card"
      :title="$t('confirmOrder.addressModal.title')"
      style="width: 440px;border-radius: 24px;"
    >
      <n-scrollbar style="max-height: 340px;">
        <div
          v-if="addressLoading"
          class="flex justify-center py-20px"
        >
          <n-spin size="small" />
          <span class="ml-8px text-#666">{{ $t('confirmOrder.addressModal.loading') }}</span>
        </div>
        <div
          v-else-if="addressList.length === 0"
          class="text-center py-20px text-#999"
        >
          {{ $t('confirmOrder.addressModal.empty') }}
        </div>
        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="address in addressList"
            :key="address.addressId"
            class="p-4 border-1px border-solid border-[transparent] rounded-lg cursor-pointer transition-all bg-#F7F7F7"
            :class="[
              selectedAddressId === address.addressId ? 'border-1px! border-#000!' : 'hover:border-gray-100',
            ]"
            @click="selectAddress(address.addressId)"
          >
            <div class="flex flex-col items-start relative text-14px">
              <div class="w-full flex">
                <div class="w-80px c-#666">
                  {{ $t('confirmOrder.labels.receiver') }}：
                </div>
                <div class="flex-1 c-#000">
                  {{ address.receiverName }}
                </div>
              </div>
              <div class="w-full flex">
                <div class="w-80px c-#666">
                  {{ $t('confirmOrder.labels.contact') }}：
                </div>
                <div class="flex-1 c-#000">
                  {{ address.receiverPhone }}
                </div>
              </div>
              <div class="w-full flex">
                <div class="w-80px c-#666">
                  {{ $t('confirmOrder.labels.address') }}：
                </div>
                <div class="flex-1 c-#000">
                  {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detailAddress }}
                </div>
              </div>
              <div
                v-if="address.isDefault === 1"
                class="absolute right-0px top-0px"
              >
                <span class="px-2 py-1 bg-[rgba(255,106,0,0.1)] text-#FF6A00 text-xs rounded border border-#FF6A00">
                  {{ $t('confirmOrder.addressModal.default') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </n-scrollbar>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <n-button @click="showAddressSelectModal = false">
            {{ $t('common.often.cancel') }}
          </n-button>
          <n-button
            type="primary"
            color="#000"
            @click="confirmAddressSelection"
          >
            {{ $t('common.often.confirm') }}
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 地址管理弹窗 -->
    <address-modal
      v-model:show="showAddressModal"
      :is-edit-mode="isEditMode"
      :address-data="editingAddress"
      @save="handleAddressSave"
    />

    <n-modal
      v-model:show="showPaymentModal"
      preset="card"
      header-style="padding-bottom:0px !important"
      style="width: 500px;border-radius: 24px;background-color: #FFF;"
    >
      <template #header>
        <div class="flex gap-4px">
          <div class="text-#000 text-16px!">
            确认支付
          </div>
        </div>
      </template>
      <div class="text-#666666">
        下单时间 {{ formatNow() }}
      </div>
      <div class="mt-14px rounded-16px bg-#F7F7F7 w-full box-border p-16px flex flex-col gap-16px">
        <div class="font-bold text-24px color-#000000">
          金额明细
        </div>
        <div class="flex flex-col gap-2px">
          <div class="flex justify-between items-center">
            <span> {{ $t('confirmOrder.amount.goodsTotal') }}：</span>
            <span class="text-#FF4E47">
              <span class="text-14px pr-2px">¥</span>
              {{ totalPrice }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span>{{ $t('confirmOrder.amount.discount') }}：</span>
            <span class="text-#FF4E47">
              <span class="text-14px pr-2px">¥</span>
              0
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span>{{ $t('confirmOrder.amount.freight') }}：</span>
            <span class="text-#FF4E47">
              <span class="text-14px pr-2px">¥</span>
              0
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span>{{ $t('confirmOrder.amount.payable') }}：</span>
            <span class="text-#FF4E47">
              <span class="text-14px pr-2px">¥</span>
              <span class="font-bold text-24px font-din">{{ totalPrice }}</span>
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
            <span class="mt--1px pl-2px">{{ $t('confirmOrder.payMethod.balance') }}（{{ $t('confirmOrder.payMethod.available', { amount: (user.role === 1 ? user.enterpriseTotalBalance : user.balance) as any }) }}）</span>
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
            @click="confirmOrder"
          >
            确认支付
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
