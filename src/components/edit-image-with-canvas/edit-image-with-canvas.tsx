import type { EditImageWithCanvasInst } from './inst'
import { useEventListener } from '@vueuse/core'
import { defineComponent, onMounted, ref, watch } from 'vue'
import { useUploadImage } from '@/composables/use-upload-image'
import { base64ToFile } from '@/utils/file'

export default defineComponent({
  name: 'EditImageWithCanvas',
  props: {
    /**
     * 画布背景图片地址
     */
    src: {
      type: String,
      required: true,
    },
    /**
     * 画笔大小
     */
    brushSize: {
      type: Number,
      default: 20,
    },
    /**
     * 画笔颜色
     */
    brushColor: {
      type: String,
      default: '#32fb2c',
    },
  },
  setup(props, { expose }) {
    const width = ref(0)
    const height = ref(0)
    const displayWidth = ref(0)
    const displayHeight = ref(0)
    const scale = ref(1)
    const lastX = ref(0)
    const lastY = ref(0)
    const isDrawing = ref(false)
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const drawCtx = ref<CanvasRenderingContext2D | null>(null)
    const bgCanvasRef = ref<HTMLCanvasElement | null>(null)
    const bgCtx = ref<CanvasRenderingContext2D | null>(null)
    const containerRef = ref<HTMLDivElement | null>(null)

    const initCanvas = (canvasBackgroundUrl: string) => {
      if (canvasBackgroundUrl) {
        drawCtx.value = canvasRef.value!.getContext('2d')
        bgCtx.value = bgCanvasRef.value!.getContext('2d')

        const img = new Image()
        img.src = canvasBackgroundUrl
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          if (canvasRef.value && bgCanvasRef.value && containerRef.value) {
            // 原始图片尺寸
            width.value = img.naturalWidth
            height.value = img.naturalHeight

            // 容器可用尺寸（弹窗内容区域，减去头部和底部）
            const containerWidth = 475 // 539 - 32*2 (左右padding)
            const containerHeight = 375 // 弹窗内容区域高度

            // 计算等比例缩放
            const scaleX = containerWidth / width.value
            const scaleY = containerHeight / height.value
            scale.value = Math.min(scaleX, scaleY)

            // 显示尺寸
            displayWidth.value = width.value * scale.value
            displayHeight.value = height.value * scale.value

            // 画布保持原始尺寸（用于绘制和导出）
            canvasRef.value.width = width.value
            canvasRef.value.height = height.value
            bgCanvasRef.value.width = width.value
            bgCanvasRef.value.height = height.value

            // 在背景画布上绘制原始尺寸的图片
            bgCtx.value!.drawImage(img, 0, 0, width.value, height.value)
          }
        }

        useEventListener(canvasRef.value, 'mousedown', startDrawing)
        useEventListener(canvasRef.value, 'mousemove', draw)
        useEventListener(canvasRef.value, 'mouseup', stopDrawing)
      }
    }

    function startDrawing(e: MouseEvent) {
      isDrawing.value = true
      // 将显示坐标转换为原始画布坐标
      const rect = canvasRef.value!.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale.value
      const y = (e.clientY - rect.top) / scale.value
      lastX.value = x
      lastY.value = y
    }

    function draw(e: MouseEvent) {
      if (!isDrawing.value || !drawCtx.value || !canvasRef.value)
        return

      // 将显示坐标转换为原始画布坐标
      const rect = canvasRef.value.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale.value
      const y = (e.clientY - rect.top) / scale.value

      drawCtx.value.beginPath()
      drawCtx.value.moveTo(lastX.value, lastY.value)
      drawCtx.value.lineTo(x, y)
      drawCtx.value.lineWidth = props.brushSize
      drawCtx.value.strokeStyle = props.brushColor
      drawCtx.value.lineCap = 'round'
      drawCtx.value.stroke();
      [lastX.value, lastY.value] = [x, y]
    }

    function stopDrawing() {
      isDrawing.value = false
    }

    function clear() {
      drawCtx.value?.clearRect(0, 0, width.value, height.value)
      initCanvas(props.src)
    }

    const { upload } = useUploadImage()

    async function uploadFile(file: File) {
      try {
        const { successList, failedList } = await upload([file], true)
        if (failedList && failedList.length > 0) {
          throw new Error('上传失败')
        }
        if (successList && successList.length > 0) {
          return {
            status: 'success' as const,
            response: { url: successList[0].imageUrl },
          }
        }
        throw new Error('上传失败')
      }
      catch (error: any) {
        return {
          status: 'fail' as const,
          error: error?.message || '上传失败',
          response: {},
        }
      }
    }

    function covertCanvasToAlaphaBase64() {
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = width.value
      finalCanvas.height = height.value
      const finalCtx = finalCanvas.getContext('2d')!
      finalCtx.drawImage(bgCanvasRef.value!, 0, 0)
      finalCtx.globalCompositeOperation = 'destination-out'
      finalCtx.drawImage(canvasRef.value!, 0, 0)
      finalCtx.globalCompositeOperation = 'source-over'
      return finalCanvas.toDataURL('image/png')
    }

    function covertCanvasToBlackWhiteBase64() {
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = width.value
      finalCanvas.height = height.value
      const finalCtx = finalCanvas.getContext('2d')!

      // 先填充黑色背景
      finalCtx.fillStyle = '#000000'
      finalCtx.fillRect(0, 0, width.value, height.value)

      // 获取涂抹画布的像素数据
      const sourceImageData = drawCtx.value!.getImageData(0, 0, width.value, height.value)
      const sourceData = sourceImageData.data

      // 创建目标图像数据
      const targetImageData = finalCtx.createImageData(width.value, height.value)
      const targetData = targetImageData.data

      // 遍历每个像素
      for (let i = 0; i < sourceData.length; i += 4) {
        // 如果源像素有内容（alpha > 0），说明被涂抹过，设置为白色
        if (sourceData[i + 3] > 0) {
          // 被涂抹的地方，设置为白色
          targetData[i] = 255 // R
          targetData[i + 1] = 255 // G
          targetData[i + 2] = 255 // B
          targetData[i + 3] = 255 // A
        }
        else {
          // 未被涂抹的地方，保持黑色
          targetData[i] = 0 // R
          targetData[i + 1] = 0 // G
          targetData[i + 2] = 0 // B
          targetData[i + 3] = 255 // A
        }
      }

      finalCtx.putImageData(targetImageData, 0, 0)
      return finalCanvas.toDataURL('image/png')
    }

    async function getCanvasAlaphaUrl() {
      if (!drawCtx.value || !bgCtx.value)
        return { alaphaUrl: '', blackWhiteUrl: '' }

      const randomNum = Math.floor(Math.random() * 1000000)

      // 生成透明背景图片
      const alaphaBase64 = covertCanvasToAlaphaBase64()
      const alaphaFileName = `output-alapha-${randomNum}.png`
      const alaphaFile = base64ToFile(alaphaBase64, alaphaFileName, 'image/png')
      const alaphaResult = await uploadFile(alaphaFile)

      if (alaphaResult.status !== 'success' || !alaphaResult.response?.url) {
        throw new Error(alaphaResult.error || '上传透明背景图片失败')
      }

      // 生成黑白图片
      const blackWhiteBase64 = covertCanvasToBlackWhiteBase64()
      const blackWhiteFileName = `output-blackwhite-${randomNum}.png`
      const blackWhiteFile = base64ToFile(blackWhiteBase64, blackWhiteFileName, 'image/png')
      const blackWhiteResult = await uploadFile(blackWhiteFile)

      if (blackWhiteResult.status !== 'success' || !blackWhiteResult.response?.url) {
        throw new Error(blackWhiteResult.error || '上传黑白图片失败')
      }

      return {
        alaphaUrl: alaphaResult.response.url,
        blackWhiteUrl: blackWhiteResult.response.url,
      }
    }

    onMounted(() => {
      initCanvas(props.src)
    })

    watch(() => props.src, (src) => {
      initCanvas(src)
    })

    const exposed: EditImageWithCanvasInst = {
      clear,
      getCanvasAlaphaUrl,
    }

    expose(exposed)

    return {
      height,
      width,
      displayWidth,
      displayHeight,
      scale,
      clear,
      canvasRef,
      bgCanvasRef,
      containerRef,
    }
  },
  render() {
    return (
      <div
        ref="containerRef"
        class="relative flex items-center justify-center"
        style={{
          background: this.brushColor,
          width: `${this.displayWidth}px`,
          height: `${this.displayHeight}px`,
        }}
      >
        <canvas
          ref="bgCanvasRef"
          style={{
            width: `${this.displayWidth}px`,
            height: `${this.displayHeight}px`,
          }}
        />
        <canvas
          class="absolute left-0 top-0"
          ref="canvasRef"
          style={{
            width: `${this.displayWidth}px`,
            height: `${this.displayHeight}px`,
          }}
        />
      </div>
    )
  },
})
