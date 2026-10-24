<script setup lang="ts">
import {
  CheckboxIndicator,
  CheckboxRoot,
  useForwardPropsEmits,
  type CheckboxRootEmits,
  type CheckboxRootProps,
} from 'reka-ui'
import { Check } from '@lucide/vue'

defineOptions({
  name: 'UiCheckbox',
})

const props = defineProps<CheckboxRootProps & { class?: string }>()
const emits = defineEmits<CheckboxRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="[
      'peer flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border-2 border-primary bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-white',
      props.class,
    ]"
  >
    <CheckboxIndicator class="flex items-center justify-center text-white">
      <slot>
        <Check class="h-4 w-4 stroke-[3]" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
