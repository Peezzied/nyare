<script lang="ts" setup>
import type { DrawerContentEmits, DrawerContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'
import { onMounted } from 'vue'
import {
  DrawerContent,
  DrawerHandle,
  DrawerPortal,
  injectDrawerRootContext,
  useForwardPropsEmits,
} from 'reka-ui'
import DrawerOverlay from './DrawerOverlay.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    DrawerContentProps & {
      class?: HTMLAttributes['class']
      portal?: boolean
      fullView?: boolean
      overlay?: boolean
    }
  >(),
  {
    portal: true,
    fullView: false,
    overlay: false,
  },
)
const emits = defineEmits<
  DrawerContentEmits & {
    'click:handle': []
  }
>()

const delegatedProps = reactiveOmit(props, 'class', 'portal', 'fullView', 'overlay')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// DrawerRoot starts popupHeight at 0, which collapses every snap point to
// offset 0 until ResizeObserver reports the real height. Seeding it at mount
// keeps the first snap change animating instead of jumping.
const drawerRootContext = injectDrawerRootContext(null)
onMounted(() => {
  if (!drawerRootContext || drawerRootContext.popupHeight.value > 0) return
  const el = document.getElementById(drawerRootContext.contentId)
  if (el) drawerRootContext.onPopupHeightChange(el.offsetHeight)
})

let pointerDownPos: { x: number; y: number; time: number } | null = null
let handledByPointer = false

function onHandlePointerDown(e: PointerEvent) {
  pointerDownPos = { x: e.clientX, y: e.clientY, time: Date.now() }
}

function onContentPointerUp(e: PointerEvent) {
  if (!pointerDownPos) return
  const dx = Math.abs(e.clientX - pointerDownPos.x)
  const dy = Math.abs(e.clientY - pointerDownPos.y)
  const dt = Date.now() - pointerDownPos.time
  pointerDownPos = null

  if (dx < 6 && dy < 6 && dt < 500) {
    handledByPointer = true
    emits('click:handle')
    setTimeout(() => {
      handledByPointer = false
    }, 100)
  }
}

function onHandleClick() {
  if (handledByPointer) {
    handledByPointer = false
    return
  }
  emits('click:handle')
}
</script>

<template>
  <DrawerPortal :disabled="!props.portal">
    <DrawerOverlay v-if="props.overlay" />
    <DrawerContent
      data-slot="drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      @pointerup="onContentPointerUp"
      :style="{
        transform:
          'translate3d(var(--drawer-swipe-movement-x, 0px), clamp(0px, calc(var(--drawer-swipe-movement-y, 0px) + var(--drawer-snap-point-offset, 0px)), calc(100dvh - 210px)), 0)',
      }"
      :class="
        cn(
          'group/drawer-content fixed z-50 flex flex-col bg-[#FDFEF7] border-[#C2E8F1] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:mb-24 data-[swipe-direction=up]:max-h-[80vh] data-[swipe-direction=up]:rounded-b-lg data-[swipe-direction=up]:data-[state=open]:slide-in-from-top data-[swipe-direction=up]:data-[state=closed]:slide-out-to-top',
          'data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:h-[100dvh] sm:data-[swipe-direction=down]:max-w-[440px] sm:data-[swipe-direction=down]:mx-auto',
          props.fullView
            ? 'data-[swipe-direction=down]:rounded-none data-[swipe-direction=down]:border-t-0'
            : 'data-[swipe-direction=down]:rounded-t-[28px] data-[swipe-direction=down]:border-t',
          'data-[swipe-direction=down]:data-[state=open]:slide-in-from-bottom data-[swipe-direction=down]:data-[state=closed]:slide-out-to-bottom',
          'data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:sm:max-w-sm data-[swipe-direction=right]:data-[state=open]:slide-in-from-right data-[swipe-direction=right]:data-[state=closed]:slide-out-to-right',
          'data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:sm:max-w-sm data-[swipe-direction=left]:data-[state=open]:slide-in-from-left data-[swipe-direction=left]:data-[state=closed]:slide-out-to-left',
          props.class,
        )
      "
    >
      <div
        data-testid="drag-bar-trigger"
        tabindex="0"
        aria-label="Toggle bottom sheet stage"
        class="w-full flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none group-data-[swipe-direction=down]/drawer-content:flex"
        @pointerdown="onHandlePointerDown"
        @click="onHandleClick"
        @keydown.enter.space.prevent="onHandleClick"
      >
        <DrawerHandle
          class="bg-[#CBD5E1] mx-auto h-1.5 w-12 shrink-0 rounded-full cursor-grab active:cursor-grabbing hover:bg-[#94A3B8] transition-colors pointer-events-none"
        />
      </div>
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
