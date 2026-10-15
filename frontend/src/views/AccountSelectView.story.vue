<script setup lang="ts">
import AccountSelectView from './AccountSelectView.vue'
import { initMockAdapter } from '@/api/mocks/adapter'

// Ensure mock adapter is initialized so stories fetch dummy student accounts
initMockAdapter()
</script>

<template>
  <Story title="views/AccountSelectView">
    <Variant title="Populated Accounts">
      <div class="h-screen bg-[#F6F7EE] overflow-y-auto">
        <AccountSelectView />
      </div>
    </Variant>

    <Variant title="Mobile Viewport (390px)">
      <div class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 bg-[#F6F7EE] shadow-lg">
        <AccountSelectView />
      </div>
    </Variant>
  </Story>
</template>
