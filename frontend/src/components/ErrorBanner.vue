<script setup lang="ts">
// Error strip for page-level failures. The default mode is an in-flow bar;
// `floating` renders the centred pill that hovers above content.
withDefaults(
  defineProps<{
    message: string
    title?: string
    /** Renders the white action pill; emits `action` on click. */
    actionLabel?: string
    floating?: boolean
  }>(),
  {
    title: undefined,
    actionLabel: undefined,
    floating: false,
  },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <p
    v-if="floating"
    role="alert"
    class="absolute bottom-20 left-1/2 z-sheet w-max max-w-[80%] -translate-x-1/2 rounded-xl bg-destructive px-4 py-2 text-center text-sm font-bold text-white shadow-lg"
  >
    <template v-if="title">{{ title }} </template>{{ message }}
  </p>
  <div
    v-else
    role="alert"
    class="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white"
  >
    <span><template v-if="title">{{ title }} </template>{{ message }}</span>
    <button
      v-if="actionLabel"
      type="button"
      class="rounded-lg bg-white/20 px-3 py-1"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
