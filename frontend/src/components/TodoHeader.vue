<script setup lang="ts">
import HamburgerMenu from '@/components/HamburgerMenu.vue'
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b-[3px] border-(--color-app-border) bg-(--color-app-bg) px-4"
  >
    <HamburgerMenu />

    <h1 class="text-xl font-bold tracking-tight text-(--color-text-main)">To-do</h1>

    <div class="h-11 w-11" aria-hidden="true" />
  </header>
</template>
