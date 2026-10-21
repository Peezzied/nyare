import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import NoteEditor from '../NoteEditor.vue'
import TiptapEditor from '@/components/editor/TiptapEditor.vue'
import CoursePickerDialog from '@/components/CoursePickerDialog.vue'
import { notesApi } from '@/api/notes'
import { coursesApi, schedulesApi, studyPlannerApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { useProcess, resetProcess } from '@/composables/useProcess'
import { useToasts } from '@/composables/useToasts'
import type {
  NoteRequest,
  NoteResponse,
  NoteSummaryResponse,
  ImageUploadResponse,
} from '@/types/api'

const mockRoute = {
  params: {} as Record<string, string>,
  query: {} as Record<string, string>,
}

const mockRouter = {
  back: vi.fn<() => void>(),
  push: vi.fn<(to: string) => void>(),
}

// The vue-router mock stores the onBeforeRouteLeave callback here, so tests can call the guard directly.
let beforeRouteLeaveCallback:
  ((to?: unknown, from?: unknown, next?: unknown) => boolean | void) | null = null

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
  onBeforeRouteLeave: (cb: (to?: unknown, from?: unknown, next?: unknown) => boolean | void) => {
    beforeRouteLeaveCallback = cb
  },
}))

vi.mock('@/api/notes', () => ({
  notesApi: {
    create: vi.fn<(request: NoteRequest) => Promise<NoteResponse>>(),
    update: vi.fn<(id: string, request: NoteRequest) => Promise<NoteResponse>>(),
    get: vi.fn<(id: string) => Promise<NoteResponse>>(),
    list: vi.fn<(courseId?: number) => Promise<NoteSummaryResponse[]>>(),
    delete: vi.fn<(id: string) => Promise<void>>(),
  },
}))

describe('NoteEditor.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // useCatalog and useProcess keep module-level state. Reset them so each test starts clean.
    useCatalog().resetCatalog()
    resetProcess()
    mockRoute.params = {}
    mockRoute.query = {}
    beforeRouteLeaveCallback = null

    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 101 Computer Science', description: null, userId: 1 },
      { id: 2, name: 'MATH 201 Calculus II', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue({
      hasPendingNotes: false,
      dirtyNoteCount: 0,
      dirtyDates: [],
      courseNames: [],
      pendingNotes: [],
    })
  })

  it('locks editor and disables save button when course is unassigned (course anchor gating)', async () => {
    const wrapper = mount(NoteEditor)
    await flushPromises()

    const prompt = wrapper.find('[data-testid="course-gating-prompt"]')
    expect(prompt.exists()).toBe(true)
    expect(prompt.text()).toContain('Select a course to start writing')

    const tiptap = wrapper.findComponent(TiptapEditor)
    expect(tiptap.props('editable')).toBe(false)

    const saveButton = wrapper.find('[data-testid="save-button"]')
    expect(saveButton.attributes('disabled')).toBeDefined()
  })

  it('unlocks editor when a course is selected from CoursePickerDialog', async () => {
    const wrapper = mount(NoteEditor)
    await flushPromises()

    const picker = wrapper.findComponent(CoursePickerDialog)
    expect(picker.exists()).toBe(true)

    // Simulate course selection from dialog
    await picker.vm.$emit('select', 1)
    await flushPromises()

    const prompt = wrapper.find('[data-testid="course-gating-prompt"]')
    expect(prompt.exists()).toBe(false)

    const tiptap = wrapper.findComponent(TiptapEditor)
    expect(tiptap.props('editable')).toBe(true)

    const trigger = wrapper.find('[data-testid="course-picker-trigger"]')
    expect(trigger.text()).toContain('CS 101 Computer Science')
  })

  it('keeps save button disabled when content is empty even after course selection', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
      },
    })
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    expect(saveButton.attributes('disabled')).toBeDefined()
  })

  it('keeps save button disabled when entry date is missing or cleared', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
        initialDate: '',
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Some note content</p>')
    await flushPromises()

    // Without entry date, save button must stay disabled
    const saveButton = wrapper.find('[data-testid="save-button"]')
    expect(saveButton.attributes('disabled')).toBeDefined()
  })

  it('enables save button and dispatches notesApi.create with Markdown payload on new note', async () => {
    const mockCreatedNote: NoteResponse = {
      id: 'note-uuid-new-1',
      courseId: 1,
      title: 'Operating Systems Notes',
      content: 'Process synchronization lecture insights',
      entryDate: '2026-10-13',
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
    }
    vi.mocked(notesApi.create).mockResolvedValueOnce(mockCreatedNote)

    const wrapper = mount(NoteEditor, {
      props: {
        initialDate: '2026-10-13',
      },
    })
    await flushPromises()

    const picker = wrapper.findComponent(CoursePickerDialog)
    await picker.vm.$emit('select', 1)

    const titleInput = wrapper.find<HTMLInputElement>('[data-testid="title-input"]')
    await titleInput.setValue('Operating Systems Notes')

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Process synchronization lecture insights</p>')
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    expect(saveButton.attributes('disabled')).toBeUndefined()

    await saveButton.trigger('click')
    await flushPromises()

    expect(notesApi.create).toHaveBeenCalledTimes(1)
    expect(notesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 1,
        title: 'Operating Systems Notes',
        content: 'Process synchronization lecture insights',
      }),
    )
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('sends a null title on save when the title field is blank', async () => {
    vi.mocked(notesApi.create).mockResolvedValueOnce({
      id: 'note-uuid-untitled-1',
      courseId: 1,
      title: 'Untitled Note',
      content: 'First line of the body',
      entryDate: '2026-10-13',
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
    })

    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>First line of the body</p>')
    await flushPromises()

    await wrapper.find('[data-testid="save-button"]').trigger('click')
    await flushPromises()

    expect(notesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 1,
        title: null,
        content: 'First line of the body',
      }),
    )
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('loads existing note via notesApi.get and updates note via notesApi.update in edit mode', async () => {
    mockRoute.params = { id: 'note-uuid-existing-99' }

    const existingNote: NoteResponse = {
      id: 'note-uuid-existing-99',
      courseId: 2,
      title: 'Calculus Derivatives',
      content: '# Derivatives Overview\n\nChain rule notes',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(existingNote)
    vi.mocked(notesApi.update).mockResolvedValueOnce({
      ...existingNote,
      title: 'Calculus Derivatives & Integrals',
    })

    const wrapper = mount(NoteEditor)
    await flushPromises()

    expect(notesApi.get).toHaveBeenCalledWith('note-uuid-existing-99')

    const titleInput = wrapper.find<HTMLInputElement>('[data-testid="title-input"]')
    expect(titleInput.element.value).toBe('Calculus Derivatives')

    const trigger = wrapper.find('[data-testid="course-picker-trigger"]')
    expect(trigger.text()).toContain('MATH 201 Calculus II')

    // Edit title and save
    await titleInput.setValue('Calculus Derivatives & Integrals')
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    await saveButton.trigger('click')
    await flushPromises()

    expect(notesApi.update).toHaveBeenCalledWith(
      'note-uuid-existing-99',
      expect.objectContaining({
        courseId: 2,
        title: 'Calculus Derivatives & Integrals',
        content: '# Derivatives Overview\n\nChain rule notes',
      }),
    )
    expect(mockRouter.back).toHaveBeenCalled()
  })

  it('adopts the AI-generated title when a Process run completes while the note is open', async () => {
    mockRoute.params = { id: 'note-uuid-untitled-7' }

    const untitledNote: NoteResponse = {
      id: 'note-uuid-untitled-7',
      courseId: 2,
      title: 'Untitled Note',
      content: 'integration by parts drill',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get)
      .mockResolvedValueOnce(untitledNote)
      .mockResolvedValueOnce({ ...untitledNote, title: 'Integration by parts drill' })

    const wrapper = mount(NoteEditor)
    await flushPromises()

    const titleInput = wrapper.find<HTMLInputElement>('[data-testid="title-input"]')
    expect(titleInput.element.value).toBe('Untitled Note')

    // The run commits and the SSE done event fills the shared summary.
    useProcess().summary.value = {
      tasksCreated: 1,
      eventsCreated: 0,
      contextsCreated: 0,
      affectedCourseIds: [2],
    }
    await flushPromises()

    expect(notesApi.get).toHaveBeenCalledTimes(2)
    expect(titleInput.element.value).toBe('Integration by parts drill')
  })

  it('leaves a custom title untouched when a Process run completes', async () => {
    mockRoute.params = { id: 'note-uuid-titled-8' }

    const titledNote: NoteResponse = {
      id: 'note-uuid-titled-8',
      courseId: 2,
      title: 'Calculus Derivatives',
      content: 'chain rule notes',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(titledNote)

    const wrapper = mount(NoteEditor)
    await flushPromises()

    useProcess().summary.value = {
      tasksCreated: 1,
      eventsCreated: 0,
      contextsCreated: 0,
      affectedCourseIds: [2],
    }
    await flushPromises()

    // The loaded note has a custom title, so no refresh request fires.
    expect(notesApi.get).toHaveBeenCalledTimes(1)
    expect(wrapper.find<HTMLInputElement>('[data-testid="title-input"]').element.value).toBe(
      'Calculus Derivatives',
    )
  })

  it('shows unsaved changes dialog when navigating back with unsaved content', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')

    // Attach to document.body because the tests query it for the dialog.
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
      },
      attachTo: document.body,
    })
    await flushPromises()

    const titleInput = wrapper.find<HTMLInputElement>('[data-testid="title-input"]')
    await titleInput.setValue('Drafting a thought...')
    await flushPromises()

    // Clicking back triggers the unsaved changes dialog
    const backButton = wrapper.find('[data-testid="detail-back"]')
    await backButton.trigger('click')
    await flushPromises()

    const unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).not.toBeNull()
    expect(mockRouter.back).not.toHaveBeenCalled()

    // Clicking cancel keeps editing
    const cancelButton = document.body.querySelector(
      '[data-testid="cancel-discard-button"]',
    ) as HTMLButtonElement
    expect(cancelButton).not.toBeNull()
    cancelButton.click()
    await flushPromises()
    expect(mockRouter.back).not.toHaveBeenCalled()

    // Router navigation guard callback warns while note is dirty
    expect(beforeRouteLeaveCallback).toBeDefined()
    const guard = beforeRouteLeaveCallback!
    confirmSpy.mockReturnValueOnce(false)
    expect(guard()).toBe(false)

    confirmSpy.mockReturnValueOnce(true)
    expect(guard()).toBe(true)

    // Trigger back again and confirm discard
    await backButton.trigger('click')
    await flushPromises()

    const confirmButton = document.body.querySelector(
      '[data-testid="confirm-discard-button"]',
    ) as HTMLButtonElement
    expect(confirmButton).not.toBeNull()
    confirmButton.click()
    await flushPromises()
    expect(mockRouter.back).toHaveBeenCalled()

    wrapper.unmount()
  })

  it('blocks save and shows error banner when invalid or unpersisted image reference is present', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
        initialTitle: 'Image Test',
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    // Emit HTML with an invalid image url (not a UUID)
    await tiptap.vm.$emit(
      'update:modelValue',
      '<p>Image test <img src="/api/images/invalid-uuid" alt="bad"></p>',
    )
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    await saveButton.trigger('click')
    await flushPromises()

    expect(notesApi.create).not.toHaveBeenCalled()
    const errorBanner = wrapper.find('[data-testid="error-banner"]')
    expect(errorBanner.exists()).toBe(true)
    expect(errorBanner.text()).toContain('Image reference does not contain a valid UUID')
  })

  it('blocks save and shows error banner when unpersisted random UUID image reference is present', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
        initialTitle: 'Image Test',
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    // Emit HTML with a valid UUID format but not uploaded/persisted in session
    await tiptap.vm.$emit(
      'update:modelValue',
      '<p>Image test <img src="/api/images/12345678-1234-1234-1234-123456789abc" alt="unpersisted"></p>',
    )
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    await saveButton.trigger('click')
    await flushPromises()

    expect(notesApi.create).not.toHaveBeenCalled()
    const errorBanner = wrapper.find('[data-testid="error-banner"]')
    expect(errorBanner.exists()).toBe(true)
    expect(errorBanner.text()).toContain('unpersisted')
  })

  it('permits saving when image was successfully uploaded during the session', async () => {
    const validImageResponse: ImageUploadResponse = {
      id: 'a0b1c2d3-e4f5-4a5b-8c9d-0e1f2a3b4c5d',
      url: '/api/images/a0b1c2d3-e4f5-4a5b-8c9d-0e1f2a3b4c5d',
      contentType: 'image/png',
      size: 2048,
      createdAt: '2026-10-13T00:00:00Z',
    }

    vi.mocked(notesApi.create).mockResolvedValueOnce({
      id: 'saved-note-id',
      courseId: 1,
      title: 'Valid Image Note',
      content: '![diagram](/api/images/a0b1c2d3-e4f5-4a5b-8c9d-0e1f2a3b4c5d)',
      entryDate: '2026-10-13',
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
    })

    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
        initialTitle: 'Valid Image Note',
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    // Simulate image upload event emitted by TiptapEditor
    await tiptap.vm.$emit('image-uploaded', validImageResponse)

    // Then insert the image into editor
    await tiptap.vm.$emit(
      'update:modelValue',
      '<p><img src="/api/images/a0b1c2d3-e4f5-4a5b-8c9d-0e1f2a3b4c5d" alt="diagram"></p>',
    )
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    await saveButton.trigger('click')
    await flushPromises()

    expect(notesApi.create).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false)
  })

  it('displays API error notice when save operation fails on backend', async () => {
    vi.mocked(notesApi.create).mockRejectedValueOnce(
      new Error('Internal server error on note save'),
    )

    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
        initialTitle: 'Failure Test',
        initialContent: 'Valid text content',
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Valid text content edited</p>')
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    await saveButton.trigger('click')
    await flushPromises()

    const errorBanner = wrapper.find('[data-testid="error-banner"]')
    expect(errorBanner.exists()).toBe(true)
    expect(errorBanner.text()).toContain('Internal server error on note save')
  })

  it('renders shadcn date picker trigger with formatted date and displays calendar pill', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialDate: '2026-10-12',
      },
    })
    await flushPromises()

    const dateTrigger = wrapper.find('[data-testid="date-picker"]')
    expect(dateTrigger.exists()).toBe(true)
    expect(dateTrigger.text()).toContain('Oct 12, 2026')
  })

  it('renders full-height flex column with full-width main editor container', async () => {
    const wrapper = mount(NoteEditor)
    await flushPromises()

    const root = wrapper.find('.h-dvh')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('flex')
    expect(root.classes()).toContain('flex-col')
    expect(root.classes()).toContain('overflow-hidden')

    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    expect(main.classes()).toContain('flex-1')
    expect(main.classes()).toContain('min-h-0')
    expect(main.classes()).toContain('w-full')
  })

  it('renders status bar with Draft badge and 0 words on new note', async () => {
    const wrapper = mount(NoteEditor)
    await flushPromises()

    const statusBar = wrapper.find('[data-testid="editor-status-bar"]')
    expect(statusBar.exists()).toBe(true)

    const statusBadge = wrapper.find('[data-testid="processing-status-badge"]')
    expect(statusBadge.text()).toBe('Draft')

    const wordCount = wrapper.find('[data-testid="word-count"]')
    expect(wordCount.text()).toBe('0 words')
  })

  it('updates live word count when editor content updates', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>One two three four</p>')
    await flushPromises()

    const wordCount = wrapper.find('[data-testid="word-count"]')
    expect(wordCount.text()).toBe('4 words')
  })

  it('displays Unprocessed badge when existing note has not been analyzed by AI planner', async () => {
    mockRoute.params = { id: 'note-unprocessed-1' }
    const unprocessedNote: NoteResponse = {
      id: 'note-unprocessed-1',
      courseId: 1,
      title: 'Unprocessed Note',
      content: 'Some lecture content',
      entryDate: '2026-10-13',
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
      lastProcessedAt: null,
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(unprocessedNote)

    const wrapper = mount(NoteEditor)
    await flushPromises()

    const statusBadge = wrapper.find('[data-testid="processing-status-badge"]')
    expect(statusBadge.text()).toBe('Unprocessed')
  })

  it('displays Processed badge when note is up to date and transitions to Pending update when edited', async () => {
    mockRoute.params = { id: 'note-processed-1' }
    const processedNote: NoteResponse = {
      id: 'note-processed-1',
      courseId: 1,
      title: 'Processed Note',
      content: 'Original note content',
      entryDate: '2026-10-13',
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
      lastProcessedAt: '2026-10-13T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(processedNote)

    const wrapper = mount(NoteEditor)
    await flushPromises()

    const statusBadge = wrapper.find('[data-testid="processing-status-badge"]')
    expect(statusBadge.text()).toBe('Processed')

    // Edit content to make dirty
    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Original note content with additions</p>')
    await flushPromises()

    expect(statusBadge.text()).toBe('Pending update')
  })

  it('keeps save button disabled on an unchanged note and enables it after an edit', async () => {
    mockRoute.params = { id: 'note-processed-1' }
    vi.mocked(notesApi.get).mockResolvedValueOnce({
      id: 'note-processed-1',
      courseId: 1,
      title: 'Processed Note',
      content: 'Original note content',
      entryDate: '2026-10-13',
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
      lastProcessedAt: '2026-10-13T00:00:00Z',
    })

    const wrapper = mount(NoteEditor)
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    expect(saveButton.attributes('disabled')).toBeDefined()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Original note content with additions</p>')
    await flushPromises()

    expect(saveButton.attributes('disabled')).toBeUndefined()
  })

  it('keeps save button disabled on a seeded new note and enables it after an edit', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
        initialContent: 'Seeded content',
      },
    })
    await flushPromises()

    const saveButton = wrapper.find('[data-testid="save-button"]')
    expect(saveButton.attributes('disabled')).toBeDefined()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Seeded content edited</p>')
    await flushPromises()

    expect(saveButton.attributes('disabled')).toBeUndefined()
  })

  it('defaults to h-dvh class when visualViewport is not present', async () => {
    const wrapper = mount(NoteEditor)
    await flushPromises()

    const container = wrapper.find('[data-testid="note-editor-container"]')
    expect(container.classes()).toContain('h-dvh')
    expect(container.attributes('style')).toBeUndefined()
  })

  it('adjusts container height dynamically to visualViewport.height on resize', async () => {
    const listeners: Record<string, EventListener[]> = {}
    const mockVisualViewport = {
      height: 480,
      width: 375,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      scale: 1,
      addEventListener: vi.fn<(event: string, handler: EventListener) => void>(
        (event: string, handler: EventListener) => {
          listeners[event] = listeners[event] || []
          listeners[event].push(handler)
        },
      ),
      removeEventListener: vi.fn<(event: string, handler: EventListener) => void>(
        (event: string, handler: EventListener) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((h) => h !== handler)
          }
        },
      ),
      dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
    }

    // jsdom has no visualViewport. The stub records listeners so the test can fire a resize.
    vi.stubGlobal('visualViewport', mockVisualViewport)

    const wrapper = mount(NoteEditor)
    await flushPromises()

    const container = wrapper.find('[data-testid="note-editor-container"]')
    expect(container.classes()).not.toContain('h-dvh')
    expect(container.attributes('style')).toContain('height: 480px;')

    // Simulate keyboard expansion reducing visible height
    mockVisualViewport.height = 320
    listeners['resize']?.forEach((cb) => cb(new Event('resize')))
    await flushPromises()

    expect(container.attributes('style')).toContain('height: 320px;')

    wrapper.unmount()
    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    )

    vi.unstubAllGlobals()
  })

  it('does not show unsaved changes dialog when leaving an unchanged loaded note', async () => {
    mockRoute.params = { id: 'note-uuid-existing-unchanged' }
    const existingNote: NoteResponse = {
      id: 'note-uuid-existing-unchanged',
      courseId: 2,
      title: 'Calculus Derivatives',
      content: '# Derivatives Overview\n\nChain rule notes',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(existingNote)

    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await flushPromises()

    const backButton = wrapper.find('[data-testid="detail-back"]')
    await backButton.trigger('click')
    await flushPromises()

    const unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).toBeNull()
    expect(mockRouter.back).toHaveBeenCalled()

    expect(beforeRouteLeaveCallback).toBeDefined()
    const confirmSpy = vi.spyOn(window, 'confirm')
    expect(beforeRouteLeaveCallback!()).toBe(true)
    expect(confirmSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('does not trigger unsaved changes dialog when focusing inputs or reselecting identical values', async () => {
    mockRoute.params = { id: 'note-uuid-existing-focus' }
    const existingNote: NoteResponse = {
      id: 'note-uuid-existing-focus',
      courseId: 2,
      title: 'Chemistry Lab',
      content: 'Observation notes',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(existingNote)

    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await flushPromises()

    const titleInput = wrapper.find<HTMLInputElement>('[data-testid="title-input"]')
    await titleInput.trigger('focus')
    await titleInput.trigger('click')

    const picker = wrapper.findComponent(CoursePickerDialog)
    await picker.vm.$emit('select', 2)
    await flushPromises()

    const backButton = wrapper.find('[data-testid="detail-back"]')
    await backButton.trigger('click')
    await flushPromises()

    const unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).toBeNull()
    expect(mockRouter.back).toHaveBeenCalled()

    wrapper.unmount()
  })

  it('shows unsaved changes dialog when modified and avoids dialog when changes are reverted', async () => {
    mockRoute.params = { id: 'note-uuid-existing-revert' }
    const existingNote: NoteResponse = {
      id: 'note-uuid-existing-revert',
      courseId: 2,
      title: 'Calculus Derivatives',
      content: '# Derivatives Overview\n\nChain rule notes',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(existingNote)

    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await flushPromises()

    const titleInput = wrapper.find<HTMLInputElement>('[data-testid="title-input"]')
    await titleInput.setValue('Calculus Derivatives with Integrals')
    await flushPromises()

    const backButton = wrapper.find('[data-testid="detail-back"]')
    await backButton.trigger('click')
    await flushPromises()

    let unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).not.toBeNull()

    const cancelButton = document.body.querySelector(
      '[data-testid="cancel-discard-button"]',
    ) as HTMLButtonElement
    cancelButton.click()
    await flushPromises()

    mockRouter.back.mockClear()

    await titleInput.setValue('Calculus Derivatives')
    await flushPromises()

    await backButton.trigger('click')
    await flushPromises()

    unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).toBeNull()
    expect(mockRouter.back).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('clears unsaved changes when course selection and editor content are reverted', async () => {
    mockRoute.params = { id: 'note-uuid-existing-content-revert' }
    const existingNote: NoteResponse = {
      id: 'note-uuid-existing-content-revert',
      courseId: 1,
      title: 'Physics Mechanics',
      content: 'Original physics body',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(existingNote)

    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Modified physics body</p>')
    await flushPromises()

    const backButton = wrapper.find('[data-testid="detail-back"]')
    await backButton.trigger('click')
    await flushPromises()

    let unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).not.toBeNull()

    const cancelButton = document.body.querySelector(
      '[data-testid="cancel-discard-button"]',
    ) as HTMLButtonElement
    cancelButton.click()
    await flushPromises()

    mockRouter.back.mockClear()

    await tiptap.vm.$emit('update:modelValue', '<p>Original physics body</p>')
    await flushPromises()

    await backButton.trigger('click')
    await flushPromises()

    unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).toBeNull()
    expect(mockRouter.back).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('does not show unsaved dialog when user restores new note fields to empty', async () => {
    const wrapper = mount(NoteEditor, {
      props: {
        initialCourseId: 1,
      },
      attachTo: document.body,
    })
    await flushPromises()

    const titleInput = wrapper.find<HTMLInputElement>('[data-testid="title-input"]')
    await titleInput.setValue('Transient Title')
    await flushPromises()

    const backButton = wrapper.find('[data-testid="detail-back"]')
    await backButton.trigger('click')
    await flushPromises()

    let unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).not.toBeNull()

    const cancelButton = document.body.querySelector(
      '[data-testid="cancel-discard-button"]',
    ) as HTMLButtonElement
    cancelButton.click()
    await flushPromises()

    mockRouter.back.mockClear()

    await titleInput.setValue('')
    await flushPromises()

    await backButton.trigger('click')
    await flushPromises()

    unsavedDialog = document.body.querySelector('[data-testid="unsaved-changes-dialog"]')
    expect(unsavedDialog).toBeNull()
    expect(mockRouter.back).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('loads the note through the noteId prop in embedded mode', async () => {
    const existingNote: NoteResponse = {
      id: 'note-embedded-1',
      courseId: 1,
      title: 'Embedded Note',
      content: 'Embedded content',
      entryDate: '2026-10-12',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.mocked(notesApi.get).mockResolvedValueOnce(existingNote)

    const wrapper = mount(NoteEditor, {
      props: { embedded: true, noteId: 'note-embedded-1' },
    })
    await flushPromises()

    expect(notesApi.get).toHaveBeenCalledWith('note-embedded-1')
    expect(wrapper.find<HTMLInputElement>('[data-testid="title-input"]').element.value).toBe(
      'Embedded Note',
    )
    wrapper.unmount()
  })

  it('emits close instead of router.back on Back in embedded mode', async () => {
    const wrapper = mount(NoteEditor, {
      props: { embedded: true, noteId: null },
    })
    await flushPromises()

    await wrapper.find('[data-testid="detail-back"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(mockRouter.back).not.toHaveBeenCalled()
    expect(beforeRouteLeaveCallback).toBeNull()
    wrapper.unmount()
  })

  it('emits saved with the note id then close after a successful embedded save', async () => {
    vi.mocked(notesApi.create).mockResolvedValueOnce({
      id: 'saved-embedded-1',
      courseId: 1,
      title: 'Embedded Save',
      content: 'Valid embedded content edited',
      entryDate: '2026-10-13',
      createdAt: '2026-10-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
    })

    const wrapper = mount(NoteEditor, {
      props: {
        embedded: true,
        noteId: null,
        initialCourseId: 1,
        initialTitle: 'Embedded Save',
        initialContent: 'Valid embedded content',
      },
    })
    await flushPromises()

    const tiptap = wrapper.findComponent(TiptapEditor)
    await tiptap.vm.$emit('update:modelValue', '<p>Valid embedded content edited</p>')
    await flushPromises()

    await wrapper.find('[data-testid="save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('saved')).toEqual([['saved-embedded-1']])
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(mockRouter.back).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('applies opacity-0 to the metadata section when showContent is false', async () => {
    const wrapper = mount(NoteEditor, {
      props: { embedded: true, showContent: false },
    })
    await flushPromises()

    expect(wrapper.find('section').classes()).toContain('opacity-0')
    wrapper.unmount()
  })

  const deletedSummary: NoteSummaryResponse = {
    id: 'note-del-1',
    courseId: 1,
    title: 'Note To Delete',
    preview: 'Removable content',
    truncated: false,
    contentLength: 17,
    entryDate: '2026-10-13',
    createdAt: '2026-10-13T00:00:00Z',
    updatedAt: '2026-10-13T00:00:00Z',
  }

  const deletedNote: NoteResponse = {
    ...deletedSummary,
    content: 'Removable content',
  }

  async function seedAndMountDeletable() {
    useNotes().resetNotes()
    vi.mocked(notesApi.list).mockResolvedValueOnce([deletedSummary])
    await useNotes().loadNotes()
    vi.mocked(notesApi.get).mockResolvedValueOnce(deletedNote)

    const wrapper = mount(NoteEditor, {
      props: { embedded: true, noteId: 'note-del-1' },
      attachTo: document.body,
    })
    await flushPromises()

    await wrapper.find('[data-testid="note-actions-trigger"]').trigger('click')
    await flushPromises()

    const action = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="delete-note-action"]',
    )
    expect(action).not.toBeNull()
    action!.click()
    await flushPromises()

    return wrapper
  }

  it('hides the actions menu on a new note and shows it in edit mode', async () => {
    const newWrapper = mount(NoteEditor)
    await flushPromises()
    expect(newWrapper.find('[data-testid="note-actions-trigger"]').exists()).toBe(false)
    newWrapper.unmount()

    vi.mocked(notesApi.get).mockResolvedValueOnce(deletedNote)
    const editWrapper = mount(NoteEditor, {
      props: { embedded: true, noteId: 'note-del-1' },
    })
    await flushPromises()
    expect(editWrapper.find('[data-testid="note-actions-trigger"]').exists()).toBe(true)
    editWrapper.unmount()
  })

  it('stages the delete on confirm and restores the note when the toast dismisses', async () => {
    const wrapper = await seedAndMountDeletable()

    const dialog = document.body.querySelector('[data-testid="delete-note-dialog"]')
    expect(dialog).not.toBeNull()

    const confirm = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="confirm-delete-button"]',
    )
    expect(confirm).not.toBeNull()
    confirm!.click()
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(useNotes().notes.value.some((n) => n.id === 'note-del-1')).toBe(false)
    expect(notesApi.delete).not.toHaveBeenCalled()

    const toast = useToasts().toasts.value.find((t) => t.title === 'Note deleted')
    expect(toast).toBeDefined()
    useToasts().dismissToast(toast!.id)
    expect(useNotes().notes.value[0]?.id).toBe('note-del-1')
    expect(notesApi.delete).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('commits the delete when the undo toast expires', async () => {
    const wrapper = await seedAndMountDeletable()

    vi.useFakeTimers()
    const confirm = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="confirm-delete-button"]',
    )!
    confirm.click()
    await flushPromises()

    vi.advanceTimersByTime(4000)
    await flushPromises()
    vi.useRealTimers()

    expect(notesApi.delete).toHaveBeenCalledWith('note-del-1')
    expect(useNotes().notes.value.some((n) => n.id === 'note-del-1')).toBe(false)

    wrapper.unmount()
  })
})
