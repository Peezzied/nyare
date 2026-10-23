import { describe, it, expect } from 'vitest'
import {
  defineComponent,
  h,
  nextTick,
  ref,
  computed,
  toValue,
  KeepAlive,
  type Component,
} from 'vue'
import { mount } from '@vue/test-utils'
import { provideShellHeader, useShellHeader } from '../useShellHeader'

const swap = ref<Component>()

// Mirrors CalendarView: the header title is a computed bound to view state.
const CalendarStub = defineComponent({
  name: 'CalendarView',
  setup() {
    const headerTitle = computed(() => 'Wed, Oct 22')
    useShellHeader({ title: headerTitle })
    return () => h('div', 'cal')
  },
})

const NotesStub = defineComponent({
  name: 'NotesView',
  setup() {
    useShellHeader({ title: 'Notes' })
    return () => h('div', 'notes')
  },
})

const Shell = defineComponent({
  setup() {
    const header = provideShellHeader()
    swap.value = CalendarStub
    return () =>
      h('div', [
        h('h1', { 'data-testid': 'title' }, String(toValue(header.title ?? ''))),
        h(KeepAlive, { include: ['CalendarView', 'NotesView'] }, () =>
          h(swap.value as Component),
        ),
      ])
  },
})

describe('useShellHeader', () => {
  it('replaces a computed title when the next view applies a plain title', async () => {
    const wrapper = mount(Shell)
    await nextTick()
    expect(wrapper.get('[data-testid="title"]').text()).toBe('Wed, Oct 22')

    swap.value = NotesStub
    await nextTick()
    await nextTick()
    expect(wrapper.get('[data-testid="title"]').text()).toBe('Notes')

    swap.value = CalendarStub
    await nextTick()
    await nextTick()
    expect(wrapper.get('[data-testid="title"]').text()).toBe('Wed, Oct 22')
  })
})
