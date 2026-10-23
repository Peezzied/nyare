import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OnboardingSuccessView from '../OnboardingSuccessView.vue'
import { useOnboarding } from '@/composables/useOnboarding'
import { resetRouteWipe } from '@/composables/useRouteWipe'

const mockReplace = vi.fn<(path: string) => Promise<void> | void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

function seedSummary() {
  useOnboarding().setStudentName('Karol')
  useOnboarding().setSavedSummary({
    courses: [
      { name: 'CCS 201', colorId: 'peacock' },
      { name: 'MATH 142', colorId: 'banana' },
    ],
    classBlocks: 5,
  })
}

describe('OnboardingSuccessView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRouteWipe()
    useOnboarding().resetOnboarding()
    seedSummary()
  })

  it('shows the recap slip with the real saved counts before the celebration', () => {
    const wrapper = mount(OnboardingSuccessView)

    const slip = wrapper.find('section[aria-label="Saved schedule summary"]')
    expect(slip.exists()).toBe(true)
    expect(slip.text()).toContain('All set, Karol!')
    expect(slip.text()).toContain('Courses pinned')
    expect(slip.text()).toContain('2')
    expect(slip.text()).toContain('Class blocks')
    expect(slip.text()).toContain('5')
    expect(slip.text()).toContain('CCS 201')
    expect(slip.text()).toContain('MATH 142')

    // The celebration is mounted underneath but out of the a11y tree.
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
  })

  it('peels the slip away and sends the student to the calendar', async () => {
    const wrapper = mount(OnboardingSuccessView)

    await wrapper.find('[data-testid="reveal-celebration"]').trigger('click')
    expect(wrapper.find('section.slip-away').exists()).toBe(true)

    await wrapper.find('button[aria-label="Go to your calendar"]').trigger('click')
    await vi.waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/calendar'))
  })

  it('covers the screen before the calendar route swaps', async () => {
    const wrapper = mount(OnboardingSuccessView, { props: { initialRevealed: true } })

    await wrapper.find('button[aria-label="Go to your calendar"]').trigger('click')

    // The route swap waits for the disc to cover the viewport first.
    expect(mockReplace).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/calendar'))
  })

  it('renders the celebration directly when already revealed', () => {
    const wrapper = mount(OnboardingSuccessView, { props: { initialRevealed: true } })

    // The slip is gone (v-show), not merely mid-peel.
    expect(wrapper.find('section').isVisible()).toBe(false)
    expect(wrapper.text()).toContain('You did it!')
    expect(wrapper.text()).toContain('your week is set, Karol')
  })
})
