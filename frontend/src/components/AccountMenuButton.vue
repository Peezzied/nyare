<script setup lang="ts">
// Default AppHeader left action: burger button opening the account menu.
import { Menu } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import HeaderIconButton from './HeaderIconButton.vue'

const router = useRouter()

function goToSelectAccount(): void {
  router.push('/select-account')
}
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <HeaderIconButton aria-label="Open menu" data-testid="topbar-menu">
        <Menu class="h-6 w-6" />
      </HeaderIconButton>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        side="bottom"
        align="start"
        :side-offset="8"
        aria-label="Menu"
        data-testid="account-menu"
        class="z-30 w-44 rounded-2xl border border-app-border bg-card px-4 py-3 shadow-lg"
      >
        <button
          type="button"
          data-testid="select-account-item"
          class="w-full text-start text-base font-semibold text-text-main"
          @click="goToSelectAccount"
        >
          Select Account
        </button>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
