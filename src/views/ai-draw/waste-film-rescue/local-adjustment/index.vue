<script setup lang="ts">
import type { CustomRequestParams, EchoData, SubmitParams, SubmitRequestParams } from './index.api'
import type { Annotation } from './index copy.vue'
import type { TaskInfo } from '@/store/use-user-store'
import { Icon } from '@iconify/vue'
import { useMessage } from 'naive-ui'
import { computed, nextTick, ref } from 'vue'
import ImageDisplay from '@/components/image-display/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import { useUploadImage } from '@/composables/use-upload-image'
import { $t } from '@/locales/locales'
import { useCurrentRouteData } from '../../composables/useCurrentRouteData'
import { useGenerateTask } from '../../composables/useGenerateTask'
import { getImageRatio, getResolutionFromRatioLabel } from '../../utils/getImageRatio'
import markerEditor from './components/marker-editor.vue'
import { Api } from './index.api'
import ImageAnnotationTool from './index copy.vue'

const message = useMessage()
const { currentRouteData } = useCurrentRouteData()
console.log(currentRouteData.value, 'currentRouteData')

const values = ref<CustomRequestParams>({
  // 比例
  size: '16:9',
  // 尺寸
  imageSize: '2K',
  //  参考图列表
  styleUrl: [],
})

// 添加图片选择器的 ref
const imageGallerySelectorRef = ref()
const markerEditorRef = ref()
const currentImageIndex = ref(0) // 当前标记的图片索引
const globalAnnotations = ref<Annotation[]>([]) // 全局标注数据
const maxId = ref(0) // 最大标记ID

function handleImageConfirm(value: string | null) {
  if (!value)
    return
  if (values.value.styleUrl.length >= 5) {
    return message.warning('最多上传5张图片')
  }
  values.value.styleUrl.push(value)
}

function reindexAllAnnotations() {
  let id = 1

  // 按图片顺序来
  const imageCount = values.value.styleUrl.length

  const newList: Annotation[] = []

  for (let imgIndex = 1; imgIndex <= imageCount; imgIndex++) {
    const list = globalAnnotations.value
      .filter(a => a.index === imgIndex)

    list.forEach((a) => {
      newList.push({
        ...a,
        id,
      })
      id++
    })
  }

  globalAnnotations.value = newList
  maxId.value = id - 1
}

function removeImage(index: number) {
  values.value.styleUrl.splice(index, 1)
  // 移除对应图片的标注
  globalAnnotations.value = globalAnnotations.value.filter(a => a.index !== index + 1)
  // 3. 修正后续图片的 index（非常重要）
  globalAnnotations.value.forEach((a) => {
    if (a.index! > index + 1) {
      a.index!--
    }
  })
  // 4. 重新编号（核心）
  reindexAllAnnotations()
  // 如果删除的是当前标记的图片，且还有其他图片，则调整currentImageIndex
  if (currentImageIndex.value === index && values.value.styleUrl.length > 0) {
    currentImageIndex.value = Math.min(currentImageIndex.value, values.value.styleUrl.length - 1)
  }
  else if (currentImageIndex.value > index) {
    currentImageIndex.value = currentImageIndex.value - 1
  }
  console.log(currentImageIndex.value, '123')
}

const showActionPanel = ref(false) // 右侧动作图选择面板
const markers = computed(() => {
  const result = globalAnnotations.value.map(t => ({
    id: t.id!,
    text: `图${t.index}中的标记${t.id}`,
    imageIndex: t.index!,
    point: t.id!,
  }))
  return result
})

function validateAll() {
  if (!values.value.styleUrl.length) {
    message.warning('请上传图片')
    return false
  }
  if (markerEditorRef.value && !markerEditorRef.value.outputText) {
    message.warning('请填写调整内容')
    return false
  }
  return true
}

function uploadRefrenceImage() {
  imageGallerySelectorRef.value.openGalleryModal()
}

function closeActionPanel() {
  showActionPanel.value = false
}

function updateAnnotations(annotations: Annotation[]) {
  console.log('updateAnnotations called with:', annotations)
  const currentIndex = currentImageIndex.value + 1
  // 移除当前图片的旧标注
  globalAnnotations.value = globalAnnotations.value.filter(a => a.index !== currentIndex)
  // 为没有 id 的标注分配 id
  annotations.forEach((anno) => {
    if (!anno.id) {
      anno.id = ++maxId.value
    }
  })
  globalAnnotations.value.push(...annotations)
  console.log('globalAnnotations after update:', globalAnnotations.value)
}

function handleUndo() {
  const currentIndex = currentImageIndex.value + 1
  const currentAnnos = globalAnnotations.value.filter(a => a.index === currentIndex)
  if (currentAnnos.length === 0)
    return
  const last = currentAnnos.reduce((prev, curr) => curr.id! > prev.id! ? curr : prev)
  globalAnnotations.value = globalAnnotations.value.filter(a => a !== last)

  // 重新编号
  reindexAllAnnotations()
}

function handleClearCurrent() {
  const currentIndex = currentImageIndex.value + 1
  globalAnnotations.value = globalAnnotations.value.filter(a => a.index !== currentIndex)
  reindexAllAnnotations()
}

const generatePoints = computed(() => {
  const basicPoint = currentRouteData.value.point
  return basicPoint * (values.value.styleUrl.length || 1)
})

const submitValues = ref<SubmitRequestParams>({
  // 原图
  url: null,
  // 拼接的提示词
  text: '',
  // 比例
  size: '16:9',
  sizex: '1600x900',
  // 尺寸
  imageSize: '2K',
})

const { upload } = useUploadImage()
async function preGenerateHandler() {
  closeActionPanel()
  // const index = markerEditorRef.value?.finalPointsIndex()
  // const needImageUrl = values.value.styleUrl.length === 1
  //   ? values.value.styleUrl[0]
  //   : values.value.styleUrl[index - 1]
  const needImageUrl = values.value.styleUrl[0]
  const size = await getImageRatio(needImageUrl)
  submitValues.value.text = markerEditorRef.value?.outputText
  submitValues.value.size = size
  submitValues.value.sizex = getResolutionFromRatioLabel(size)
  submitValues.value.imageSize = values.value.imageSize
  const fileList = await generateAllPreviews()
  const { successList } = await upload(fileList, true)

  submitValues.value.url = successList.map(f => f.imageUrl).join(',')
}

const context = computed<EchoData>(() => {
  return {
    styleUrl: values.value.styleUrl,
    globalAnnotations: globalAnnotations.value,
    maxId: maxId.value,
    model: markerEditorRef.value?.model,
    imageSize: values.value.imageSize,
    size: values.value.size,
  }
})

async function handleEchoData(context: EchoData) {
  values.value = {
    styleUrl: context.styleUrl,
    imageSize: context.imageSize,
    size: context.size,
  }
  globalAnnotations.value = context.globalAnnotations
  maxId.value = context.maxId
  await nextTick()
  console.log(markerEditorRef.value, 'markerEditorRef.value')
  if (markerEditorRef.value) {
    if (context.model) {
      markerEditorRef.value.setModel(context.model)
    }
  }
}

async function generateAllPreviews(): Promise<File[]> {
  const previews: File[] = []
  for (let i = 0; i < values.value.styleUrl.length; i++) {
    const url = values.value.styleUrl[i]
    const annotations = globalAnnotations.value.filter(a => a.index === i + 1)
    const preview = await generateSinglePreview(url, annotations)
    previews.push(preview)
  }
  return previews
}

async function generateSinglePreview(imageUrl: string, annotations: Annotation[]): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const cvs = document.createElement('canvas')
      cvs.width = img.width
      cvs.height = img.height
      const gc = cvs.getContext('2d')!
      gc.drawImage(img, 0, 0)

      gc.lineWidth = 5
      gc.font = 'bold 24px Arial'

      annotations.forEach((a) => {
        gc.strokeStyle = '#f1c40f'
        gc.beginPath()
        let lx = 0
        let ly = 0

        if (a.type === 'rect') {
          gc.rect(a.x, a.y, a.w, a.h)
          lx = a.x
          ly = a.y
        }
        else if (a.type === 'circle') {
          gc.ellipse(
            a.x + a.w / 2,
            a.y + a.h / 2,
            Math.abs(a.w / 2),
            Math.abs(a.h / 2),
            0,
            0,
            Math.PI * 2,
          )
          lx = a.x
          ly = a.y
        }
        else if (a.type === 'polygon') {
          gc.moveTo(a.points[0].x, a.points[0].y)
          a.points.forEach(p => gc.lineTo(p.x, p.y))
          gc.closePath()
          lx = a.points[0].x
          ly = a.points[0].y
        }

        gc.stroke()

        // 序号
        gc.beginPath()
        gc.arc(lx, ly, 20, 0, Math.PI * 2)
        gc.fillStyle = '#2c3e50'
        gc.fill()
        gc.fillStyle = '#fff'
        gc.textAlign = 'center'
        gc.textBaseline = 'middle'
        gc.fillText(a.id!.toString(), lx, ly)

        // 文字标签
        if (a.text) {
          gc.textAlign = 'left'
          const w = gc.measureText(a.text).width
          gc.fillStyle = 'rgba(0,0,0,0.7)'
          gc.fillRect(lx + 25, ly - 15, w + 20, 30)
          gc.fillStyle = '#fff'
          gc.fillText(a.text, lx + 35, ly)
        }
      })

      cvs.toBlob((blob) => {
        if (blob) {
          const randomName = `${Math.random().toString(36).substring(2)}.jpg`
          const file = new File([blob], randomName, { type: 'image/jpeg' })
          resolve(file)
        }
      }, 'image/jpeg', 0.9)
    }
    img.src = imageUrl
  })
}

const {
  resultUrl,
  generateStatus,
  buttonText,
  isButtonDisabled,
  handleGenerate,
} = useGenerateTask<SubmitParams, TaskInfo>({
  context,
  api: Api,
  validateAll,
  handleEchoData,
  currentRouteData,
  preGenerateHandler,
  values: submitValues,
})

defineExpose({
  generateAllPreviews,
})
</script>

<template>
  <div class="w-full h-full flex">
    <div class="setting-list relative">
      <n-scrollbar
        :x-scrollable="false"
        class="h-full w-full"
      >
        <div class="scrollbar-content">
          <div class="headline">
            图片上传
            <span class="subhead">（最多支持上传5张）</span>
          </div>
          <image-gallery-selector
            ref="imageGallerySelectorRef"
            :model-value="null"
            @confirm="handleImageConfirm"
          >
            <div class="upload-list">
              <div
                v-for="(url, idx) in values.styleUrl"
                :key="url"
                class="upload-img"
              >
                <div class="flex flex-col items-center justify-center img-box">
                  <div class="reference">
                    图{{ idx + 1 }}
                  </div>
                  <div class="overflow-hidden relative group cursor-pointer img">
                    <img
                      :src="url"
                      class="size-full object-cover"
                    >
                    <div
                      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-11"
                      @click="removeImage(idx)"
                    >
                      <img
                        class="size-20px"
                        src="@/assets/icon/trash.svg"
                      >
                    </div>
                  </div>
                  <div
                    class="mark-btn"
                    @click="currentImageIndex = idx; showActionPanel = true"
                  >
                    标记图片
                  </div>
                </div>
              </div>
              <div
                v-show="values.styleUrl.length < 5"
                class="add-btn"
                :class="values.styleUrl.length > 0 ? 'add-btn1' : ''"
                @click="uploadRefrenceImage"
              >
                <icon
                  icon="mdi:plus"
                  class="add-icon"
                />
              </div>
            </div>
          </image-gallery-selector>
          <div
            v-show="values.styleUrl.length"
            class="hint"
          >
            <img
              src="@/assets/icon/prompt.png"
              class="icon"
            >
            <span>在图片标记，需要修改/参考的部分</span>
          </div>
          <div class="headline">
            描述调整内容
            <span class="subhead">（点击标记点，描述调整内容）</span>
          </div>
          <marker-editor
            ref="markerEditorRef"
            :markers="markers"
          />
          <div class="headline interval">
            分辨率
          </div>
          <div class="dpi-box">
            <div
              v-for="item in [
                { label: '2K', value: '2K' },
                { label: '4K', value: '4K' },
              ]"
              :key="item.value"
              class="dpi-item"
              :class="[item.value === values.imageSize ? 'dpi-activity' : '']"
              @click="values.imageSize = item.value"
            >
              {{ item.label }}
            </div>
          </div>
        </div>
      </n-scrollbar>
      <!-- 固定底部按钮 -->
      <div
        class="absolute bottom-0 left-0 box-border generate-box"
      >
        <n-button
          class="generate-btn"
          :class="isButtonDisabled ? 'generate-activity' : ''"
          color="#FF6A00"
          :disabled="isButtonDisabled"
          size="large"
          @click="handleGenerate"
        >
          <div class="generate-text">
            <span>{{ buttonText }}</span>
            <img
              class="arrow-right"
              src="@/assets/icon/arrow-right.png"
            >
          </div>

          <div class="generate-tip">
            {{ $t('aiDraw.common.costPoints', { points: generatePoints }) }}
          </div>
        </n-button>
      </div>
    </div>
    <div
      v-show="showActionPanel && values.styleUrl.length"
      class="h-full w-[calc(100%-360px)] box-border p-24px relative"
    >
      <image-annotation-tool
        :image-url="values.styleUrl[currentImageIndex] || ''"
        :show-action-panel="showActionPanel"
        :index="currentImageIndex + 1"
        :annotations="globalAnnotations.filter(a => a.index === currentImageIndex + 1)"
        :images="values.styleUrl"
        @update:annotations="updateAnnotations"
        @undo="handleUndo"
        @clear-current="handleClearCurrent"
        @switch-image="currentImageIndex = $event"
      />
    </div>
    <div
      v-show="!showActionPanel"
      class="h-full w-[calc(100%-360px)] box-border p-y-103px p-x-24px bg-#fcfcfc relative"
    >
      <div class="size-full relative">
        <image-display
          :generate-status="generateStatus"
          :result-url="resultUrl"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
:deep(.n-scrollbar) {
  width: 27.4375rem;
}
.setting-list {
  width: 27.4375rem;
  border: 0.0625rem solid #e5e7eb;
  border-width: 0rem 0.0625rem 0rem 0.0625rem;
  .scrollbar-content {
    width: 100%;
    padding: 2.5rem 2.5rem 9.0625rem;
    box-sizing: border-box;
    .line {
      width: 100%;
      height: 0.0625rem;
      background: #f3f4f6;
      margin: 1.5rem 0;
    }
  }
}
.headline {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: bold;
  line-height: 1.3125rem;
  color: #111111;
  display: block;
  padding-bottom: 0.875rem;
  .subhead {
    font-size: 0.75rem;
    font-weight: 500;
    color: #9ca3af;
  }
}
.interval {
  margin-top: 2.25rem;
}
.upload-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.125rem;
  margin-bottom: 2rem;
  .upload-img {
    width: calc((100% - 1.125rem) / 2);
    aspect-ratio: 1;
    box-sizing: border-box;
    .img-box {
      gap: 0.75rem;
      position: relative;
      .img {
        width: 10.4688rem;
        height: 10.4688rem;
        border-radius: 1rem;
      }
      .mark-btn {
        width: 100%;
        height: 2.4688rem;
        border-radius: 0.75rem;
        background: #ff5500;
        box-shadow:
          0rem 0.25rem 0.375rem -0.25rem rgba(255, 85, 0, 0.2),
          0rem 0.625rem 0.9375rem -0.1875rem rgba(255, 85, 0, 0.2),
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Inter', sans-serif;
        font-size: 0.8125rem;
        font-weight: bold;
        line-height: 1.2188rem;
        color: #ffffff;
      }
      .mark-btn:hover {
        background-color: #ea580c;
      }
      .reference {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 10;
        width: 25%;
        height: 1.4375rem;
        border-radius: 0.5rem;
        opacity: 1;
        background: rgba(255, 85, 0, 0.9);
        backdrop-filter: blur(0.25rem);
        box-shadow:
          0rem 0.0625rem 0.125rem 0rem rgba(0, 0, 0, 0.05),
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
          0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
        font-size: 0.625rem;
        font-weight: bold;
        color: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }
  .add-btn {
    width: 100%;
    height: 10.7188rem;
    border-radius: 1rem;
    background: #f9fafb;
    box-sizing: border-box;
    border: 2px dashed #f3f4f6;
    box-shadow:
      0rem 0.0625rem 0.125rem 0rem rgba(0, 0, 0, 0.05),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    .add-icon {
      width: 1.75rem;
      height: 1.75rem;
      color: #9ca3af;
    }
  }
  .add-btn1 {
    width: calc((100% - 1.125rem) / 2);
    aspect-ratio: 1;
  }
  .add-btn:hover {
    border-color: #ffccb2;
    background-color: #ffffff;
    .add-icon {
      color: #ff5500;
    }
  }
}
.hint {
  width: 100%;
  height: 3.4456rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 1rem;
  background: rgba(255, 247, 237, 0.6);
  box-sizing: border-box;
  border: 0.0625rem solid rgba(255, 237, 213, 0.5);
  margin-bottom: 2rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  font-weight: bold;
  color: #ff5500;
  padding-left: 1.0625rem;
  .icon {
    width: 1.125rem;
    height: 1.125rem;
  }
}
.dpi-box {
  width: 100%;
  height: 3.75rem;
  border-radius: 1rem;
  background: #f9fafb;
  padding: 0.375rem;
  box-sizing: border-box;
  display: flex;
  gap: 0.75rem;
  .dpi-item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 900;
    color: #9ca3af;
    border-radius: 0.75rem;
    cursor: pointer;
  }
  .dpi-item:hover {
    color: #111111;
  }
  .dpi-activity {
    background: #ffffff;
    box-shadow:
      0rem 0.125rem 0.25rem -0.125rem rgba(0, 0, 0, 0.1),
      0rem 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    color: #111111;
  }
}
.generate-box {
  width: 100%;
  padding: 2rem 2.5rem;
  background: #ffffff;
  box-shadow:
    0rem -0.625rem 1.875rem -0.9375rem rgba(0, 0, 0, 0.05),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
    0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
  border-top: 0.0625rem solid #e5e7eb;
  z-index: 12;
  .generate-btn {
    width: 100%;
    height: 4rem;
    border-radius: 624.9375rem;
    box-sizing: border-box;
    background: #ff5500;
    box-shadow:
      0rem 0.9375rem 2.5rem -0.625rem rgba(255, 85, 0, 0.35),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0),
      0rem 0rem 0rem 0rem rgba(0, 0, 0, 0);
    cursor: pointer;
    :deep(.n-button__content) {
      display: flex;
      flex-direction: column;
    }
    .generate-text {
      height: 1.6875rem;
      display: flex;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 900;
      line-height: 1.6875rem;
      letter-spacing: -0.0281rem;
      color: #ffffff;
      .arrow-right {
        width: 1.125rem;
        height: 1.125rem;
        margin-left: 0.325rem;
        transition: transform 0.3s ease-out;
      }
    }
    .generate-tip {
      font-family: 'Inter', sans-serif;
      font-size: 0.6875rem;
      font-weight: bold;
      line-height: 1.0313rem;
      letter-spacing: -0.0175rem;
      color: #ffddcc;
    }
  }
  .generate-btn:hover {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    background-position: -200% 0;
    animation: sweep 4s infinite linear;

    /* 基础背景色 */
    background-color: #ea580c;
    background-blend-mode: overlay;
    .generate-text {
      .arrow-right {
        transform: translateX(0.3125rem);
      }
    }
  }
  .generate-activity,
  .generate-activity:hover {
    cursor: not-allowed;
    .generate-text {
      .arrow-right {
        transform: none;
      }
    }
  }

  @keyframes sweep {
    100% {
      background-position: -200% 0;
    }
    0% {
      background-position: 200% 0;
    }
  }
}
</style>
