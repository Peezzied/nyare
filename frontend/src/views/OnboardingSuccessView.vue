<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { minidenticon } from 'minidenticons'
import TactileButton from '@/components/TactileButton.vue'
import OnboardingShell from '@/components/OnboardingShell.vue'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/composables/useOnboarding'
import { useAuth } from '@/composables/useAuth'
import { useRouteWipe } from '@/composables/useRouteWipe'
import { COURSE_PALETTE_24 } from '@/utils/courseColors'
import { COURSE_COLORS } from '@/utils/courseColors'

const props = withDefaults(defineProps<{ initialRevealed?: boolean }>(), {
  initialRevealed: false,
})

const { studentName, savedSummary } = useOnboarding()
const { wipeTo } = useRouteWipe()
const { user } = useAuth()

const displayName = computed(() => studentName.value.trim() || user.value?.username || '')
const profileName = computed(() => user.value?.username?.trim() || 'student')
const avatarSrc = computed(
  () =>
    `data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(profileName.value, 70, 50))}`,
)
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

// Confetti rains continuously: each piece crosses the full stage on its own
// loop. Negative delays scatter the pieces mid-fall on reveal.
const CONFETTI = [
  { top: '16%', left: '10%', color: 'var(--color-primary)', tilt: '20deg', dur: 3800, delay: -400 },
  { top: '12%', left: '32%', color: COURSE_COLORS[7]!.solid, tilt: '-30deg', dur: 4400, delay: -1900 },
  { top: '20%', left: '62%', color: COURSE_COLORS[4]!.solid, tilt: '45deg', dur: 3600, delay: -2700 },
  { top: '14%', left: '84%', color: COURSE_COLORS[11]!.solid, tilt: '10deg', dur: 4800, delay: -900 },
  { top: '26%', left: '18%', color: COURSE_COLORS[19]!.solid, tilt: '-15deg', dur: 4000, delay: -3300 },
  { top: '24%', left: '74%', color: COURSE_COLORS[8]!.solid, tilt: '32deg', dur: 3400, delay: -1500 },
  { top: '30%', left: '46%', color: COURSE_COLORS[1]!.solid, tilt: '-40deg', dur: 4600, delay: -2300 },
  { top: '10%', left: '52%', color: COURSE_COLORS[18]!.solid, tilt: '24deg', dur: 3900, delay: -3100 },
] as const

// Pencil-gray speed lines rise past the idle slip, telegraphing the peel's
// upward travel. `y` only applies when motion is reduced: keyframe transforms
// override the inline transform while the loop runs.
const STREAKS = [
  { left: '4%', height: 48, dur: 3.2, delay: -0.9, y: 14 },
  { left: '10%', height: 30, dur: 2.8, delay: -2.1, y: 42 },
  { left: '16%', height: 58, dur: 3.8, delay: -0.3, y: 71 },
  { left: '24%', height: 36, dur: 3.0, delay: -1.6, y: 27 },
  { left: '33%', height: 44, dur: 2.6, delay: -2.8, y: 58 },
  { left: '42%', height: 62, dur: 3.6, delay: -1.1, y: 84 },
  { left: '50%', height: 32, dur: 2.9, delay: -3.4, y: 19 },
  { left: '58%', height: 52, dur: 3.3, delay: -0.5, y: 49 },
  { left: '67%', height: 28, dur: 2.7, delay: -2.4, y: 76 },
  { left: '76%', height: 46, dur: 3.5, delay: -1.9, y: 33 },
  { left: '86%', height: 38, dur: 3.1, delay: -0.8, y: 64 },
  { left: '94%', height: 56, dur: 4.0, delay: -2.7, y: 8 },
] as const
</script>

<template>
  <OnboardingShell class="px-6">
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
          animationDuration: `${piece.dur}ms`,
          animationDelay: `${piece.delay}ms`,
        }"
        aria-hidden="true"
      />

      <h1
        class="absolute inset-x-0 top-[24%] text-center font-logo text-6xl font-semibold text-primary"
        :class="revealed ? 'pop-in' : 'pre-hidden'"
        style="animation-delay: 1000ms"
      >
        You did it!
      </h1>
      <div
        class="absolute inset-x-0 top-[33%] flex items-center justify-center gap-2 px-6"
        :class="revealed ? 'pop-in' : 'pre-hidden'"
        style="animation-delay: 1100ms"
      >
        <img
          :src="avatarSrc"
          :alt="`${profileName} profile picture`"
          class="h-7 w-7 rounded-full border border-card bg-card object-cover shadow-day-toggle"
        />
        <p class="text-lg font-bold text-text-soft">
          {{ displayName ? `your week is set, ${displayName}` : 'your week is set' }}
        </p>
      </div>

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
            GO TO CALENDAR
          </TactileButton>
        </div>
      </div>
    </div>

    <!-- Idle speed lines: stream up behind the slip until the peel -->
    <div
      v-show="!slipGone"
      class="streaks absolute inset-0"
      :class="{ 'streaks-off': revealed }"
      aria-hidden="true"
    >
      <span
        v-for="streak in STREAKS"
        :key="streak.left"
        class="streak"
        :style="{
          left: streak.left,
          height: `${streak.height}px`,
          transform: `translateY(${streak.y}vh)`,
          animationDuration: `${streak.dur}s`,
          animationDelay: `${streak.delay}s`,
        }"
      />
    </div>

    <!-- Recap slip: the paper on stage, lifted away on continue -->
    <section
      v-show="!slipGone"
      :inert="revealed"
      :aria-hidden="revealed"
      aria-label="Saved schedule summary"
      class="slip absolute left-1/2 top-[16%] z-30 w-[86%] max-w-[340px] -translate-x-1/2 rounded-2xl border border-border-soft bg-card p-5 pt-7 shadow-[0_10px_0_rgba(0,123,153,0.12),0_24px_44px_rgba(51,65,85,0.16)]"
      :class="{ 'slip-away': revealed }"
    >
      <div
        class="absolute -top-3.5 left-1/2 -translate-x-1/2 rotate-2 rounded-lg bg-primary px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white shadow-bevel"
      >
        SAVED
      </div>

      <div class="absolute -top-4 right-5 rotate-6">
        <img
          :src="avatarSrc"
          :alt="`${profileName} profile picture`"
          class="slip-line h-11 w-11 rounded-full border-2 border-card bg-card object-cover shadow-stationery"
          style="animation-delay: 300ms"
        />
      </div>

      <h2
        class="slip-line font-logo text-3xl font-semibold text-primary-bevel"
        style="animation-delay: 200ms"
      >
        All set{{ displayName ? `, ${displayName}` : '' }}!
      </h2>

      <dl class="mt-4">
        <div
          class="slip-line flex items-center justify-between border-t border-dashed border-border-soft py-2.5"
          style="animation-delay: 420ms"
        >
          <dt class="text-sm font-semibold text-text-main">Courses pinned</dt>
          <dd class="text-base font-bold text-primary">{{ summary.courses.length }}</dd>
        </div>
        <div
          class="slip-line flex items-center justify-between border-t border-dashed border-border-soft py-2.5"
          style="animation-delay: 620ms"
        >
          <dt class="text-sm font-semibold text-text-main">Class blocks</dt>
          <dd class="text-base font-bold text-primary">{{ summary.classBlocks }}</dd>
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

      <Button
        type="button"
        variant="tactile-ocean"
        size="touch"
        data-testid="reveal-celebration"
        class="slip-line mt-5 w-full"
        style="animation-delay: 950ms"
        @click="reveal"
      >
        CONTINUE
      </Button>
    </section>
  </OnboardingShell>
</template>

<style scoped>
/* Celebration pieces stay hidden until the slip lifts; reduced-motion users
   never get the animation classes' from-frames, so the base state is visible. */
.pre-hidden {
  opacity: 0;
}

/* Speed lines die out as the slip lifts; v-show removes them with the slip. */
.streaks {
  transition: opacity 300ms ease;
}

.streaks-off {
  opacity: 0;
}

.streak {
  position: absolute;
  top: 0;
  width: 2px;
  border-radius: 9999px;
  background: var(--color-text-muted);
  opacity: 0.4;
  animation: streak-rise linear infinite;
}

/* Both endpoints sit off-screen, so the loop has no seam. */
@keyframes streak-rise {
  from {
    transform: translateY(105vh);
  }
  to {
    transform: translateY(-15vh);
  }
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
  animation: confetti-drift linear infinite;
}

/* Both endpoints sit off-stage, so the loop has no seam: pieces fade in at
   the top edge and out at the bottom. */
@keyframes confetti-drift {
  0% {
    opacity: 0;
    transform: translateY(-40vh) rotate(0deg) scale(0.7);
  }
  8% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(115vh) rotate(calc(var(--tilt) * 4)) scale(0.95);
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
  .cta-glow,
  .streak {
    animation: none;
  }
  .confetti-burst {
    opacity: 0;
  }
}
</style>
