<script setup lang="ts">
// Shared onboarding chrome: the 420px app column on the app-bg canvas, with
// optional sun, cloud, and wave props. `page` switches to the two-layer
// chrome (full-bleed canvas plus a centred main column) used by the account
// screens. Extra classes land on the content column.
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    showSun?: boolean
    showCloud?: boolean
    showWave?: boolean
    page?: boolean
  }>(),
  {
    showSun: false,
    showCloud: false,
    showWave: false,
    page: false,
  },
)
</script>

<template>
  <div
    v-if="page"
    class="relative min-h-dvh w-full overflow-x-hidden bg-app-bg font-sans text-text-main select-none"
  >
    <main
      class="relative z-10 mx-auto flex h-[100dvh] max-w-[420px] flex-col justify-between px-5 pb-8"
      v-bind="$attrs"
    >
      <slot />
    </main>
  </div>

  <div
    v-else
    class="relative mx-auto flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-app-bg"
    v-bind="$attrs"
  >
    <img
      v-if="showSun"
      src="@/assets/props/sun.svg"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute -top-12 -right-14 z-0 w-52 select-none sm:w-56"
    />
    <img
      v-if="showCloud"
      src="@/assets/props/double_cloud.svg"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute left-[6%] top-[9%] z-0 w-32 select-none sm:w-36"
    />
    <slot />
    <img
      v-if="showWave"
      src="@/assets/props/wave_1.svg"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-[16%] -left-[12%] z-0 w-[124%] max-w-none select-none"
    />
  </div>
</template>
