<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { ClipboardList, Calendar, PenSquare } from 'lucide-vue-next'

const route = useRoute()
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-20 mx-auto flex h-16 w-full max-w-[390px] items-center justify-around border-t border-[var(--color-app-border)] bg-white pb-[env(safe-area-inset-bottom)]"
    aria-label="Bottom navigation"
  >
    <RouterLink
      to="/"
      class="flex h-11 w-11 flex-col items-center justify-center transition-colors"
      :class="route.path === '/' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'"
      aria-label="To-Do"
    >
      <ClipboardList class="h-6 w-6" />
      <span class="sr-only">To-Do</span>
    </RouterLink>

    <RouterLink
      to="/calendar"
      class="flex h-11 w-11 flex-col items-center justify-center transition-colors"
      :class="
        route.path === '/calendar'
          ? 'text-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)]'
      "
      aria-label="Calendar"
    >
      <Calendar class="h-6 w-6" />
      <span class="sr-only">Calendar</span>
    </RouterLink>

    <RouterLink
      to="/notes"
      class="flex h-11 w-11 flex-col items-center justify-center transition-colors"
      :class="
        route.path === '/notes' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
      "
      aria-label="Notes"
    >
      <PenSquare class="h-6 w-6" />
      <span class="sr-only">Notes</span>
    </RouterLink>
  </nav>
</template>
