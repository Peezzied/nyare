<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'

const router = useRouter()

function goToSelectAccount(): void {
  router.push('/select-account')
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b-[3px] border-(--color-app-border) bg-(--color-app-bg) px-4"
  >
    <PopoverRoot>
      <PopoverTrigger as-child>
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-lg text-(--color-text-main) transition-colors hover:bg-black/5 active:bg-black/10"
          aria-label="Open menu"
        >
          <Menu class="h-6 w-6" />
        </button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          side="bottom"
          align="start"
          :side-offset="8"
          aria-label="Menu"
          class="z-30 w-44 rounded-2xl border border-(--color-app-border) bg-(--color-card) px-4 py-3 shadow-lg"
        >
          <button
            type="button"
            data-testid="select-account-item"
            class="w-full text-start text-base font-semibold text-(--color-text-main)"
            @click="goToSelectAccount"
          >
            Select Account
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <h1 class="text-xl font-bold tracking-tight text-(--color-text-main)">To-do</h1>

    <div class="h-11 w-11" aria-hidden="true" />
  </header>
</template>
