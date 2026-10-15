<script setup lang="ts">
import HelloWorld from './HelloWorld.vue'

function initState() {
  return {
    msg: 'Hello Histoire',
  }
}
</script>

<template>
  <Story title="components/HelloWorld">
    <Variant title="Default">
      <HelloWorld msg="Hello Nyare" />
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <HelloWorld :msg="state.msg" />
      </template>

      <template #controls="{ state }">
        <HstText v-model="state.msg" title="Message" />
      </template>
    </Variant>
  </Story>
</template>
