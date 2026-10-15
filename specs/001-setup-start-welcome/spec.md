# Feature Specification: Start, Welcome, and Schedule Header Flow

**Feature Branch**: `001-setup-start-welcome`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Set up the Nyare frontend's Start and Welcome pages using the attached screenshots and supplied copy. Follow the repository instructions and frontend/DESIGN.md. Reuse existing assets and preserve the current Duckota aesthetic, typography, colors, illustrations, and button styling. Make only small, meaningful improvements to spacing, alignment, responsiveness, accessibility, and consistency. Include the third screen's top section only: three progress dots with the third active, back button, 'Create a Schedule' title, and checkmark button. Exclude the calendar grid and bottom toolbar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Start Screen and Begin Onboarding (Priority: P1)

A new student opens the application. The student sees the coastal brand identity, the product title, and the seagull mascot Duckota. The student selects the primary action button to begin the onboarding process.

**Why this priority**: The Start screen provides the first visual entry point for all new students. Users cannot begin onboarding without this screen.

**Independent Test**: The user loads the application root path. The application displays the brand assets and mascot. The user selects "GET STARTED", and the application opens the Welcome screen.

**Acceptance Scenarios**:

1. **Given** a user navigates to the application root address, **When** the page renders, **Then** the application displays the brand title "'Nyare", the subtitle "para di ma yare", the mascot on a stone, the coastal illustrations, and the "GET STARTED" button.
2. **Given** the user views the Start screen, **When** the user activates the "GET STARTED" button, **Then** the application navigates the user to the Welcome screen.
3. **Given** a user views the Start screen on a mobile viewport (390px) or desktop viewport, **When** the layout displays, **Then** the application centers the content and preserves readable proportions without horizontal scrolling.

---

### User Story 2 - Enter Student Name on Welcome Screen (Priority: P2)

A new student arrives at the Welcome screen from the Start screen. The student sees the welcome greeting, the greeting mascot, and a text input field. The student inputs their name and selects the continue button to proceed.

**Why this priority**: Capturing the student's identity personalizes the academic experience and advances the student toward schedule setup.

**Independent Test**: The user navigates to the Welcome screen. The user types a name into the text input. The user activates "CONTINUE", and the application accepts the input and proceeds.

**Acceptance Scenarios**:

1. **Given** the user lands on the Welcome screen, **When** the page renders, **Then** the application displays the progress indicator dots, the header "Welcome,", the subheader "let's get to know you!", the name input field, the greeting mascot with speech bubble "my name is duckota!", and the "CONTINUE" button.
2. **Given** the user views the name input field, **When** the user types their name, **Then** the field displays the entered text with a user profile icon.
3. **Given** the user views the Welcome screen with an empty name input, **When** the user inspects the "CONTINUE" button, **Then** the application disables the button.
4. **Given** the user enters at least one non-whitespace character, **When** the user activates the "CONTINUE" button, **Then** the application accepts the name and navigates to the schedule screen.

---

### User Story 3 - View Schedule Screen Header (Priority: P3)

A student advances to the third onboarding screen. The student sees the top header elements that confirm their progress. The student can navigate back to the Welcome screen to adjust their entered name.

**Why this priority**: Displaying the schedule header completes the three-step onboarding progression and allows reverse navigation.

**Independent Test**: The user arrives on the schedule screen. The application displays the top section with the third progress dot active, the back button, the title "Create a Schedule", and the checkmark button. The calendar grid and bottom toolbar do not render.

**Acceptance Scenarios**:

1. **Given** the user completes the Welcome screen, **When** the schedule screen renders, **Then** the application displays the three-dot progress indicator with the third dot active.
2. **Given** the schedule screen renders, **When** the user views the header, **Then** the application displays the back arrow button, the title "Create a Schedule", and the checkmark action button.
3. **Given** the schedule screen renders, **When** the user inspects the page body, **Then** the application excludes the calendar grid and the bottom toolbar.
4. **Given** the user views the schedule screen header, **When** the user activates the back button, **Then** the application navigates back to the Welcome screen.

---

### User Story 4 - Accessible Keyboard and Screen Reader Navigation (Priority: P4)

A student relies on keyboard navigation or a screen reader to use the application. The student can navigate all interactive elements in logical order and activate buttons using standard keys across all three screens.

**Why this priority**: Accessibility ensures that all students can navigate the onboarding flow without a mouse.

**Independent Test**: The user navigates using only the Tab key and Enter or Space keys across all three screens. Screen readers announce input labels and button actions accurately.

**Acceptance Scenarios**:

1. **Given** a keyboard user visits the Start screen, **When** the user presses the Tab key, **Then** focus moves directly to the "GET STARTED" button with visible focus styling.
2. **Given** a keyboard user visits the Welcome screen, **When** the user tabs through the interface, **Then** focus moves first to the name input field and next to the "CONTINUE" button.
3. **Given** a keyboard user visits the schedule screen, **When** the user tabs through the header, **Then** focus moves between the back button and the checkmark button with visible focus styling.
4. **Given** a screen reader user inspects the name input, **When** the input gains focus, **Then** the screen reader announces an accessible label for the student name field.

---

### Edge Cases

- When a user enters only whitespace characters, the application keeps the "CONTINUE" button disabled.
- When a user rotates a mobile device to landscape or opens the screen on a wide desktop monitor, the layout remains centered within a maximum mobile container width.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render the Start screen with the brand title "'Nyare", subtitle "para di ma yare", and coastal background illustrations (sun, clouds, seagull on stone, plant, starfish, shell, wave).
- **FR-002**: The system MUST provide a tactile 3D action button labeled "GET STARTED" on the Start screen that routes users to the Welcome screen.
- **FR-003**: The system MUST render the Welcome screen with a three-dot progress indicator at the top of the viewport.
- **FR-004**: The system MUST render the Welcome screen title "Welcome," and subtitle "let's get to know you!".
- **FR-005**: The system MUST provide a single-line text input field on the Welcome screen with a leading user profile icon and placeholder text "What is your name?".
- **FR-006**: The system MUST display the greeting Duckota mascot alongside a speech bubble containing the exact copy "my name is duckota!".
- **FR-007**: The system MUST provide a tactile 3D action button labeled "CONTINUE" on the Welcome screen that routes the user to the schedule screen.
- **FR-008**: The system MUST require student name input and MUST disable the "CONTINUE" button until the user enters at least one non-whitespace character.
- **FR-009**: The Start page MUST NOT display progress dots. The Welcome page MUST display the three-dot progress indicator, with the middle dot active to represent step 2 of 3.
- **FR-010**: The system MUST omit an in-page back button on the Welcome screen and rely on browser history navigation to return to the Start page.
- **FR-011**: The system MUST constrain mobile page layouts to a centered baseline container width on larger viewports.
- **FR-012**: The system MUST expose accessible names and semantic roles for all interactive buttons and input controls.
- **FR-013**: The system MUST render the top section of the third screen with the three-dot progress indicator, highlighting the third dot as active step 3 of 3.
- **FR-014**: The system MUST render the third screen header containing a back button, the title "Create a Schedule", and a checkmark completion button.
- **FR-015**: The system MUST navigate the user back to the Welcome screen when the user activates the third screen back button.
- **FR-016**: The system MUST exclude the calendar grid, course blocks, time slots, and bottom toolbar (Edit, +, Delete) from the third screen.

### Key Entities

- **UserProfile**: Represents student profile information gathered during onboarding. Key attributes include student display name.
- **OnboardingStep**: Represents the current stage in the onboarding journey. Key attributes include step identifier, step index, and total step count (3 steps: Start, Welcome, Schedule Header).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the Start and Welcome screen flow in under 20 seconds.
- **SC-002**: 100% of interactive elements support full keyboard operation without mouse input.
- **SC-003**: Visual elements maintain zero horizontal overflow across viewports from 360px to 1920px width.
- **SC-004**: Screen readers correctly announce labels and roles for 100% of form inputs and interactive buttons.
- **SC-005**: 100% of brand visual assets from the design specification render accurately without broken image references.
- **SC-006**: Zero calendar components or bottom toolbars render on the schedule screen.

## Assumptions

- The onboarding flow comprises 3 steps: Start (step 1), Welcome (step 2), and Schedule header (step 3).
- The third screen scope is strictly bounded to the top section: progress dots with third dot active, back button, "Create a Schedule" title, and checkmark button.
- The calendar grid, course blocks, time slots, and bottom toolbar remain strictly out of scope.
- The Welcome page relies on browser back navigation and omits an in-page back button.
- The warm parchment background color (`#F6F7EE`) and ocean cyan primary color (`#00A4C8`) from `frontend/DESIGN.md` apply to all screens.
- Existing SVG and PNG assets in `frontend/src/assets/` provide all required illustrations and mascot poses.
- The application targets light mode only for this phase.
