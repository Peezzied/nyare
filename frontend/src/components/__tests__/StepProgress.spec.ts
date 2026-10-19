import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StepProgress from '../StepProgress.vue'

describe('StepProgress', () => {
  it('announces the active step through a status role by default', () => {
    const wrapper = mount(StepProgress, { props: { activeStep: 2 } })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('Step 2 of 3')
    expect(wrapper.findAll('button').length).toBe(0)
    expect(wrapper.find('[aria-current="step"]').attributes('data-step')).toBe('2')
  })

  it('emits select with the step number when a completed dot is clicked', async () => {
    const wrapper = mount(StepProgress, {
      props: { activeStep: 3, interactive: true },
    })

    await wrapper.find('[data-step="1"]').trigger('click')
    await wrapper.find('[data-step="2"]').trigger('click')

    expect(wrapper.emitted('select')).toEqual([[1], [2]])
  })

  it('keeps the current and upcoming dots inert when interactive', () => {
    const wrapper = mount(StepProgress, {
      props: { activeStep: 2, interactive: true },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(3)
    expect(buttons[0]!.attributes('disabled')).toBeUndefined()
    expect(buttons[1]!.attributes('disabled')).toBeDefined()
    expect(buttons[2]!.attributes('disabled')).toBeDefined()
  })

  it('labels each dot with the provided step names', () => {
    const wrapper = mount(StepProgress, {
      props: {
        activeStep: 3,
        interactive: true,
        stepLabels: ['Start', 'Your name', 'Class schedule'],
      },
    })

    expect(wrapper.find('[data-step="1"]').attributes('aria-label')).toBe('Step 1: Start')
  })
})
