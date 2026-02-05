<script setup lang="ts">
import type { EffectDescItem } from '../motion-adjustment/index.api'
import type { CustomRequestParams, EchoData, EffectDesc, SubmitParams, SubmitRequestParams } from './index.api'
import type { TaskInfo } from '@/store/use-user-store'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CollapseSelect from '@/components/collapse-select/index.vue'
import ImageDisplay from '@/components/image-display/index.vue'
import ImageGallerySelector from '@/components/image-gallery-selector/index.vue'
import { $t } from '@/locales/locales'
import { useCurrentRouteData } from '../../composables/useCurrentRouteData'
import { useGenerateTask } from '../../composables/useGenerateTask'
import { Api as DrawApi } from '../../index.api'
import { getImageRatio, getResolutionFromRatioLabel } from '../../utils/getImageRatio'
import ExpressionSelect from './components/expression-select.vue'
import { Api } from './index.api'

const message = useMessage()
const route = useRoute()
const { currentRouteData } = useCurrentRouteData()
console.log(currentRouteData.value, 'currentRouteData')

const values = ref<CustomRequestParams>({
  // 原图
  url: null,
  // 尺寸
  imageSize: '2K',
  //  参考图列表
  styleUrl: [],
  // 比例
  size: '16:9',
  sizex: '1600:900',
})
const showCustomModal = ref(false)
const modalTitle = ref('')
const customValue = ref('')
const refrenceUrl = ref('')
const expressionSelectRefs = ref([])

const groups = ref<EffectDesc[]>([])
watch(currentRouteData.value, () => {
  let options: EffectDesc[] = []
  const effectDesc = currentRouteData.value.effectDesc
  if (effectDesc) {
    options = JSON.parse(effectDesc) as EffectDesc[]
  }
  else {
    options = []
  }
  groups.value = options.map((g) => {
    return {
      title: g.title,
      value: '',
      options: [
        ...g.options,
        {
          label: '自定义',
          prompt: '自定义',
          replaceValue: 'custome',
        },
      ],
    }
  })
  console.log(groups.value, 'groups')
}, { immediate: true })
const customText = ref('') // 高级自定义文案
// 添加图片选择器的 ref
const imageGallerySelectorRef = ref()

function handleImageConfirm(value: string | null) {
  if (!value)
    return
  values.value.styleUrl.push(value)
}

function removeImage(index: number) {
  values.value.styleUrl.splice(index, 1)
}

function onChange(index: number, val: string) {
  console.log('当前选中:', index, val)
  if (val !== '自定义') {
    console.log(groups)
    return
  }
  modalTitle.value = groups.value[index].title
  showCustomModal.value = true
};

function onDelete(index: number, val: string) {
  console.log('删除选中:', index, val)
  const group = groups.value[index]
  if (group) {
    // 替换最后一个选项内容为自定义文案
    group.options = group.options.splice(0, group.options.length - 1).concat({
      label: '自定义',
      prompt: '自定义',
      replaceValue: 'custome',
    })
    group.value = ''
  }
}

function validateAll() {
  if (!values.value.url) {
    message.warning($t('aiDraw.common.messages.addOriginalImage'))
    return false
  }
  const groupCondition = groups.value.some(g => g.value !== '')
  if (!groupCondition && !customText.value) {
    message.warning(`请选择/输入优化内容`)
    return false
  }
  return true
}

const submitValues = ref<SubmitRequestParams>({
  // 原图
  url: null,
  // 拼接的提示词
  text: '',
  // 比例
  size: '16:9',
  // 尺寸
  imageSize: '2K',
  sizex: '1600x900',
})

async function preGenerateHandler() {
  const { styleUrl, url, ...rest } = values.value
  const traUrl = refrenceUrl.value ? `,${refrenceUrl.value}` : `,${styleUrl.join(',')}`
  const endUrl = (refrenceUrl.value || styleUrl.length > 0) ? `${values.value.url}${traUrl}` : values.value.url
  submitValues.value = { ...rest, url: endUrl }
  // 构建完整提示词
  const groupText = groups.value.map((g) => {
    if (g.value === '')
      return null
    return g.options.find(o => o.label === g.value)?.prompt
  }).filter(Boolean).join('，')
  submitValues.value.text = groupText + (refrenceUrl.value ? '' : customText.value)
  const userSelectSize = groups.value.find(t => t.title === '智能尺寸优化')?.value
  submitValues.value.size = userSelectSize || (values.value.url ? await getImageRatio(values.value.url) : values.value.size)
  submitValues.value.sizex = getResolutionFromRatioLabel(submitValues.value.size)
}

const context = computed<EchoData>(() => {
  return {
    groups: groups.value,
    url: values.value.url,
    customText: customText.value,
    styleUrl: values.value.styleUrl,
    imageSize: values.value.imageSize,
    size: values.value.size,
    refrenceUrl: refrenceUrl.value,
  }
})

function handleEchoData(context: EchoData) {
  groups.value = context.groups
  customText.value = context.customText
  refrenceUrl.value = context.refrenceUrl
  values.value = {
    url: context.url,
    styleUrl: context.styleUrl,
    imageSize: context.imageSize,
    size: context.size,
    sizex: '1600:900',
  }
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

function closeCustomModal() {
  showCustomModal.value = false
  customValue.value = ''
}
function confirmCustomModal() {
  const newName = customValue.value.trim()
  if (!newName) {
    message.warning(`请输入自定义${modalTitle.value}动作`)
    return
  }

  const group = groups.value.find(g => g.title === modalTitle.value)
  if (group) {
    group.options = group.options.map(o => (o.label === '自定义'
      ? {
          label: newName,
          prompt: newName,
          replaceValue: 'custome',
        }
      : o))
    group.value = newName
  }

  closeCustomModal()
}

const originListData = ref<EffectDescItem[]>([])
async function getTemplateInfo() {
  const { data } = await DrawApi.getEffectList({
    id: currentRouteData.value.effectId,
  })
  originListData.value = data ?? []
}

function findStyleById(id: any): any {
  const targetId = String(id)
  for (const group of originListData.value) {
    if (Array.isArray(group.style)) {
      const found = group.style.find(item => String(item.id) === targetId)
      if (found)
        return found
    }
  }
  return undefined
}

onMounted(async () => {
  await getTemplateInfo()
  if (route.query.id) {
    const echoData = findStyleById(route.query.id as string)
    refrenceUrl.value = (JSON.parse(echoData.images) || [])[0]
    values.value.url = echoData.styleUrl
    const findValue = JSON.parse(echoData.text) as { title: string, value: string }[]
    findValue.forEach((v) => {
      const groupIndex = groups.value.findIndex(g => g.title === v.title)
      if (~groupIndex) {
        groups.value[groupIndex].value = v.value
        const groupRef = expressionSelectRefs.value[groupIndex] as any
        groupRef.toggle?.(false)
      }
    })
  }
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
          <span class="headline">
            {{ $t('aiDraw.common.sections.originalImage') }}
          </span>
          <image-gallery-selector
            v-model="values.url"
            :aspect-ratio="353 / 176"
          />
          <div class="headline interval">
            表情参考图
            <span class="subhead">(选填)</span>
          </div>
          <image-gallery-selector
            v-model="refrenceUrl"
            :aspect-ratio="353 / 176"
          />
          <div class="line" />
          <expression-select
            v-for="(group, i) in groups"
            ref="expressionSelectRefs"
            :key="i"
            v-model="group.value"
            :title="group.title"
            :options="group.options"
            @change="val => onChange(i, val)"
            @delete="val => onDelete(i, val)"
          />
          <collapse-select
            title="高清化"
            sub-title="去重影"
            type="1"
          >
            <div
              v-for="item in [
                { label: '2K', value: '2K' },
                { label: '4K', value: '4K' },
              ]"
              :key="item.value"
              class="relative group flex overflow-hidden option-item"
              :class="{
                'option-activity': item.value === values.imageSize,

              }"
              @click="values.imageSize = item.value"
            >
              {{ item.label }}
            </div>
          </collapse-select>
          <collapse-select
            v-show="!refrenceUrl && false"
            title="高级自定义"
            sub-title="支持上传6张"
            tooltip-url="https://www.baidu.com/"
            type="2"
          >
            <div class="advanced-customization">
              <image-gallery-selector
                ref="imageGallerySelectorRef"
                :model-value="null"
                @confirm="handleImageConfirm"
              >
                <div class="flex flex-wrap img-list">
                  <!-- 图片列表 -->
                  <div
                    v-for="(img, idx) in values.styleUrl"
                    :key="img"
                    class="relative overflow-hidden cursor-pointer group img-item"
                  >
                    <img
                      :src="img"
                      class="w-full h-full object-cover"
                    >

                    <!-- 遮罩删除按钮 -->
                    <div
                      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                      @click="removeImage(idx)"
                    >
                      <img
                        class="size-20px"
                        src="@/assets/icon/trash.svg"
                      >
                    </div>
                  </div>

                  <div
                    v-show="values.styleUrl.length < 6"
                    class="img-item"
                    @click="imageGallerySelectorRef.openGalleryModal()"
                  >
                    <img
                      src="@/assets/icon/add.svg"
                      class="add-icon"
                    >
                    <span class="add-text">上传参考图</span>
                  </div>
                </div>
              </image-gallery-selector>
              <n-input
                v-model:value="customText"
                class="input-textarea"
                type="textarea"
                maxlength="2000"
                show-count
                placeholder="请输入图片优化要求(选填)"
                rows="7"
              />
            </div>
          </collapse-select>
        </div>
      </n-scrollbar>
      <!-- 固定底部按钮 -->
      <div class="absolute bottom-0 left-0 box-border generate-box">
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
            {{ $t('aiDraw.common.costPoints', { points: currentRouteData.point }) }}
          </div>
        </n-button>
      </div>
    </div>
    <div class="h-full w-[calc(100%-360px)] box-border p-y-103px p-x-24px bg-#fcfcfc relative">
      <div class="size-full relative">
        <!-- 图片展示区域 -->
        <image-display
          :generate-status="generateStatus"
          :result-url="resultUrl"
        />
      </div>
    </div>
  </div>
  <n-modal
    v-model:show="showCustomModal"
    preset="card"
    style="width: 440px;border-radius: 24px;background-color: #FFF;"
  >
    <template #header>
      <div class="text-#000 text-16px font-medium">
        {{ `${modalTitle}-自定义` }}
      </div>
    </template>
    <div>
      <n-input
        v-model:value="customValue"
        type="textarea"
        maxlength="100"
        show-count
        :placeholder="`输入自定义${modalTitle}动作`"
      />
    </div>
    <template #footer>
      <div class="flex gap-3 justify-end">
        <n-button
          class="border border-gray-300"
          @click="closeCustomModal"
        >
          取消
        </n-button>
        <n-button
          type="primary"
          color="#000"
          @click="confirmCustomModal"
        >
          提交
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
.draw-area {
  background-image: url('@/assets/images/draw-content-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.setting-list {
  width: 27.4375rem;
  border: 0.0625rem solid #e5e7eb;
  border-width: 0rem 0.0625rem 0rem 0.0625rem;
  .scrollbar-content {
    width: 100%;
    padding: 2.5rem 2.5rem 8.0625rem 2.5rem;
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
  margin-top: 1.625rem;
}
.option-item {
  padding: 0.9375rem 1.125rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: bold;
  line-height: 1.3125rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0.75rem;
  cursor: pointer;
  box-sizing: border-box;
}
.option-item:hover,
.option-activity {
  background-color: #ff5500;
  color: #ffffff;
  box-shadow:
    0 0.625rem 0.9375rem -0.1875rem rgb(255 85 0 / 0.2),
    0 0.25rem 0.375rem -0.25rem rgb(255 85 0 / 0.2);
}
:deep(.n-scrollbar) {
  width: 27.4375rem;
}
.advanced-customization {
  width: 100%;
  .img-list {
    gap: 0.75rem;
    margin-bottom: 1rem;
    .img-item {
      width: 6rem;
      height: 6rem;
      border-radius: 1rem;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.4688rem;
      cursor: pointer;
      .add-icon {
        width: 1.5rem;
        height: 1.5rem;
        transition: transform 0.3s ease;
      }
      .add-text {
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: bold;
        line-height: 1.125rem;
        color: #6b7280;
      }
    }
    .img-item:hover {
      background-color: #e5e7eb;
      .add-icon {
        transform: scale(1.1);
      }
    }
  }
  .input-textarea {
    width: 100%;
    height: 8rem;
    background: #ffffff;
    box-sizing: border-box;
    --n-border-focus: 0.0625rem solid #ffccb2 !important;
    --n-border-hover: 0.0625rem solid #e5e7eb !important;
    --n-box-shadow-focus: none !important; /* 聚焦阴影 */
    --n-border-radius: 1rem !important;
    --n-border: 0.0625rem solid #e5e7eb !important;
    transition: none !important;
    :deep(.n-input-wrapper) {
      padding: 1.0625rem;
      box-sizing: border-box;
      .n-input__textarea-el {
        padding: 0 !important;
      }
      .n-input__placeholder {
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.3125rem;
        color: #757575;
        padding-top: 0;
      }
    }
    :deep(.n-input__border),
    :deep(.n-input__state-border) {
      transition: none !important;
    }
    &:not(:deep(.n-input--focus)):hover {
      :deep(.n-input__border),
      :deep(.n-input__state-border) {
        border-color: #e5e7eb !important;
        box-shadow: none !important;
      }
    }
  }
}
:deep(.n-input--focus) {
  .n-input-word-count {
    color: #ff5500;
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
