<script setup lang='tsx'>
import { useRouter } from 'vue-router'
import { useContactServiceModal } from '@/composables/use-contact-service-modal'
import { $t } from '@/locales/locales'

const router = useRouter()
const { openContactServiceModal } = useContactServiceModal()

function openNewTab(name: string) {
  const url = router.resolve({
    name,
  })
  window.open(url.href, '_self')
}
</script>

<template>
  <div class="flex justify-center items-center h-full bg-#F2F2F2 font-['PingFang_SC'] mt-18px">
    <div class="flex flex-col gap-5px items-center justify-center c-#666666 text-12px">
      <div>
        <span
          class="cursor-pointer"
          @click="openNewTab('Root')"
        >{{ $t('common.layout.footer.home') }}</span> | <span
          class="cursor-pointer"
          @click="openContactServiceModal"
        >{{ $t('common.layout.footer.contactUs') }}</span> | <span
          class="cursor-pointer"
          @click="openNewTab('AiDraw')"
        >{{ $t('common.layout.footer.aiDraw') }}</span> | <span
          class="cursor-pointer"
          @click="openNewTab('CustomGoods')"
        >{{ $t('common.layout.footer.customGoods') }}</span>
      </div>
      <div>
        Copyright ©2025 成都花猫智绘信息科技有限公司 版权所有
      </div>
      <div class="flex items-center gap-5px">
        <n-button
          text
          tag="a"
          href="https://beian.mps.gov.cn/#/query/webSearch"
          target="_blank"
          class="c-#666666 text-12px"
        >
          蜀ICP备2024050299号-9
        </n-button>
      </div>
    </div>
  </div>
</template>
