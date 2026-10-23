<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import TactileButton from '@/components/TactileButton.vue'
import { useOnboarding } from '@/composables/useOnboarding'
import { useAuth } from '@/composables/useAuth'
import { useRouteWipe } from '@/composables/useRouteWipe'
import { COURSE_PALETTE_24 } from '@/constants/palette'

const props = withDefaults(defineProps<{ initialRevealed?: boolean }>(), {
  initialRevealed: false,
})

const { studentName, savedSummary } = useOnboarding()
const { wipeTo } = useRouteWipe()
const { user } = useAuth()

const displayName = computed(() => studentName.value.trim() || user.value?.username || '')
const summary = computed(
  () =>
    savedSummary.value ?? { courses: [] as { name: string; colorId: string }[], classBlocks: 0 },
)

function paletteFor(colorId: string) {
  return COURSE_PALETTE_24.find((color) => color.id === colorId) ?? COURSE_PALETTE_24[0]!
}

// Curtain Reveal: the celebration is mounted underneath from the start; the
// recap slip is the only layer on stage until it peels away.
const revealed = ref(props.initialRevealed)
const slipGone = ref(props.initialRevealed)
const ctaRef = useTemplateRef<InstanceType<typeof TactileButton>>('cta')

function reveal() {
  revealed.value = true
  // The slip needs its full lift before it leaves the a11y tree; reduced-motion
  // collapses the transition to ~0ms so the timeout stays a safe fallback.
  window.setTimeout(() => {
    slipGone.value = true
    const ctaEl = (ctaRef.value as { $el?: HTMLElement } | null)?.$el
    ctaEl?.focus()
  }, 900)
}

// The CTA is the portal: a cyan disc grows from the press point until it
// swallows the screen, then a matching hole opens at the same point to
// reveal the calendar.
function enterCalendar(event: MouseEvent) {
  // Keyboard and assistive clicks carry 0,0 coordinates; aim at the CTA center.
  const rect = (ctaRef.value as { $el?: HTMLElement } | null)?.$el?.getBoundingClientRect()
  const x = event.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2)
  const y = event.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2)
  void wipeTo('/calendar', { x, y })
}

const CONFETTI = [
  { top: '16%', left: '10%', color: '#00A4C8', tilt: '20deg', delay: 0 },
  { top: '12%', left: '32%', color: '#F6BF26', tilt: '-30deg', delay: 80 },
  { top: '20%', left: '62%', color: '#F4511E', tilt: '45deg', delay: 140 },
  { top: '14%', left: '84%', color: '#33B679', tilt: '10deg', delay: 60 },
  { top: '26%', left: '18%', color: '#8E24AA', tilt: '-15deg', delay: 180 },
  { top: '24%', left: '74%', color: '#FBC02D', tilt: '32deg', delay: 110 },
  { top: '30%', left: '46%', color: '#E67C73', tilt: '-40deg', delay: 200 },
  { top: '10%', left: '52%', color: '#1E88E5', tilt: '24deg', delay: 40 },
] as const
</script>

<template>
  <div
    class="relative mx-auto flex h-[100svh] w-full max-w-[420px] flex-col overflow-hidden bg-[#F6F7EE] px-6"
  >
    <!-- Celebration scene: underneath the slip from the first frame -->
    <div :inert="!revealed" :aria-hidden="!revealed" class="absolute inset-0">
      <img
        src="@/assets/props/sun.svg"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute -top-12 -right-14 w-52 select-none sm:w-56"
      />
      <img
        src="@/assets/props/double_cloud.svg"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute left-[4%] top-[7%] w-32 select-none sm:w-36"
      />

      <span
        v-for="piece in CONFETTI"
        :key="`${piece.top}-${piece.left}`"
        class="confetti-piece"
        :class="revealed ? 'confetti-burst' : 'pre-hidden'"
        :style="{
          top: piece.top,
          left: piece.left,
          backgroundColor: piece.color,
          '--tilt': piece.tilt,
          animationDelay: `${950 + piece.delay}ms`,
        }"
        aria-hidden="true"
      />

      <h1
        class="absolute inset-x-0 top-[24%] text-center font-logo text-6xl font-semibold text-[#00A4C8]"
        :class="revealed ? 'pop-in' : 'pre-hidden'"
        style="animation-delay: 1000ms"
      >
        You did it!
      </h1>
      <p
        class="absolute inset-x-0 top-[33%] text-center text-lg font-bold text-[#527A8C]"
        :class="revealed ? 'pop-in' : 'pre-hidden'"
        style="font-family: 'Quicksand', sans-serif; animation-delay: 1100ms"
      >
        {{ displayName ? `your week is set, ${displayName}` : 'your week is set' }}
      </p>

      <img
        src="@/assets/mascot/duckuta_greet.png"
        alt="Duckota the seagull cheering"
        class="pointer-events-none absolute left-1/2 top-[42%] w-56 -translate-x-1/2 select-none"
        :class="revealed ? 'duckota-cheer' : 'pre-hidden'"
      />

      <img
        src="@/assets/props/star_fish.png"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute right-8 top-[46%] w-12 select-none"
        :class="revealed ? 'prop-in' : 'pre-hidden'"
        style="animation-delay: 1250ms"
      />
      <img
        src="@/assets/props/shell.png"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute left-8 bottom-[22%] w-10 select-none"
        :class="revealed ? 'prop-in' : 'pre-hidden'"
        style="animation-delay: 1350ms"
      />

      <img
        src="@/assets/props/wave_1.svg"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-[16%] -left-[12%] w-[124%] max-w-none select-none"
      />

      <!-- The brightest point on the stage is the way in -->
      <div class="absolute inset-x-0 bottom-[9%] z-20 px-6">
        <div :class="revealed ? 'cta-glow' : 'pre-hidden'" style="animation-delay: 1500ms">
          <TactileButton
            ref="cta"
            aria-label="Go to your calendar"
            class="w-full"
            @click="enterCalendar"
          >
            <span style="font-family: 'Quicksand', sans-serif; font-weight: 700 !important">
              GO TO CALENDAR
            </span>
          </TactileButton>
        </div>
      </div>
    </div>

    <!-- Recap slip: the paper on stage, lifted away on continue -->
    <section
      v-show="!slipGone"
      :inert="revealed"
      :aria-hidden="revealed"
      aria-label="Saved schedule summary"
      class="slip absolute left-1/2 top-[16%] z-30 w-[86%] max-w-[340px] -translate-x-1/2 rounded-2xl border border-[#D5EBF1] bg-[#FDFEF7] p-5 pt-7 shadow-[0_10px_0_rgba(0,123,153,0.12),0_24px_44px_rgba(51,65,85,0.16)]"
      :class="{ 'slip-away': revealed }"
    >
      <div
        class="absolute -top-3.5 left-1/2 -translate-x-1/2 rotate-2 rounded-lg bg-[#00A4C8] px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white shadow-[0_3px_0_#007B99]"
        style="font-family: 'Quicksand', sans-serif"
      >
        SAVED
      </div>

      <h2
        class="slip-line font-logo text-3xl font-semibold text-[#007B99]"
        style="animation-delay: 200ms"
      >
        All set{{ displayName ? `, ${displayName}` : '' }}!
      </h2>

      <dl class="mt-4">
        <div
          class="slip-line flex items-center justify-between border-t border-dashed border-[#D5EBF1] py-2.5"
          style="animation-delay: 420ms"
        >
          <dt class="text-sm font-semibold text-[#334155]">Courses pinned</dt>
          <dd class="text-base font-bold text-[#00A4C8]">{{ summary.courses.length }}</dd>
        </div>
        <div
          class="slip-line flex items-center justify-between border-t border-dashed border-[#D5EBF1] py-2.5"
          style="animation-delay: 620ms"
        >
          <dt class="text-sm font-semibold text-[#334155]">Class blocks</dt>
          <dd class="text-base font-bold text-[#00A4C8]">{{ summary.classBlocks }}</dd>
        </div>
      </dl>

      <ul
        v-if="summary.courses.length > 0"
        class="slip-line mt-3 flex flex-wrap gap-1.5"
        style="animation-delay: 800ms"
        aria-label="Saved courses"
      >
        <li
          v-for="course in summary.courses"
          :key="course.name"
          class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold"
          :style="{
            backgroundColor: paletteFor(course.colorId).bg,
            borderColor: paletteFor(course.colorId).border,
            color: paletteFor(course.colorId).text,
            fontFamily: 'Quicksand, sans-serif',
          }"
        >
          <span
            class="h-2 w-2 rounded-full"
            :style="{ backgroundColor: paletteFor(course.colorId).solid }"
            aria-hidden="true"
          />
          {{ course.name }}
        </li>
      </ul>

      <button
        type="button"
        data-testid="reveal-celebration"
        class="slip-line mt-5 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#BCE3ED] bg-[#E8F6FA] text-sm font-bold text-[#007B99] shadow-[0_3px_0_#B0DBE5] transition-all hover:bg-[#DCF1F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:translate-y-0.5 active:shadow-[0_1px_0_#B0DBE5]"
        style="font-family: 'Quicksand', sans-serif; animation-delay: 950ms"
        @click="reveal"
      >
        CONTINUE
      </button>
    </section>
  </div>
</template>

<style scoped>
/* Celebration pieces stay hidden until the slip lifts; reduced-motion users
   never get the animation classes' from-frames, so the base state is visible. */
.pre-hidden {
  opacity: 0;
}

/* Slip lines print in one at a time. */
.slip-line {
  animation: slip-print 400ms ease-out both;
}

@keyframes slip-print {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* The peel: tip, then lift off-stage like paper snatched upward. */
.slip {
  transform-origin: 50% -20%;
  transition:
    transform 800ms cubic-bezier(0.5, 0, 0.9, 0.4),
    opacity 500ms ease-in 350ms;
}

/* `-translate-x-1/2` rides the `translate` property, so this transform only
   lifts and tips — never re-centers. */
.slip-away {
  transform: translateY(-135%) rotate(-14deg);
  opacity: 0;
  pointer-events: none;
}

/* One still breath (~900ms) sits between the peel and the burst; every
   celebration delay below is measured from the moment the slip lifts. */
.pop-in {
  animation: pop-in 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  65% {
    opacity: 1;
    transform: scale(1.08);
  }
  85% {
    transform: scale(0.96);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.duckota-cheer {
  animation: duckota-cheer 700ms cubic-bezier(0.16, 1, 0.3, 1) 1050ms both;
}

@keyframes duckota-cheer {
  0% {
    opacity: 0;
    transform: translateY(30px) rotate(-8deg) scale(0.85);
  }
  55% {
    opacity: 1;
    transform: translateY(-14px) rotate(4deg) scale(1.04);
  }
  80% {
    transform: translateY(5px) rotate(-2deg) scale(0.99);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(0) scale(1);
  }
}

.confetti-piece {
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  pointer-events: none;
}

.confetti-burst {
  animation: confetti-fall 1100ms cubic-bezier(0.25, 0.8, 0.4, 1) both;
}

@keyframes confetti-fall {
  0% {
    opacity: 0;
    transform: translateY(-18px) rotate(0deg) scale(0.4);
  }
  25% {
    opacity: 1;
  }
  70% {
    transform: translateY(52px) rotate(var(--tilt)) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(90px) rotate(calc(var(--tilt) * 2)) scale(0.9);
  }
}

.prop-in {
  animation: prop-rise 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes prop-rise {
  0% {
    opacity: 0;
    transform: translateY(40px) rotate(-10deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}

.cta-glow {
  animation: cta-arrive 500ms ease-out both;
}

@keyframes cta-arrive {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .slip {
    transition-duration: 0.01ms;
    transition-delay: 0ms;
  }
  .slip-line,
  .pop-in,
  .duckota-cheer,
  .confetti-burst,
  .prop-in,
  .cta-glow {
    animation: none;
  }
  .confetti-burst {
    opacity: 0;
  }
}
</style>
