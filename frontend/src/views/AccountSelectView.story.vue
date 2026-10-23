<script setup lang="ts">
import { defineComponent, h, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import AccountSelectView from './AccountSelectView.vue'
import RouteWipeOverlay from '@/components/RouteWipeOverlay.vue'
import { initMockAdapter } from '@/api/mocks/adapter'

// Ensure mock adapter is initialized so stories fetch dummy student accounts
initMockAdapter()

// The login wipe reveals the next route, so the demo routes the picker itself
// and lets the app's `/` destination land on the setup router's Home stub.
const router = useRouter()
if (router) {
  router.addRoute({ path: '/select-account', component: AccountSelectView })
  void router.replace('/select-account')
}

const WipeDemo = defineComponent({
  setup: () => {
    // Re-arm the demo on every remount so the variant can be replayed.
    onMounted(() => void router?.replace('/select-account'))
    return () => [h(RouterView), h(RouteWipeOverlay)]
  },
})
</script>

<template>
  <Story title="views/AccountSelectView">
    <Variant title="Populated Accounts">
      <div class="h-screen bg-[#F6F7EE] overflow-y-auto">
        <AccountSelectView />
        <RouteWipeOverlay />
      </div>
    </Variant>

    <Variant title="Mobile Viewport (390px)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 bg-[#F6F7EE] shadow-lg"
      >
        <AccountSelectView />
        <RouteWipeOverlay />
      </div>
    </Variant>

    <Variant title="Login (portal wipe)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 bg-[#F6F7EE] shadow-lg"
      >
        <WipeDemo />
      </div>
    </Variant>
  </Story>
</template>
