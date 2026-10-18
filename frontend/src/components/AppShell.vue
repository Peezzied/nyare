<script setup lang="ts">
// Logged-in scaffold: top bar, routed view, bottom nav, Duckota FAB.
// Views set the header title and side actions through useShellHeader.
import { computed, ref, toValue } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import DuckotaFab from './DuckotaFab.vue'
import NavigationBar from './NavigationBar.vue'
import { provideShellHeader } from '@/composables/useShellHeader'

const header = provideShellHeader()
const title = computed(() => toValue(header.title ?? ''))
</script>

<template>
  <!-- fixed inset-0 = always exactly the visible screen -->
  <div class="fixed inset-0 flex flex-col overflow-hidden bg-app-bg">
    <AppHeader :title="title">
      <template v-if="header.left" #left>
        <component :is="header.left" />
      </template>
      <template v-if="header.right" #right>
        <component :is="header.right" />
      </template>
    </AppHeader>

    <main class="relative min-h-0 flex-1">
      <RouterView />
      <DuckotaFab class="!absolute bottom-4 left-5 z-10" />
    </main>



    <!-- the h-16 reserve keeps the view clear of the fixed bar -->
    <div class="h-16 shrink-0">
      <NavigationBar />
    </div>
  </div>
</template>
