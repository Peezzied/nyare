<script setup lang="ts">
import { Search } from '@lucide/vue'
import AppHeader from './AppHeader.vue'
import HeaderIconButton from './HeaderIconButton.vue'
</script>

<template>
  <Story title="components/AppHeader">
    <Variant title="Default">
      <AppHeader title="Notes" />
    </Variant>

    <Variant title="Custom right action">
      <AppHeader title="Notes">
        <template #right>
          <HeaderIconButton aria-label="Search">
            <Search class="h-6 w-6" />
          </HeaderIconButton>
        </template>
      </AppHeader>
    </Variant>
  </Story>
</template>
