# Technical Research: Lift Navigation Bar Component

## 1. Component Library & Primitive Selection

### Decision
Use **shadcn-vue** conventions built on **Reka UI** primitives (`reka-ui` and `@lucide/vue`) styled with **Tailwind CSS 4**.

### Rationale
- The repository already scaffolds `reka-ui` (`^2.11.0`), `@lucide/vue` (`^1.55.0`), and Tailwind CSS 4 in `frontend/package.json` and `frontend/components.json`.
- Reka UI provides accessible headless tab and button primitives without enforcing prepackaged opinions.
- Zero extra npm packages are required, satisfying the Ponytail minimalism rule.
- Full access to Tailwind CSS classes allows precise tactile Duolingo 3D offsets and spring curves.

### Alternatives Considered
- **PrimeVue / Vuetify**: Enforces heavy Material Design layout skins and adds runtime bundle bloat. Rejected due to over-engineering and conflict with project design tokens.
- **Pure custom HTML elements**: Lacks accessible keyboard focus management and screen reader bindings out of the box. Rejected in favor of headless Reka UI primitives.

---

## 2. Tactile Duolingo Lift Physics & Interaction Styling

### Decision
Implement physical 3D lift physics using pure CSS transforms and physical border offsets:
- **Resting state**: Flat alignment, muted slate icon color (`#7B8B97`), transparent bottom bevel.
- **Hover/Tap down state**: Compresses downward by `2px` (`translate-y-0.5`) with 100ms response.
- **Active state**: Lifts upward by `4px` (`-translate-y-1`) with Ocean Cyan accent fill (`#00A4C8`) and a tactile bottom border bevel (`border-b-4 border-[#007B99]`).
- **Timing**: `transition-all duration-150 ease-out` (with `motion-reduce:transition-none`).

### Rationale
- Duolingo's tactile interface relies on physical bottom borders simulating 3D keycaps.
- Hardware-accelerated CSS transforms (`translate-y`) ensure smooth 60fps rendering without triggering browser reflow or layout shifts.
- Respects `prefers-reduced-motion` per accessibility guidelines.

### Alternatives Considered
- **Box-shadow only**: Looks soft and diffuse, failing the crisp Duolingo tactile keycap aesthetic.
- **GSAP animation library**: Overkill for a three-button bottom navigation bar. Native Tailwind 4 transitions provide sufficient spring feel with zero runtime weight.

---

## 3. Mobile Docking & Safe-Area Layout

### Decision
Position the navigation bar with fixed viewport pinning:
- `fixed bottom-0 inset-x-0 z-40`
- Base bar height of `64px` (`h-16`)
- Safe-area compensation: `pb-[env(safe-area-inset-bottom)]`
- Surface: White (`#FFFFFF`) with top border `#CBD5E1`
- Content compensation: Applications add matching bottom padding (`pb-20`) to prevent fixed nav overlap.

### Rationale
- Meets Section 7.1 of `frontend/DESIGN.md`.
- Prevents collision with iOS and Android system home gesture bars.

---

## 4. Subagent Histoire Story Generation Strategy

### Decision
Deploy an isolated subagent using the `histoire` skill to construct `src/components/NavigationBar.story.vue`.

### Rationale
- Separates visual story crafting from core logic and unit testing.
- The subagent focuses entirely on interactive playground variants, mobile viewport mockups, and state toggles.
- Follows the project rule: Histoire stories live in `*.story.vue` files and do not include test runner code.

### Story Variants Scope
1. **Interactive State**: Toggle between Tasks, Calendar, and Notes.
2. **Duolingo 3D Lift Preview**: Demonstrates resting, pressed, and lifted states.
3. **Mobile Screen Preview**: Renders the bar inside a 390px mobile container with active views.
