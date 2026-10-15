<script setup lang="ts">
import DuckotaButton from './DuckotaButton.vue'
import mockupImg from '@/assets/mascot/duckota_button.png'

function initState() {
  return {
    size: 'md' as 'sm' | 'md' | 'lg',
    variant: 'tactile' as 'tactile' | 'floating' | 'plain',
    label: 'Duckota',
    badge: '3',
    badgeColor: 'destructive' as 'destructive' | 'primary' | 'warning',
    processing: false,
    disabled: false,
  }
}
</script>

<template>
  <Story title="components/DuckotaButton">
    <Variant title="Default">
      <div class="flex items-center justify-center p-8">
        <DuckotaButton />
      </div>
    </Variant>

    <Variant title="Tactile 3D">
      <div class="flex flex-col items-center gap-4 p-8">
        <DuckotaButton variant="tactile" label="Tactile 3D Button" />
        <p class="text-xs text-slate-500">
          Tactile 3D press effect with physical bottom shadow
        </p>
      </div>
    </Variant>

    <Variant title="Sizes">
      <div class="flex items-end justify-center gap-6 p-8">
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton size="sm" />
          <span class="text-xs text-slate-500">sm (44px)</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton size="md" />
          <span class="text-xs text-slate-500">md (56px)</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton size="lg" />
          <span class="text-xs text-slate-500">lg (80px)</span>
        </div>
      </div>
    </Variant>

    <Variant title="Variants">
      <div class="flex items-center justify-center gap-8 p-8">
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton variant="tactile" />
          <span class="text-xs text-slate-500">tactile</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton variant="floating" />
          <span class="text-xs text-slate-500">floating</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton variant="plain" />
          <span class="text-xs text-slate-500">plain</span>
        </div>
      </div>
    </Variant>

    <Variant title="Badges">
      <div class="flex items-center justify-center gap-8 p-8">
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton :badge="3" badge-color="destructive" />
          <span class="text-xs text-slate-500">Dirty notes (3)</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton :badge="12" badge-color="primary" />
          <span class="text-xs text-slate-500">Pending tasks (12)</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <DuckotaButton badge="!" badge-color="warning" />
          <span class="text-xs text-slate-500">Alert dot (!)</span>
        </div>
      </div>
    </Variant>

    <Variant title="AI Processing (Dancing Gradient)">
      <div class="flex flex-col items-center gap-6 p-8">
        <div class="flex items-end justify-center gap-8">
          <div class="flex flex-col items-center gap-2">
            <DuckotaButton size="sm" processing />
            <span class="text-xs text-slate-500">sm (44px)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <DuckotaButton size="md" processing />
            <span class="text-xs text-slate-500">md (56px)</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <DuckotaButton size="lg" processing />
            <span class="text-xs text-slate-500">lg (80px)</span>
          </div>
        </div>
        <p class="text-xs text-slate-500">
          Dancing rainbow stroke gradient fetched from palette.ts with ambient glow
        </p>
      </div>
    </Variant>

    <Variant title="Artwork Comparison">
      <div class="flex flex-col items-center gap-6 p-8">
        <div class="flex items-center justify-center gap-10">
          <div class="flex flex-col items-center gap-2">
            <DuckotaButton size="lg" />
            <span class="text-xs font-semibold text-slate-600">Materialized Element</span>
            <span class="text-[11px] text-slate-400">Interactive CSS button</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <img :src="mockupImg" alt="Static Mockup" class="size-20 object-contain" />
            <span class="text-xs font-semibold text-slate-600">Original Artwork</span>
            <span class="text-[11px] text-slate-400">duckota_button.png</span>
          </div>
        </div>
        <p class="text-xs text-slate-500">
          Side-by-side comparison of materialized button vs original concept illustration
        </p>
      </div>
    </Variant>

    <Variant title="Disabled">
      <div class="flex items-center justify-center p-8">
        <DuckotaButton disabled />
      </div>
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <div class="flex items-center justify-center p-8">
          <DuckotaButton
            :size="state.size"
            :variant="state.variant"
            :label="state.label"
            :badge="state.badge"
            :badge-color="state.badgeColor"
            :processing="state.processing"
            :disabled="state.disabled"
          />
        </div>
      </template>

      <template #controls="{ state }">
        <HstSelect
          v-model="state.size"
          title="Size"
          :options="['sm', 'md', 'lg']"
        />
        <HstSelect
          v-model="state.variant"
          title="Variant"
          :options="['tactile', 'floating', 'plain']"
        />
        <HstText v-model="state.label" title="Label" />
        <HstText v-model="state.badge" title="Badge" />
        <HstSelect
          v-model="state.badgeColor"
          title="Badge Color"
          :options="['destructive', 'primary', 'warning']"
        />
        <HstCheckbox v-model="state.processing" title="Processing" />
        <HstCheckbox v-model="state.disabled" title="Disabled" />
      </template>
    </Variant>
  </Story>
</template>
