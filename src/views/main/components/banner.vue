<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useContactServiceModal } from '@/composables/use-contact-service-modal'
import { useProRequest } from '@/composables/use-pro-request'
import { useUserStore } from '@/store/use-user-store'
import { Api } from '../index.api'

const router = useRouter()
const { openContactServiceModal } = useContactServiceModal()
const {
  showLoginModal,
} = storeToRefs(useUserStore())

function openNewTab(path: string | any) {
  // 判断是否是http链接，如果是直接跳转
  if (path.startsWith('http')) {
    window.open(path)
    return
  }
  // 打开客服充值弹窗
  if (path === '/contact-service-modal') {
    openContactServiceModal()
    return
  }
  const url = router.resolve({
    path,
  })
  window.open(url.href, '_self')
}

const { data: bannerListInfo } = useProRequest(async () => {
  const result = await Api.getBannerList()
  console.log('轮播图数据', result.data)
  return (result.data ?? []).sort((a, b) => a.sort - b.sort)
})
function link(name: string) {
  const url = router.resolve({
    name,
  })
  window.open(url.href, '_self')
}

async function pushTo(path: string) {
  const failure = await router.push(path)
  console.log(failure)
  if (failure) {
    showLoginModal.value = true
  }
}
</script>

<template>
  <div class="banner-container">
    <div class="flex items-center h-full rounded-16px overflow-hidden box-border carousel-box">
      <n-carousel
        autoplay
        :show-arrow="false"
        :space-between="5"
        class="size-full"
      >
        <img
          v-for="(t, i) in bannerListInfo"
          :key="i"
          class="size-full object-cover cursor-pointer"
          :src="t.bannerImageUrl"
          @click="openNewTab(t.jumpUrl)"
        >
        <template #arrow="{ prev, next }">
          <button
            type="button"
            class="absolute border-none left-16px top-1/2 -translate-y-1/2 flex items-center justify-center size-48px bg-[rgba(0,0,0,0.4)] rounded-50% cursor-pointer transition transition-delay-200ms hover:bg-[rgba(0,0,0,0.6)]"
            @click="prev"
          >
            <img
              src="@/assets/icon/banner-arrow-left.svg"
              class="size-24px"
            >
          </button>
          <button
            type="button"
            class="absolute border-none right-16px top-1/2 -translate-y-1/2 flex items-center justify-center size-48px bg-[rgba(0,0,0,0.4)] rounded-50% cursor-pointer transition transition-delay-200ms hover:bg-[rgba(0,0,0,0.6)]"
            @click="next"
          >
            <img
              src="@/assets/icon/banner-arrow-right.svg"
              class="size-24px"
            >
          </button>
        </template>
        <template #dots="{ total, currentIndex, to }">
          <ul class="custom-dots">
            <li
              v-for="index of total"
              :key="index"
              :class="{ ['is-active']: currentIndex === index - 1 }"
              @click="to(index - 1)"
            />
          </ul>
        </template>
      </n-carousel>
    </div>
    <div class="banner-right">
      <div
        class="box-border banner1 flex cursor-pointer"
        @click="link('WasteFilmRescue')"
      >
        <div class="btn">
          <img
            class="btn-img"
            src="@/assets/icon/arrow-right.png"
          >
        </div>
        <!-- <img
          class="arrows-img"
          src="@/assets/icon/arrows.png"
        > -->
        <!-- <div class="font-['Alimama_ShuHeiTi'] font-bold text-28px c-#FFF mr-8px leading-none">
          小兔精工
        </div>
        <button
          type="button"
          class="border-none flex items-center justify-center size-32px bg-[rgba(0,0,0,0.4)] rounded-50% cursor-pointer transition transition-delay-200ms hover:bg-[rgba(0,0,0,0.6)]"
        >
          <img
            src="@/assets/icon/banner-arrow-right.svg"
            class="size-16px"
          >
        </button> -->
      </div>
      <div
        class="box-border banner2 flex cursor-pointer"
        @click="link('CustomGoods')"
      >
        <div class="btn">
          <img
            class="btn-img"
            src="@/assets/icon/arrow-right.png"
          >
        </div>
        <!-- <img
          class="arrows-img"
          src="@/assets/icon/arrows.png"
        > -->
        <!-- <div class="font-['Alimama_ShuHeiTi'] font-bold text-28px c-#FFF mr-8px leading-none">
          小兔文创
        </div>
        <button
          type="button"
          class="border-none flex items-center justify-center size-32px bg-[rgba(0,0,0,0.4)] rounded-50% cursor-pointer transition transition-delay-200ms hover:bg-[rgba(0,0,0,0.6)]"
        >
          <img
            src="@/assets/icon/banner-arrow-right.svg"
            class="size-16px"
          >
        </button> -->
      </div>
    </div>
  </div>
  <div class="common-tools">
    <div class="title-box">
      <div class="title">
        常用工具
      </div>
      <div
        class="more-btn"
        @click="pushTo('/waste-film-rescue/expression-optimize-new')"
      >
        <img
          src="@/assets/icon/tools-more.svg"
          class="more-img"
        >
      </div>
    </div>
    <div class="tools-box">
      <div
        class="tool-item"
        @click="link('ExpressionOptimizeNew')"
      >
        <div class="tool-icon-box">
          <img
            src="@/assets/icon/tool1.svg"
            class="tool-img"
          >
        </div>
        <div class="tool-name">
          完美人像
        </div>
        <div class="tool-desc">
          OPEN TOOL
        </div>
      </div>
      <div
        class="tool-item"
        @click="link('MotionAdjustment')"
      >
        <div class="tool-icon-box">
          <img
            src="@/assets/icon/tool3.svg"
            class="tool-img"
          >
        </div>
        <div class="tool-name">
          动作编辑
        </div>
        <div class="tool-desc">
          OPEN TOOL
        </div>
      </div>
      <div
        class="tool-item"
        @click="link('SceneReplacement')"
      >
        <div class="tool-icon-box">
          <img
            src="@/assets/icon/tool4.svg"
            class="tool-img"
          >
        </div>
        <div class="tool-name">
          背景替换
        </div>
        <div class="tool-desc">
          OPEN TOOL
        </div>
      </div>
      <div
        class="tool-item"
        @click="link('OneClickMattingNew')"
      >
        <div class="tool-icon-box">
          <img
            src="@/assets/icon/tool5.svg"
            class="tool-img"
          >
        </div>
        <div class="tool-name">
          一键抠图
        </div>
        <div class="tool-desc">
          OPEN TOOL
        </div>
      </div>
      <div
        class="tool-item"
        @click="link('ActionReplacement')"
      >
        <div class="tool-icon-box">
          <img
            src="@/assets/icon/tool2.svg"
            class="tool-img"
          >
        </div>
        <div class="tool-name">
          动作+妆造修改
        </div>
        <div class="tool-desc">
          OPEN TOOL
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.banner1 {
  background-size: 100% 100%;
  background-image: url('@/assets/images/banner1-demo.png');
  overflow: hidden;
}

.banner2 {
  background-size: 100% 100%;
  background-image: url('@/assets/images/banner2-demo.png');
  overflow: hidden;
}

.banner3 {
  background-size: 100% 100%;
  background-image: url('@/assets/images/banner3-demo.png');
  overflow: hidden;
}

.banner4 {
  background-size: 100% 100%;
  background-image: url('@/assets/images/banner4-demo.png');
  overflow: hidden;
}

.banner5 {
  background-size: 100% 100%;
  background-image: url('@/assets/images/banner5-demo.png');
  overflow: hidden;
}

.banner6 {
  background-size: 100% 100%;
  background-image: url('@/assets/images/banner6-demo.png');
  overflow: hidden;
}

.banner7 {
  background-size: 100% 100%;
  background-image: url('@/assets/images/banner7-demo.png');
  overflow: hidden;
}
.banner-container {
  width: 100%;
  aspect-ratio: 177/50;
  display: flex;
  justify-content: space-between;
  gap: 1.5625rem;
}
.carousel-box {
  width: 74.5%;
  height: 100%;
  border-radius: 1rem;
  overflow: hidden;
}
.banner-right {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.banner1,
.banner2 {
  flex: 1;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: none;
  transform: translateY(0);
  background-position: center;
  background-size: 100% 100%;
  .btn {
    position: absolute;
    left: 7.53%;
    bottom: 13.44%;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 624.9375rem;
    background: rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(12px);
    display: flex;
    justify-content: center;
    align-items: center;
    .btn-img {
      width: 1.125rem;
      height: 1.125rem;
    }
  }
  .arrows-img {
    position: absolute;
    top: 13.44%;
    right: 7.53%;
    width: 1.125rem;
    height: 1.125rem;
  }
}
.banner1:hover,
.banner2:hover {
  transform: translateY(-0.5rem);
  box-shadow: 0 0.25rem 0.5rem -0.125rem rgba(0, 0, 0, 0.15);
  background-size: 110% 110%;
  .btn {
    background-color: #ff5500;
  }
}
.custom-dots {
  display: flex;
  margin: 0;
  padding: 0;
  position: absolute;
  bottom: 8.03%;
  left: 3.63%;
  gap: 0.5rem;
}
.custom-dots li {
  display: inline-block;
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 624.9375rem;
  background: rgba(255, 255, 255, 0.3);
  transition:
    width 0.3s,
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.custom-dots li:hover {
  background: rgba(129, 128, 126);
}

.custom-dots li.is-active {
  width: 2.5rem;
  height: 0.375rem;
  border-radius: 624.9375rem;
  background: #ff5500;
}
.common-tools {
  margin-top: 2.5625rem;
  border: 0.0625rem solid #e5e7eb;
  border-radius: 1.5rem;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);
  .title-box {
    box-sizing: border-box;
    height: 5.625rem;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-family: 'Inter', sans-serif;
      font-size: 1.25rem;
      font-weight: bold;
    }
    .more-btn {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 1px solid #e5e7eb;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      .more-img {
        width: 1.125rem;
        height: 1.125rem;
      }
    }
    .more-btn:hover {
      background: #111111;
      .more-img {
        filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
      }
    }
  }
  .tools-box {
    display: flex;
    border-top: 1px solid #e5e7eb;
    .tool-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 3rem 0;
      border-right: 1px solid #e5e7eb;
      cursor: pointer;
      .tool-icon-box {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 1rem;
        background: #f9fafb;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .tool-img {
        width: 1.5rem;
        height: 1.5rem;
        display: block;
      }
      .tool-name {
        margin: 1.25rem 0 0.25rem;
        font-family: 'Inter', sans-serif;
        font-size: 0.9375rem;
        font-weight: bold;
        line-height: 1.4063rem;
        text-align: center;
      }
      .tool-desc {
        font-family: 'Inter', sans-serif;
        font-size: 0.5625rem;
        font-weight: bold;
        line-height: 0.8438rem;
        text-align: center;
        color: #9ca3af;
      }
    }
    .tool-item:hover {
      .tool-name {
        color: #ff5500;
      }
      .tool-icon-box {
        background-color: #ff5500;
        .tool-img {
          filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
        }
      }
    }
    .tool-item:last-child {
      border: none;
    }
  }
}
</style>
