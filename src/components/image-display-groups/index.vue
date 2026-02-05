<script lang="ts" setup>
import type { GenerateStatus } from '@/components/image-display'
import type { GenerateDataItem } from '@/views/ai-draw/composables/useGenerateTaskPolling'
import { watch } from 'vue'
import { GenerateStatusEnum } from '@/components/image-display'
import ImageDisplay from '@/components/image-display/index.vue'

interface Props {
  generateStatus: GenerateStatus
  /** 结果图片URL */
  resultUrl: string
  generateDataList: GenerateDataItem[]
}

const props = defineProps<Props>()

watch(() => props.generateDataList, (val, newVal) => {
  console.log('generateDataList111', val)
  console.log('generateDataList222', newVal)
})
// const curPreviewIndex = ref<number>(0)
// const carouselRef = useTemplateRef<CarouselInst>('carouselRef')

// const images = computed(() => props.resultUrl.split(','))
</script>

<template>
  <div class="size-full flex gap-17px">
    <div
      v-if="generateStatus === GenerateStatusEnum.IDLE || generateDataList.length < 1"
      class="rounded-16px bg-#FFF relative overflow-hidden w-full"
    >
      <image-display
        :generate-status="generateStatus"
        :result-url="resultUrl"
      />
    </div>
    <div
      v-else-if="generateDataList.length <= 1"
      class="rounded-16px bg-#FFF relative overflow-hidden w-full"
    >
      <image-display
        :generate-status="generateStatus"
        :result-url="generateDataList[0].resultUrl!"
      />
    </div>
    <div
      v-else
      class="size-full flex flex-wrap items-center justify-around"
    >
      <div
        v-for="(item, index) in generateDataList"
        :key="index"
        class="relative overflow-hidden rounded-16px size-49%!"
      >
        <image-display
          :generate-status="item.generateStatus"
          :result-url="item.resultUrl ?? ''"
          class="bg-#FFF"
        />
      </div>
    </div>
    <!-- <div
      v-if="generateStatus === GenerateStatusEnum.FINISHED && images.length > 1"
      class="w-23% rounded-16px bg-#FFF flex flex-col h-280px [box-shadow:0px_4px_7px_0px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      <n-carousel
        ref="carouselRef"
        v-model:current-index="curPreviewIndex"
        class="h-224px w-full"
      >
        <img
          v-for="item in images"
          :key="item"
          :src="item"
          class="size-full object-cover"
        >
      </n-carousel>
      <div
        class="flex items-center justify-center gap-8px select-none h-53px"
      >
        <img
          :src="chevronLeftBlack"
          class="cursor-pointer size-18px"
          @click="carouselRef?.prev()"
        >
        <div class="text-12px c-#000 line-height-24px">
          预览图 {{ curPreviewIndex + 1 }} / {{ images.length }}
        </div>
        <img
          :src="chevronLeftBlack"
          class="cursor-pointer size-18px transform-rotate-180"
          @click="carouselRef?.next()"
        >
      </div>
    </div> -->
  </div>
</template>
