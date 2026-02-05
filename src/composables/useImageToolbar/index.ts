import type { ImageRenderToolbarProps } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { NButton, NIcon } from 'naive-ui'
import { defineComponent, h } from 'vue'
import { downloadJpgTypeImage } from '@/utils/file'

/**
 * 自定义下载按钮（强制下载为 jpg）
 */
const CustomDownloadButton = defineComponent({
  name: 'CustomDownloadButton',
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(
        NButton,
        {
          text: true,
          onClick: () => {
            downloadJpgTypeImage(props.url)
          },
          class: 'px-8px',
        },
        {
          icon: () =>
            h(
              NIcon,
              {
                size: 24,
                color: 'rgb(246 246 246)',
                class: 'mt--2px',
              },
              {
                default: () =>
                  h(Icon, {
                    icon: 'ion:download-outline',
                  }),
              },
            ),
        },
      )
  },
})

/**
 * 创建 NImage render-toolbar，只替换下载按钮
 */
export function createImageToolbar(url: string, isShowPrev2Next: boolean | undefined = true) {
  return ({ nodes }: ImageRenderToolbarProps) => [
    isShowPrev2Next && nodes.prev,
    isShowPrev2Next && nodes.next,
    nodes.rotateCounterclockwise,
    nodes.rotateClockwise,
    nodes.zoomIn,
    nodes.zoomOut,
    h(CustomDownloadButton, {
      url,
    }),
    nodes.close,
  ]
}
