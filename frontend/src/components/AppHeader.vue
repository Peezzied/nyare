<script setup lang="ts">
// Shared top bar chrome for the logged-in shell: h-14 bar with a 3px bottom
// border, left action, centered title, right action.
// Slots: `left` defaults to the account menu, `right` defaults to a 44px
// spacer so the title stays optically centered.
import { ref } from 'vue'
import AccountMenuButton from './AccountMenuButton.vue'
import { useTopBarInset } from '@/composables/useTopBarInset'

defineProps<{
  title: string
}>()

const headerEl = ref<HTMLElement | null>(null)
useTopBarInset(headerEl)
</script>

<template>
  <header
    ref="headerEl"
    data-testid="app-header"
    class="flex h-14 w-full shrink-0 items-center justify-between border-b-[3px] border-app-border bg-nav-bg px-1"
  >
    <slot name="left">
      <AccountMenuButton />
    </slot>

    <slot name="center">
      <h1
        class="text-xl font-bold tracking-tight text-text-main truncate"
        data-testid="app-header-title"
      >
        {{ title }}
      </h1>
    </slot>

    <slot name="right">
      <div class="h-11 w-11" aria-hidden="true" />
    </slot>
  </header>
</template>
