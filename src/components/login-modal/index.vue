<script setup lang="ts">
import { useNotification } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { createProForm } from 'pro-naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { $t } from '@/locales/locales'
import { useAppStore } from '@/store/use-app-store'
import { useUserStore } from '@/store/use-user-store'
import ContactService from '../contact-service/register.vue'

const feedbackErrors = ref('')
const userStore = useUserStore()
const appStore = useAppStore()
const notification = useNotification()
const currentView = ref<'login' | 'register'>('login')
const {
  showLoginModal,
  loginLoading: loading,
} = storeToRefs(userStore)

const form = createProForm<{
  username: string
  password: string
}>({
  initialValues: {
    username: '',
    password: '',
  },
  onSubmit: async (values) => {
    console.log('submit', form.values)
    try {
      const user = await userStore.login({
        username: values.username.trim(),
        password: values.password.trim(),
        language: appStore.isZhCN ? 'ZH_CN' : 'EN_US',
      })
      notification.success({
        title: $t('pages.login.loginSuccess'),
        content: `${$t('pages.login.welcomeBack')}，${user.nickname}`,
        duration: 2000,
      })
    }
    catch (error: any) {
      const errMsg = error.response.rawData.msg
      feedbackErrors.value = errMsg || ($t('pages.login.invalidCredentials') as string)
    }
  },
  onValueChange: () => {
    // 如果值更新，去除错误提示
    feedbackErrors.value = ''
  },
})

const isDisable = computed(() => {
  return !(form.values.value.username && form.values.value.password)
})

function switchToRegister() {
  currentView.value = 'register'
}

const router = useRouter()

function openAgreement() {
  router.push('/agreement')
}
</script>

<template>
  <n-config-provider
    :theme-overrides="{
      Form: { blankHeightLarge: '60px' },
      Input: {
        borderFocus: '1px solid #000',
        borderHover: '1px solid #000',
        boxShadowFocus: '0 0 0 0px #000',
      },
      Card: {
        closeIconSize: '24px',
        closeIconColor: '#000000',
        closeIconColorHover: '#000000',
        closeColorHover: 'rgb(170 170 170 / 10%)',
      },
    }"
  >
    <n-modal
      v-model:show="showLoginModal"
      size="huge"
      preset="card"
      :bordered="false"
      :segmented="false"
      :auto-focus="false"
      :close-on-esc="false"
      :mask-closable="false"
      transform-origin="center"
      class="login-modal-box"
      :class="{ 'login-modal-bg': currentView === 'login',
                'login-modal-bg-register': currentView === 'register',
      }"
      @keydown.enter.prevent="form.submit"
    >
      <div class="login-modal">
        <!-- 登录 -->
        <div
          v-if="currentView === 'login'"
          class="login-box"
        >
          <div class="login-title">
            {{ $t('pages.login.welcome') }}
          </div>

          <pro-form
            :form="form"
            :show-label="false"
            size="large"
            :loading="loading"
          >
            <pro-input
              :title="$t('pages.login.username')"
              path="username"
              required
              :field-props="{
                placeholder: $t('pages.login.usernamePlaceholder'),
                status: feedbackErrors ? 'error' : undefined,
              }"
            >
              <template #prefix>
                <img
                  src="@/assets/icon/user.svg"
                  class="user-icon"
                >
              </template>
            </pro-input>
            <pro-password
              :title="$t('pages.login.password')"
              required
              path="password"
              :field-props="{
                placeholder: $t('pages.login.passwordPlaceholder'),
                status: feedbackErrors ? 'error' : undefined,
                showPasswordOn: 'click',
              }"
            >
              <template #prefix>
                <img
                  src="@/assets/icon/lock-open.svg"
                  class="lock-open-icon"
                >
              </template>
              <template #password-visible-icon>
                <img
                  src="@/assets/icon/eye.svg"
                  class="eye-icon"
                >
              </template>
              <template #password-invisible-icon>
                <img
                  src="@/assets/icon/eye-closed.svg"
                  class="eye-icon"
                >
              </template>
              <template #feedback="{ feedbackDom }">
                <div class="flex flex-col">
                  <component :is="feedbackDom" />
                  <div
                    v-if="feedbackErrors"
                    class="c-[var(--n-feedback-text-color-error)] flex items-center"
                  >
                    <img
                      src="@/assets/icon/close-circle.svg"
                      class="size-16px truncate m-r-4px"
                    >
                    {{ feedbackErrors }}
                  </div>
                </div>
              </template>
            </pro-password>

            <!-- 登录按钮 -->
            <n-button
              type="primary"
              strong
              secondary
              :loading="loading"
              :disabled="isDisable"
              class="login-button"
              @click="form.submit"
            >
              {{ $t('pages.login.login') }}
            </n-button>

            <!-- 协议 -->
            <p class="agreement-box">
              {{ $t('pages.login.agreeTo') }}
              <n-button
                text
                type="primary"
                class="agreement-btn"
                @click="openAgreement"
              >
                {{ $t('pages.login.userAgreement') }}
              </n-button>
            </p>
          </pro-form>

          <!-- 注册账号 -->
          <div
            class="register-btn-box"
            @click="switchToRegister"
          >
            <span class="register-text">{{ $t('pages.login.register') }}</span>
          </div>
        </div>
        <!-- 注册 -->
        <div
          v-else-if="currentView === 'register'"
          class="register-box"
        >
          <div
            class="return-box"
            @click="currentView = 'login'"
          >
            <img
              src="@/assets/icon/arrow-left.svg"
              class="return-icon"
            >
            <span class="return-text">{{ $t('pages.login.backToLogin') }}</span>
          </div>
          <contact-service />
          <div class="addWechat">
            {{ $t('components.contactService.addWechat') }}
          </div>
          <div class="addWechatHint">
            {{ $t('components.contactService.addWechatHint') }}
          </div>
        </div>
      </div>
    </n-modal>
  </n-config-provider>
</template>

<style lang="scss">
.login-modal-box {
  width: 35rem;
  border-radius: 3rem;
  box-sizing: border-box;
  border: 1px solid #f3f4f6;
  box-shadow:
    0px 20px 25px -5px rgba(0, 0, 0, 0.1),
    0px 8px 10px -6px rgba(0, 0, 0, 0.1);
  .n-card-header {
    padding: 2.0625rem 2.0625rem 0.75rem;
    .n-base-close {
      width: 1.125rem;
      height: 1.125rem;
      .n-base-icon {
        color: #d1d5db;
      }
      .n-base-icon:hover {
        color: #111111;
      }
    }
  }
  .n-card__content {
    padding: 0 2.5625rem 3.0625rem;
  }
  .login-box {
    .login-title {
      font-family: 'Inter', sans-serif;
      font-size: 2rem;
      font-weight: bold;
      line-height: 3rem;
      margin-bottom: 3rem;
      text-align: center;
    }
    .n-input {
      width: 100%;
      height: 3.75rem;
      border-radius: 1.375rem;
      border: 1px solid #f3f4f6;
      --n-border-hover: none !important;
      --n-border-focus: 1px solid rgb(255 85 0 / 0.3) !important;
      --n-box-shadow-focus: 0 0 0 3px rgba(252, 239, 232, 1) !important; /* 聚焦阴影 */
      .n-input-wrapper {
        padding: 0 1.25rem;
      }
      .n-input__prefix {
        margin-right: 0.875rem;
      }
      .n-input__input-el {
        height: 100%;
      }
      .user-icon,
      .lock-open-icon {
        width: 1.125rem;
        height: 1.125rem;
      }
      .eye-icon {
        width: 1.125rem;
        height: 1.125rem;
        filter: invert(82%) sepia(6%) saturate(50%) hue-rotate(180deg) brightness(86%) contrast(89%);
      }
    }
    .n-input:not(.n-input--focus):hover .n-input__border,
    .n-input:not(.n-input--focus):hover .n-input__state-border {
      border-color: var(--n-border-color) !important;
      box-shadow: none !important;
    }

    .login-button {
      width: 100%;
      height: 4rem;
      border-radius: 1.375rem;
      background: #ff5500;
      box-shadow:
        0px 10px 15px -3px rgba(255, 85, 0, 0.3),
        0px 4px 6px -4px rgba(255, 85, 0, 0.3);
      font-family: 'Inter', sans-serif;
      font-size: 1.1875rem;
      font-weight: bold;
      color: #ffffff;
    }
    .agreement-box {
      margin-top: 2rem;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 0.8125rem;
      font-weight: normal;
      color: #9ca3af;
      display: flex;
      justify-content: center;
      gap: 0.3625rem;
      .agreement-btn {
        font-family: 'Inter', sans-serif;
        font-size: 0.8125rem;
        font-weight: normal;
        color: #111111;
      }
    }
    .register-btn-box {
      margin-top: 3rem;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 1.375rem;
      font-weight: bold;
      color: #ff5500;
      .register-text {
        cursor: pointer;
      }
    }
  }
  .register-box {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 2.4375rem 0;
    .return-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      position: absolute;
      top: -2.5rem;
      left: -0.5rem;
      .return-icon {
        width: 1.25rem;
        height: 1.25rem;
      }
      .return-text {
        font-family: 'Inter', sans-serif;
        font-size: 1.0625rem;
        font-weight: bold;
        color: #111111;
      }
    }
    .return-box:hover {
      .return-text {
        color: #ff5500;
      }
      .return-icon {
        filter: invert(48%) sepia(91%) saturate(2709%) hue-rotate(1deg) brightness(101%) contrast(101%);
      }
    }
    .addWechat {
      margin: 2rem 0 0.75rem;
      font-family: 'Inter', sans-serif;
      font-size: 1.375rem;
      font-weight: bold;
      line-height: 2.0625rem;
      color: #111111;
    }
    .addWechatHint {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.25rem;
      color: #9ca3af;
    }
  }
}
.login-modal-bg {
  background: #fcf8f4 !important;
}
.login-modal-bg-register {
  background: linear-gradient(180deg, #fff5eb 0%, #ffffff 100%) !important;
}
</style>
