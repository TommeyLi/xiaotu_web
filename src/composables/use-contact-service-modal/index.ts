import { useModal } from 'naive-ui'
import { h } from 'vue'
import ContactService from '@/components/contact-service/index.vue'
import { $t } from '@/locales/locales'

/**
 * 联系客服弹窗管理
 */
export function useContactServiceModal() {
  const modal = useModal()

  /**
   * 打开联系客服弹窗
   */
  function openContactServiceModal() {
    modal.create({
      title: $t('common.contactServiceCommon.title'),
      content: () => h(ContactService),
      preset: 'card',
      style: { width: '381px', height: '358px' },
      bordered: false,
      segmented: false,
      size: 'huge',
      transformOrigin: 'center',
      maskClosable: true,
      closeOnEsc: true,
      autoFocus: false,
      class: 'rounded-[36px]',
      themeOverrides: {
        peers: {
          Card: {
            titleFontWeight: 'bold',
            closeIconSize: '24px',
            closeIconColor: '#000000',
            closeIconColorHover: '#000000',
            closeColorHover: 'rgb(170 170 170 / 10%)',
          },
        },
      },
    })
  }

  return {
    openContactServiceModal,
  }
}
