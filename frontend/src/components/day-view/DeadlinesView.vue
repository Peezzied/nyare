<script setup lang="ts">
// Deadlines mode of the calendar home: every academic event as one
// chronological list, upcoming days first, past days collapsed below.
import { computed } from 'vue'
import { ChevronRight } from '@lucide/vue'
import type { AcademicEventResponse } from '@/types/api'
import type { DeadlineDaySection, DeadlineSections } from '@/utils/deadlineSections'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import duckotaCasual from '@/assets/mascot/duckota_casual.png'
import DeadlineRow from './DeadlineRow.vue'

const props = defineProps<{
  sections: DeadlineSections
  courseName: (courseId: number) => string
}>()

const emit = defineEmits<{
  (e: 'select', event: AcademicEventResponse, originRect: DOMRect): void
  (e: 'select-day', date: Date): void
}>()

const pastCount = computed(() =>
  props.sections.past.reduce((total, day) => total + day.rows.length, 0),
)

const hasContent = computed(() => props.sections.upcoming.length > 0 || pastCount.value > 0)

function handleSelect(event: AcademicEventResponse, originRect: DOMRect) {
  emit('select', event, originRect)
}
</script>

<template>
  <div class="h-full overflow-y-auto px-4 pb-24" data-testid="deadlines-view">
    <template v-if="hasContent">
      <p v-if="sections.upcoming.length === 0" class="py-6 text-center text-(--color-text-muted)">
        No upcoming deadlines.
      </p>
      <section v-for="day in sections.upcoming" :key="day.dateKey" class="mt-4 first:mt-6">
        <button
          type="button"
          class="flex h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm font-bold text-(--color-text-muted) transition-colors hover:bg-black/5"
          :aria-label="`Show ${day.label} in day view`"
          @click="emit('select-day', day.date)"
        >
          <span>{{ day.label }}</span>
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </button>
        <ul class="flex flex-col gap-2">
          <li v-for="row in day.rows" :key="row.event.id">
            <DeadlineRow
              :row="row"
              :course-name="courseName(row.event.courseId)"
              @select="(rect) => handleSelect(row.event, rect)"
            />
          </li>
        </ul>
      </section>

      <Accordion v-if="pastCount > 0" type="single" collapsible class="mt-8">
        <AccordionItem value="past" class="border-b-0">
          <AccordionTrigger
            class="px-2 py-3 text-sm font-bold text-(--color-text-muted) hover:no-underline"
          >
            Past · {{ pastCount }}
          </AccordionTrigger>
          <AccordionContent class="p-0">
            <section v-for="day in sections.past" :key="day.dateKey" class="mt-2 first:mt-0">
              <button
                type="button"
                class="flex h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm font-bold text-(--color-text-muted) transition-colors hover:bg-black/5"
                :aria-label="`Show ${day.label} in day view`"
                @click="emit('select-day', day.date)"
              >
                <span>{{ day.label }}</span>
                <ChevronRight class="h-4 w-4" aria-hidden="true" />
              </button>
              <ul class="flex flex-col gap-2">
                <li v-for="row in day.rows" :key="row.event.id">
                  <DeadlineRow
                    past
                    :row="row"
                    :course-name="courseName(row.event.courseId)"
                    @select="(rect) => handleSelect(row.event, rect)"
                  />
                </li>
              </ul>
            </section>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </template>

    <div v-else class="flex h-full flex-col items-center justify-center gap-3 pb-16">
      <img :src="duckotaCasual" alt="" class="h-28 w-28 object-contain" />
      <p class="text-lg font-bold text-text-main">No deadlines ahead</p>
      <p class="text-sm text-(--color-text-muted)">
        Events from your notes and courses appear here.
      </p>
    </div>
  </div>
</template>
