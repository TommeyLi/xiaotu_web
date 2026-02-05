<script setup lang='tsx'>
import { useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useContactServiceModal } from '@/composables/use-contact-service-modal'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'
import ProgressMessage from './progress-message.vue'
import UserAvatar from './user-avatar.vue'

const router = useRouter()
const message = useMessage()
const { openContactServiceModal } = useContactServiceModal()
const {
  isLogined,
  user,
  showLoginModal,
} = storeToRefs(useUserStore())

function recharge(type: 'point' | 'balance' = 'point') {
  // 管理员：点击充值拉起客服弹窗
  if (user.value.role === 1) {
    openContactServiceModal()
    return
  }
  if (user.value.role === 2) {
    message.warning(type === 'point' ? $t('common.layout.navRight.contactManagerForPoints') : $t('common.layout.navRight.contactManagerForBalance'))
  }
}

function openNewTab(name: string) {
  if (!isLogined.value) {
    showLoginModal.value = true
    return
  }
  const url = router.resolve({
    name,
  })
  window.open(url.href, '_self')
}
</script>

<template>
  <div
    class="flex items-center h-full min-w-600px justify-end select-none font-['PingFang_HK'] nav-right"
  >
    <pro-button
      size="small"
      text
      color="#000000"
      class="myOrder"
      @click="openNewTab('MyOrder')"
    >
      {{ $t('common.layout.navRight.myOrder') }}
    </pro-button>
    <div class="line" />
    <pro-button
      text
      size="small"
      color="#000000"
      class="cart-btn"
      @click="openNewTab('Shopping')"
    >
      <div v-if="isLogined">
        {{ $t('common.layout.navRight.shoppingCart') }}
        <span
          v-show="user.cartCount !== 0"
          class="cart-count"
        >{{ user.cartCount }}</span>
      </div>
      <template #icon>
        <img
          src="@/assets/images/shopping.svg"
          class="cart-img truncate"
        >
      </template>
    </pro-button>
    <div class="line" />
    <template v-if="isLogined">
      <div class="number-box">
        <div
          class="number-item"
          @click="openNewTab('MyPoint')"
        >
          <img
            class="img"
            src="@/assets/icon/rabbit-dot.png"
          >
          <span class="title">{{ $t('common.layout.navRight.points') }}</span>
          <span class="number">{{ user.role === 1 ? (user.enterpriseUnallocatedPoints ?? 0) : (user.points ?? 0) }}</span>
        </div>
        <div
          class="pay-btn"
          @click="recharge('point')"
        >
          {{ $t('common.layout.navRight.recharge') }}
        </div>
      </div>
      <div class="number-box">
        <div
          class="number-item"
          @click="openNewTab('MyBalance')"
        >
          <img
            class="img"
            src="@/assets/icon/balance.png"
          >
          <span class="title">{{ $t('common.layout.navRight.balance') }}</span>
          <span class="number"> {{ user.role === 1 ? (user.enterpriseTotalBalance ?? 0) : (user.balance ?? 0) }}</span>
        </div>
        <div
          class="pay-btn"
          @click="recharge('balance')"
        >
          {{ $t('common.layout.navRight.recharge') }}
        </div>
      </div>
      <progress-message />
    </template>
    <div
      v-if="!isLogined"
      class="login-btn"
      @click="showLoginModal = true"
    >
      {{ $t('common.layout.navRight.logIn') }}
    </div>
    <user-avatar v-else />
  </div>
</template>

<style scoped lang="scss">
  .nav-right {
  gap: 1.25rem;
}
.myOrder {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.9375rem;
}
.myOrder:hover {
  color: #ff5500;
}
.line {
  width: 0.0625rem;
  height: 1rem;
  background: #d1d5db;
}

.cart-btn {
  justify-content: flex-start;
  gap: 0.625rem;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: bold;
  transition: color 0s ease;
  :deep(.n-icon-slot) {
    width: 1.75rem;
    height: 1.75rem;
  }
  .cart-img {
    width: 1.75rem;
    height: 1.75rem;
  }
  .cart-count {
    color: #ff5500;
  }
}
.cart-btn:hover {
  color: #ff5500;
  .cart-img {
    filter: invert(48%) sepia(91%) saturate(2709%) hue-rotate(1deg) brightness(101%) contrast(101%);
  }
}
.login-btn {
  width: 5.375rem;
  height: 2.4063rem;
  border-radius: 624.9375rem;
  background: #ff5500;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);
  font-size: 0.9375rem;
  font-weight: bold;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.login-btn:hover {
  background: #ea580c;
}
.number-box {
  border-radius: 624.9375rem;
  background: #f9fafb;
  box-sizing: border-box;
  border: 1px solid #f3f4f6;
  padding: 0.625rem 1.0625rem;
  display: flex;
  align-items: center;
  gap: 0.9375rem;
  .number-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    .img {
      width: 1rem;
      height: 1rem;
    }
    .title {
      font-family: 'Inter', sans-serif;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #6b7280;
      text-wrap: nowrap;
    }
    .number {
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      font-weight: bold;
      color: #111111;
      text-wrap: nowrap;
    }
  }
  .pay-btn {
    width: 3rem;
    height: 1.375rem;
    background: #111111;
    border-radius: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: bold;
    color: #ffffff;
    cursor: pointer;
  }
  .pay-btn:hover {
    background-color: #ff5500;
  }
}
</style>
