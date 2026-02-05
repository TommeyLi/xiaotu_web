import type { PropType } from 'vue'
import type { EditImageWithCanvasInst } from './inst'
import { NButton, NModal, NSlider } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import circleCursor from '@/assets/images/circle.png'
import EditImageWithCanvas from './edit-image-with-canvas'

export default defineComponent({
  name: 'EditImageDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    src: {
      type: String,
      required: true,
    },
    /**
     * 保存蒙版触发的事件
     */
    onSaveMask: Function as PropType<(urls: { alaphaUrl: string, blackWhiteUrl: string }) => void>,
  },
  setup(props, { emit }) {
    const brushSize = ref(10)
    const canvasInstRef = ref<EditImageWithCanvasInst | null>(null)

    function close() {
      emit('update:visible', false)
    }

    function clearCanvas() {
      canvasInstRef.value?.clear()
    }

    const loading = ref(false)
    async function saveMask() {
      loading.value = true
      try {
        const result = await canvasInstRef.value!.getCanvasAlaphaUrl()
        props.onSaveMask?.(result)
        close()
      }
      catch (error) {
        console.error('保存蒙版失败', error)
      }
      finally {
        loading.value = false
      }
    }

    return {
      close,
      saveMask,
      loading,
      brushSize,
      clearCanvas,
      canvasInstRef,
    }
  },
  render() {
    const visible = this.$attrs.visible !== undefined ? (this.$attrs.visible as boolean) : this.visible
    return (
      <NModal
        show={visible}
        preset="card"
        title="重绘选区"
        bordered={false}
        autoFocus={false}
        class="w-539px h-565px bg-#FFF rounded-24px"
        onUpdate:show={(val: boolean) => {
          this.$emit('update:visible', val)
        }}
      >
        {{
          default: () => {
            return (
              <div class="w-full flex flex-col">
                {/* 头部工具栏 */}
                <div class="w-full flex gap-8px items-center justify-between mb-8px">
                  <div class="flex items-center gap-8px">
                    <span class="whitespace-nowrap font-400 text-14px">橡皮擦大小</span>
                    <NSlider
                      value={this.brushSize}
                      class="w-100px"
                      max={100}
                      min={1}
                      showTooltip={false}
                      onUpdate:value={(val: number) => {
                        this.brushSize = val
                      }}
                      themeOverrides={{
                        fillColor: '#000',
                        fillColorHover: '#000',
                      }}
                    />
                  </div>
                  <div class="flex items-center gap-18px">
                    <NButton
                      onClick={this.clearCanvas}
                      color="#000"
                      size="small"
                    >
                      清空画布
                    </NButton>
                  </div>
                </div>
                {/* 画布区域 */}
                <div
                  class="w-full h-375px flex justify-center items-center overflow-hidden"
                  style={{ cursor: `url(${circleCursor}) 8 8, pointer` }}
                >
                  <EditImageWithCanvas
                    ref="canvasInstRef"
                    src={this.src}
                    brushSize={this.brushSize}
                  />
                </div>
              </div>
            )
          },
          footer: () => {
            return (
              <div class="w-full flex justify-end gap-x-8px">
                <NButton
                  type="tertiary"
                  onClick={this.close}
                >
                  关闭
                </NButton>
                <NButton
                  color="#000"
                  loading={this.loading}
                  onClick={this.saveMask}
                >
                  保存蒙版
                </NButton>
              </div>
            )
          },
        }}
      </NModal>
    )
  },
})
