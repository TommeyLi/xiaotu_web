<script setup lang='tsx'>
import { storeToRefs } from 'pinia'
import { useLayoutMenu } from 'pro-naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProRequest } from '@/composables/use-pro-request'
import { useUserStore } from '@/store/use-user-store'
import { Api } from '@/views/custom-goods/index.api'

interface CategoryItem {
  categoryId: string
  categoryName: string
  sort: number
}

interface MenuItem {
  label: string
  key: string
  children?: Array<{
    label: string
    key: string
  }>
}

const router = useRouter()
const {
  data: categoryInfoList,
} = useProRequest(async (): Promise<CategoryItem[]> => {
  const result = await Api.getCategoryList()
  return (result.data ?? []).sort((a, b) => a.sort - b.sort)
})
const {
  showLoginModal,
} = storeToRefs(useUserStore())

const {
  layout,
} = useLayoutMenu({
  mode: 'horizontal',
  menus: computed(() => router.buildMenus()),
})

const showModal = ref(false)

const categoryOptions = computed<MenuItem[]>(() => {
  const categories = categoryInfoList.value ?? []
  const options = categories.map(item => ({
    label: item.categoryName,
    key: `/custom-goods?categoryId=${item.categoryId}`,
  }))

  return [
    {
      label: '小兔文创',
      key: '/custom-goods',
      children: options,
    },
  ]
})

const menuOptions = computed<MenuItem[]>(() => {
  const layoutOptions = (layout.value.horizontalMenuProps?.options ?? []) as MenuItem[]
  return [...layoutOptions, ...categoryOptions.value]
})

async function pushTo(path: string) {
  console.log(path)
  const failure = await router.push(path)
  if (failure) {
    showLoginModal.value = true
  }
}
</script>

<template>
  <div class="footer-box">
    <div class="function-box">
      <div class="web-introduce">
        <div
          class="web-title-box"
          @click="$router.push('/')"
        >
          <img
            class="web-icon"
            src="@/assets/icon/logo.png"
          >
          <div class="web-title">
            {{ $t('footer.webTitle') }}
          </div>
        </div>
        <div class="introduction-content">
          {{ $t('footer.introduction') }}
        </div>
        <div
          class="service-btn"
          @click="showModal = true"
        >
          {{ $t('footer.serviceBtn') }}
        </div>
      </div>
      <div
        v-for="(item, index) in menuOptions"
        :key="index"
        class="function-introduce"
      >
        <div class="function-title">
          {{ item.label }}
        </div>
        <div class="function-content">
          <div
            v-for="it in item.children"
            :key="it.key"
            class="function-item"
            @click="pushTo(it.key as string)"
          >
            {{ it.label }}
          </div>
        </div>
      </div>
    </div>
    <div class="footer-copyright">
      {{ $t('footer.webintroduction') }}
    </div>
    <n-modal v-model:show="showModal">
      <div class="service-modal">
        <div class="modal-top">
          <div class="modal-title">
            {{ $t('footer.modalTitle') }}
          </div>
          <img
            class="close-icon"
            src="@/assets/icon/close.svg"
            @click="showModal = false"
          >
        </div>
        <div class="modal-content">
          <div class="qr-box">
            <img
              class="qr-code"
              src="@/assets/images/contact-service-qr.png"
            >
          </div>
          <div class="qr-tip">
            {{ $t('footer.modalTip') }}
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<style scoped lang="scss">
.footer-box {
  margin: 11.5rem -4.6875rem 0;
  border-top: 0.0625rem solid #e5e7eb;
  padding: 5.0625rem 13rem 2.5rem;
  .function-box {
    display: flex;
    gap: 3rem;
    padding: 0 0 5rem;
    border-bottom: 0.0625rem solid #e5e7eb;
    .web-introduce {
      flex: 1;
      .web-title-box {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 2.1875rem;
        cursor: pointer;
        .web-icon {
          width: 2rem;
          height: 2rem;
        }
        .web-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.5rem;
          font-weight: bold;
          color: #111111;
          text-wrap: nowrap;
        }
      }
      .web-title-box:hover {
        .web-title {
          color: #ff5500;
        }
      }
      .introduction-content {
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1.625rem;
        color: #6b7280;
        margin-bottom: 2.1875rem;
      }
      .service-btn {
        width: 7.5rem;
        height: 3rem;
        border-radius: 624.9375rem;
        background: #f3f4f6;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        font-weight: bold;
        color: #111111;
        cursor: pointer;
      }
      .service-btn:hover {
        color: #ffffff;
        background-color: #111111;
      }
    }
    .function-introduce {
      flex: 1;
      .function-title {
        margin-bottom: 2.125rem;
        font-family: 'Inter', sans-serif;
        font-size: 1.125rem;
        font-weight: bold;
        line-height: 1.75rem;
        color: #111111;
      }
      .function-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1.5rem;
        color: #6b7280;
        .function-item {
          cursor: pointer;
          position: relative;
        }
        .function-item:hover {
          color: #ff5500;
        }
        .function-item:hover::after {
          position: absolute;
          top: 0.125rem;
          right: -1rem;
          content: '';
          display: block;
          width: 0.8rem;
          height: 0.8rem;
          background: url('@/assets/icon/arrows.png') no-repeat;
          background-size: 100% 100%;
        }
      }
    }
  }
  .footer-copyright {
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    color: #9ca3af;
    margin-top: 2.5625rem;
  }
}
.service-modal {
  width: 25rem;
  height: 32.1719rem;
  border-radius: 2.5rem;
  background: #ffffff;
  box-sizing: border-box;
  border: 0.0625rem solid #f3f4f6;
  box-shadow: 0rem 1.5625rem 3.125rem -0.75rem rgba(0, 0, 0, 0.25);
  .modal-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2.0625rem 2.0625rem 2rem;
    .modal-title {
      font-family: 'Inter', sans-serif;
      font-size: 1.25rem;
      font-weight: bold;
      line-height: 1.75rem;
      color: #111111;
    }
    .close-icon {
      cursor: pointer;
      width: 1.375rem;
      height: 1.375rem;
    }
    .close-icon:hover {
      filter: brightness(0.08) saturate(0%) contrast(1.2);
    }
  }
  .qr-box {
    display: flex;
    justify-content: center;
    .qr-code {
      width: 19.875rem;
      height: 19.875rem;
      border-radius: 1.5rem;
    }
  }
  .qr-tip {
    margin-top: 2rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4219rem;
    color: #9ca3af;
    text-align: center;
  }
}
</style>
