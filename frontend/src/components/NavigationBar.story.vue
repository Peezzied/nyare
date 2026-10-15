<script setup lang="ts">
import { ref } from 'vue'
import NavigationBar from './NavigationBar.vue'

const activeTab = ref('calendar')
</script>

<template>
  <Story title="components/NavigationBar">
    <Variant title="Default">
      <div class="relative h-64 bg-slate-50 flex flex-col justify-between overflow-hidden">
        <div class="p-6">
          <h3 class="text-sm font-semibold text-slate-800">
            Interactive Navigation Bar
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            Active tab: {{ activeTab }}
          </p>
        </div>

        <NavigationBar v-model="activeTab" />
      </div>
    </Variant>

    <Variant title="Active States">
      <div class="p-6 space-y-8 bg-slate-50">
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Resting State (Calendar Active, Tasks and Notes Resting)
          </h4>
          <div class="relative h-24 bg-nav-bg rounded-lg border border-slate-200 overflow-hidden">
            <NavigationBar model-value="calendar" />
          </div>
        </div>

        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Lifted Duolingo State Comparison
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="relative h-24 bg-nav-bg rounded-lg border border-slate-200 overflow-hidden">
              <span class="absolute top-2 left-3 text-[10px] font-medium text-slate-400">
                Tasks Lifted
              </span>
              <NavigationBar model-value="tasks" />
            </div>
            <div class="relative h-24 bg-nav-bg rounded-lg border border-slate-200 overflow-hidden">
              <span class="absolute top-2 left-3 text-[10px] font-medium text-slate-400">
                Notes Lifted
              </span>
              <NavigationBar model-value="notes" />
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            With Labels Displayed
          </h4>
          <div class="relative h-24 bg-nav-bg rounded-lg border border-slate-200 overflow-hidden">
            <NavigationBar model-value="calendar" :show-labels="true" />
          </div>
        </div>
      </div>
    </Variant>

    <Variant title="Mobile Frame">
      <div class="flex justify-center p-6 bg-slate-100">
        <div
          class="relative w-[390px] h-[680px] bg-slate-50 rounded-[40px] border-[8px] border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          <!-- Dynamic Island / Speaker notch simulation -->
          <div class="absolute top-3 inset-x-0 flex justify-center z-50 pointer-events-none">
            <div class="w-28 h-6 bg-slate-800 rounded-full" />
          </div>

          <!-- Screen Content -->
          <div class="pt-14 px-5 pb-24 overflow-y-auto space-y-4">
            <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
              <h2 class="text-base font-bold text-slate-900 font-['Quicksand']">
                Academic Schedule
              </h2>
              <p class="text-xs text-slate-500 mt-1">
                Fixed bottom docking and safe area clearance check.
              </p>
            </div>

            <div class="space-y-2">
              <div
                v-for="i in 5"
                :key="i"
                class="h-16 bg-white rounded-xl border border-slate-200/80 p-3 flex items-center gap-3"
              >
                <div class="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 text-xs font-bold">
                  0{{ i }}
                </div>
                <div class="flex-1">
                  <div class="h-3 w-3/4 bg-slate-200 rounded-sm mb-2" />
                  <div class="h-2 w-1/2 bg-slate-100 rounded-sm" />
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Safe Area & Docked Bar -->
          <NavigationBar model-value="calendar" />
        </div>
      </div>
    </Variant>
  </Story>
</template>
