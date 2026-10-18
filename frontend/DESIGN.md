# Nyare Design System Specification

## 1. Product Identity & Atmosphere

- **Product Name**: Nyare
- **Display Mark**: `'Nyare` (styled with `DynaPuff`)
- **Tagline**: `para di ma yare` (styled with `Quicksand`)
- **Mascot**: **Duckota** — a coastal seagull wearing a student badge and carrying a pencil.
- **Aesthetic Direction**: Coastal academic planner. Combines warm sandy parchment with vibrant ocean cyan accents and tactile 3D buttons (Duolingo-inspired playfulness with high utility).
- **Target Platform**: Mobile-first web application (baseline viewport 390px width).

---

## 2. Typography System

Nyare uses a three-tier typographic hierarchy:

| Role | Font Family | Weights | Intended Elements |
| :--- | :--- | :--- | :--- |
| **Logo / Brand** | `DynaPuff`, cursive | 600 | Brand mark `'Nyare`, primary onboarding titles |
| **Primary UI** | `Quicksand`, sans-serif | 500, 600, 700 | Page headers, task titles, card labels, buttons, navigation |
| **Secondary UI** | `Inter`, sans-serif | 400, 500, 600, Italic | Form inputs, select dropdowns, Tiptap note editor text |

### Font Import Specification
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DynaPuff:wght@600&family=Inter:ital,wght@0,400;0,500;0,600;1,400&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
```

### Typographic Rules
- Use `Quicksand` weight 600 or 700 for all headings and button labels.
- Use `Quicksand` weight 500 for compact UI badges to preserve line thickness on mobile screens.
- Use `Inter` for all rich text note paragraphs and input fields to ensure distinct character recognition and complete italic support.

---

## 3. Base Color System

Theme Mode: **Light mode only** for the initial MVP. Dark mode is deferred.

| Token | Hex Value | Usage Description |
| :--- | :--- | :--- |
| `--color-bg-app` | `#F6F7EE` | Warm parchment background across all pages |
| `--color-surface-card` | `#FFFFFF` | Clean white card and sheet background |
| `--color-nav-bg` | `#FDFEF7` | Warm cream parchment background for bottom navigation bar |
| `--color-primary` | `#00A4C8` | Ocean Cyan primary action color and active indicators |
| `--color-primary-bevel` | `#007B99` | Darker cyan for 3D tactile button bottom borders |
| `--color-text-main` | `#334155` | Slate body text and primary labels |
| `--color-text-muted` | `#7B8B97` | Secondary text, date subtitles, and field placeholders |
| `--color-border` | `#CBD5E1` | Card dividers, input borders, and sheet separators |

### 3D Tactile Button Specification
Buttons use a physical offset border to match the friendly Duolingo aesthetic:
- Face background: `#00A4C8`
- Text color: `#FFFFFF` (Font: Quicksand 700)
- Bottom border: `4px solid #007B99`
- Active state: removes bottom border and translates `translate-y-1` on tap.

---

## 4. 24-Color Course Palette (Google Calendar Parity)

Courses receive deterministic colors calculated by index (`course.id % 24`):

| Index | Name | Solid Marker | Badge Background | Badge Text | Badge Border |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 0 | Tomato | `#D50000` | `#FFEBEE` | `#B71C1C` | `#EF9A9A` |
| 1 | Flamingo | `#E67C73` | `#FDEAE8` | `#C53929` | `#F5B0AA` |
| 2 | Radicchio | `#AD1457` | `#FCE4EC` | `#880E4F` | `#F48FB1` |
| 3 | Cherry Blossom | `#D81B60` | `#FCE4EC` | `#AD1457` | `#F48FB1` |
| 4 | Tangerine | `#F4511E` | `#FBE9E7` | `#BF360C` | `#FFAB91` |
| 5 | Pumpkin | `#EF6C00` | `#FFF3E0` | `#E65100` | `#FFCC80` |
| 6 | Mango | `#F57C00` | `#FFF3E0` | `#EF6C00` | `#FFE0B2` |
| 7 | Banana | `#F6BF26` | `#FEF9E7` | `#B78103` | `#FCE793` |
| 8 | Lemon | `#FBC02D` | `#FFFDE7` | `#F57F17` | `#FFF59D` |
| 9 | Citron | `#AFB42B` | `#F9FBE7` | `#827717` | `#E6EE9C` |
| 10 | Basil | `#0B8043` | `#E6F4EA` | `#0D652D` | `#A8DAB5` |
| 11 | Sage | `#33B679` | `#E8F8F0` | `#1E8E5A` | `#A2E2BF` |
| 12 | Avocado | `#689F38` | `#F1F8E9` | `#33691E` | `#C5E1A5` |
| 13 | Pistachio | `#7CB342` | `#F1F8E9` | `#558B2F` | `#DCEDC8` |
| 14 | Eucalyptus | `#00897B` | `#E0F2F1` | `#004D40` | `#80CBC4` |
| 15 | Peacock | `#039BE5` | `#E1F5FE` | `#0277BD` | `#81D4FA` |
| 16 | Sky | `#29B6F6` | `#E1F5FE` | `#0288D1` | `#B3E5FC` |
| 17 | Blueberry | `#3F51B5` | `#E8EAF6` | `#283593` | `#9FA8DA` |
| 18 | Cobalt | `#1E88E5` | `#E3F2FD` | `#1565C0` | `#90CAF9` |
| 19 | Grape | `#8E24AA` | `#F3E5F5` | `#6A1B9A` | `#CE93D8` |
| 20 | Amethyst | `#9C27B0` | `#F3E5F5` | `#7B1FA2` | `#BA68C8` |
| 21 | Lavender | `#7986CB` | `#E8EAF6` | `#3949AB` | `#C5CAE9` |
| 22 | Wisteria | `#B39DDB` | `#EDE7F6` | `#512DA8` | `#D1C4E9` |
| 23 | Graphite | `#616161` | `#EEEEEE` | `#212121` | `#BDBDBD` |

---

## 5. Corner Radii & Layout Scales

### Radii Hierarchy
- **Cards & Sheet Containers**: `16px` (`rounded-2xl`)
- **Buttons & Form Fields**: `12px` (`rounded-xl`)
- **Tags, Badges & Chips**: `8px` (`rounded-lg`)

### Spacing & Touch Metrics
- **8px Grid Rhythm**: All margins and paddings follow 8px multiples (`8px`, `16px`, `24px`).
- **Touch Target Minimum**: Every interactive icon and button must maintain at least `44px` by `44px` tap boundary.
- **Mobile Viewport Baseline**: Optimized for standard mobile screen width (`390px`).

---

## 6. Calendar Tri-Block Visual Distinctions

Calendar items share course colors but differentiate block types through fill, border, and indicators:

```text
┌────────────────────────────────────────────────────────┐
│ 1. Course Schedule (Recurring Class Meeting)           │
│ [ Pastel Tint Background ] [ Room: Lab 204 ]           │
│ Lower contrast background timetable layer              │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 2. Academic Event (Rigid Exam, Quiz, Deadline)         │
│ [ Solid Saturated Course Fill ] [ 2px Dark Border ]    │
│ [ 🚩 Alarm / Flag Icon ] [ High-contrast White Text ]   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 3. Academic Task (Flexible Virtual Study Plan Item)    │
│ [ White Card Surface ] [ [ ] Completion Checkbox ]     │
│ [ Course Tag ] [ ⏱️ Estimated Duration Badge ]         │
└────────────────────────────────────────────────────────┘
```

### Calendar Density Rules
- In the weekly/monthly grid on mobile screens (~50px column width), display at most 2 chips per day cell.
- When more than 2 items occur on a day, show a `+N more` indicator badge.
- Tapping a day cell navigates directly to the Day View.

---

## 7. Mobile Component Specifications

### 7.1 Bottom Navigation Bar
- Fixed bottom strip containing 3 navigation tabs:
  1. **To-Do / Tasks** (Clipboard icon)
  2. **Calendar** (Calendar icon)
  3. **Notes** (Pencil and paper icon)
- Height: `64px` plus safe-area padding.
- Surface: Cream parchment (`#FDFEF7` / `--color-nav-bg`) with top border `#CBD5E1`.

### 7.2 Task View (Tri-State Planner)
- Segmented filter control: `All` | `Scheduled` | `Later` | `Backlog`.
- When `All` is selected: Renders collapsible accordions for the 3 derived virtual states (`SCHEDULED`, `LATER`, `BACKLOG`).
- When a specific state is selected: Renders a filtered flat list of tasks for that status.

### 7.3 Notes Grid
- Two-column responsive card grid on mobile viewports.
- Each note card displays:
  - Course badge at top left (using the 24-color course palette).
  - Note title (Quicksand 600).
  - Snippet preview text (Inter 400).
  - Entry date timestamp at bottom right (`Oct 6`).
- Floating Action Button (FAB): Bottom right `+` button in Ocean Cyan (`#00A4C8`).

### 7.4 Tiptap Rich Text Editor
- Mobile toolbar format: **Docked keyboard accessory bar**.
- The formatting bar (Bold, Italic, Bullet List, Headings) docks directly above the virtual phone keyboard for thumb reach.
- Text content area styled with `Inter` for legibility and italic support.

### 7.5 App Shell (`AppShell.vue`)
The logged-in tab routes (`/tasks`, `/calendar`, `/notes`) render inside one shared scaffold:

```text
┌──────────────────────────────┐
│ AppHeader (top bar, h-14)    │
├──────────────────────────────┤
│ Routed view (scrolls)        │
│                              │
├──────────────────────────────┤
│ NavigationBar (bottom, h-16) │
└──────────────────────────────┘
        + DuckotaFab (teleported to shell root, absolute left-4 bottom-20, above nav)
```

- The shell fills the viewport on every screen size; no desktop phone frame.
- Views set the header title and side actions with `useShellHeader()`. The call no-ops outside the shell.
- `AppHeader` chrome: `h-14`, `bg-app-bg`, 3px bottom border, centered title (Quicksand 700, `text-xl`).
- Default left action: `AccountMenuButton` (burger → Select Account). Default right action: a 44px spacer.
- `HeaderIconButton` is the shared 44px icon-button chrome for both side regions.

---

## 8. Modal Dialogs & Form Sheets

Modal dialogs provide structured inputs for schedule creation, editing, and destructive actions:

### 8.1 Dialog Structure & Overlay
- **Backdrop**: Semi-transparent scrim (`rgba(0, 0, 0, 0.4)`).
- **Surface**: Pure white (`#FFFFFF`) with a `16px` border radius (`rounded-2xl`).
- **Header Bar**: Displays an exit action on the left, centered title in Quicksand 700, and a primary Save button on the right.

### 8.2 Form Controls & Selection Widgets
- **Circular Day Toggles**: 7 circular buttons for weekdays (`Su` through `Sa`). Inactive buttons use a white fill with cyan border. Active buttons use solid Ocean Cyan (`#00A4C8`) with white text.
- **Time Range Pickers**: Pill containers showing start time and end time separated by an arrow (`9:00 AM → 10:30 AM`).
- **Repeat Switch**: Pill toggle switch for weekly recurring events.
- **Course Color Picker**: Palette icon (`🎨`) followed by circular color swatches from the 24-color course palette.

### 8.3 Confirmation & Destructive Dialogs
- **Mascot Integration**: Duckota illustration peeks over the top-right corner of the confirmation card with an alert expression.
- **Destructive Button**: Tactile 3D button using solid red (`#DC2626`) with a darker bottom border (`4px solid #991B1B`).

---

## 9. Navigation Drawer (Hamburger Menu)

The slide-out drawer provides access to application-wide configuration:

### 9.1 Drawer Layout & Animation
- **Trigger**: Top-left hamburger icon (`≡`) with a minimum 44px tap boundary.
- **Drawer Surface**: White (`#FFFFFF`) slide-out panel from the left screen edge (280px width on mobile).
- **Backdrop**: Dimmed background scrim with tap-outside dismissal.

### 9.2 Drawer Content
- **Header**: Duckota avatar badge with student name or greeting.
- **Navigation Links**:
  1. **Course Manager** (`/courses`): View, add, and manage course offerings.
  2. **Schedule Grid** (`/schedule-grid`): Configure recurring weekly class times.
  3. **Academic Settings** (`/settings`): Configure terms, preferences, and planner limits.
  4. **About Nyare** (`/about`): Product version and credits.
- **Active Link State**: Soft cyan pill highlight (`#E1F5FE` background, `#0288D1` text, Quicksand 600).

---

## 10. Iconography & Visual Assets

### 10.1 Icon Standards
- **Icon Library**: **Lucide Vue** or **Phosphor** vector icons.
- **Stroke Thickness**: Uniform `2px` stroke weight across all UI layers.
- **Bounding Box**: Standard `24px` by `24px` icon container.
- **Touch Target**: Any interactive icon button must expand to at least `44px` by `44px` padding.

### 10.2 Core Semantic Icon Map
- **To-Do / Tasks**: `ClipboardList`
- **Calendar**: `Calendar`
- **Notes**: `FileText` or `PenSquare`
- **Navigation Menu**: `Menu` (`≡`)
- **Add Action**: `Plus`
- **Edit Action**: `Pencil`
- **Delete Action**: `Trash2`
- **Location**: `MapPin`
- **Time**: `Clock`
- **Color Selection**: `Palette`
- **Alert / Exam**: `Flag` or `AlarmClock`
