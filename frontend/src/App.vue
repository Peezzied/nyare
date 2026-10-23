<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastShelf from '@/components/ToastShelf.vue'
import RouteWipeOverlay from '@/components/RouteWipeOverlay.vue'
</script>

<template>
  <RouterView />
  <ToastShelf />
  <RouteWipeOverlay />
</template>
