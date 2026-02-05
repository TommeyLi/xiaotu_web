<script setup lang="tsx">
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { NAvatar, NText, useDialog } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { ProButton } from 'pro-naive-ui'
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import loginedAvatar from '@/assets/images/logined-avatar.png'
import unLoginedAvatar from '@/assets/images/un-logined-avatar.png'
import { $t } from '@/locales/locales'
import { useUserStore } from '@/store/use-user-store'

const dialog = useDialog()
const router = useRouter()
const userStore = useUserStore()

const {
  user,
  isLogined,
  showLoginModal,
} = storeToRefs(userStore)

const options = computed<DropdownMixedOption[]>(() => {
  const finalOptions = [
    {
      key: 'header',
      type: 'render',
      render: renderCustomHeader,
    },
    {
      label: $t('common.layout.userAvatar.addressManage'),
      key: 'AddressManage',
    },
    {
      label: $t('common.layout.userAvatar.goodsCollect'),
      key: 'MyCollect',
    },
    {
      label: $t('common.layout.userAvatar.goodsCollectBox'),
      key: 'MyDraft',
    },
    {
      label: $t('common.layout.userAvatar.imageLibrary'),
      key: 'ImageLibrary',
    },
  ]
  if (isLogined.value) {
    finalOptions.push({
      label: $t('common.layout.userAvatar.logout'),
      key: 'logout',
    })
  }
  return finalOptions
})

function openNewTab(name: string) {
  const url = router.resolve({
    name,
  })
  window.open(url.href, '_self')
}

function renderCustomHeader() {
  const avatarProps = {
    round: true,
    style: 'margin-right: 12px;width:40px;height:40px;background-color:transparent',
    fallbackSrc: loginedAvatar,
    previewDisabled: true,
    src: isLogined.value
      ? (user.value.avatarUrl || loginedAvatar)
      : unLoginedAvatar,
  }

  const content = isLogined.value
    ? h('div', null, [
        h('div', null, [h(NText, { depth: 2 }, { default: () => user.value.nickname })]),
        h(
          'div',
          { style: 'font-size: 12px;' },
          [h(NText, { depth: 3 }, { default: () => user.value.enterpriseName })],
        ),
      ])
    : h(
        ProButton,
        { text: true, onClick: () => showLoginModal.value = true },
        () => h('span', { style: { fontWeight: 'bold' } }, $t('common.layout.userAvatar.loginNow')),
      )

  return h(
    'div',
    { style: 'display: flex; align-items: center; padding: 8px 12px;' },
    [h(NAvatar, avatarProps), content],
  )
}

function handleSelect(key: string) {
  if (key === 'logout') {
    dialog.warning({
      title: $t('common.layout.userAvatar.logoutConfirmTitle'),
      content: $t('common.layout.userAvatar.logoutConfirmContent'),
      negativeText: $t('common.often.cancel'),
      positiveText: $t('common.often.confirm'),
      positiveButtonProps: { color: '#000' },
      negativeButtonProps: { color: '#e8e6e6', textColor: 'rgba(0, 0, 0, 0.9)' },
      onPositiveClick: () => {
        userStore.logoutWithQueryRedirect()
      },
    })
  }
  else {
    openNewTab(key)
  }
}
</script>

<template>
  <n-dropdown
    trigger="hover"
    :options="options"
    class="w-220px"
    @select="handleSelect"
  >
    <n-image
      class="cursor-pointer user-avatar"
      width="36"
      :src="isLogined ? (user.avatarUrl || loginedAvatar) : unLoginedAvatar"
      :fallback-src="loginedAvatar"
      :preview-disabled="true"
      object-fit="cover"
      alt="avatar"
    />
  </n-dropdown>
</template>

<style scoped lang="scss">
.user-avatar {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  overflow: hidden;
  border-radius: 50%;
}
</style>
