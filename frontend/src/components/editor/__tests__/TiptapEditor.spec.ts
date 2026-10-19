import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TiptapEditor from '../TiptapEditor.vue'
import { imagesApi } from '@/api/images'
import type { ImageUploadResponse } from '@/types/api'

// Mock the upload API so that the tests send no HTTP requests.
vi.mock('@/api/images', () => ({
  imagesApi: {
    upload: vi.fn<(file: File | FormData) => Promise<ImageUploadResponse>>(),
  },
}))

describe('TiptapEditor', () => {
  it('renders editor and toolbar', () => {
    const wrapper = mount(TiptapEditor, {
      props: {
        modelValue: '<p>Initial test note</p>',
      },
    })

    expect(wrapper.find('[role="toolbar"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'EditorContent' }).exists()).toBe(true)
  })

  it('handles image upload and inserts into editor', async () => {
    const mockUploadResponse: ImageUploadResponse = {
      id: 'img-123',
      url: '/api/images/img-123',
      contentType: 'image/png',
      size: 1024,
      createdAt: '2026-10-13T00:00:00Z',
    }
    vi.mocked(imagesApi.upload).mockResolvedValueOnce(mockUploadResponse)

    const wrapper = mount(TiptapEditor, {
      props: {
        modelValue: '<p>Initial text</p>',
      },
    })

    const toolbar = wrapper.findComponent({ name: 'TiptapToolbar' })
    const testFile = new File(['content'], 'test.png', { type: 'image/png' })

    // Emit from the toolbar directly because jsdom cannot open a native file picker.
    await toolbar.vm.$emit('upload-image', testFile)
    await flushPromises()

    expect(imagesApi.upload).toHaveBeenCalledWith(testFile)
  })

  it('emits upload-error and shows error banner when imagesApi.upload fails', async () => {
    vi.mocked(imagesApi.upload).mockRejectedValueOnce(new Error('Network upload error'))

    const wrapper = mount(TiptapEditor, {
      props: {
        modelValue: '<p>Initial text</p>',
      },
    })

    const toolbar = wrapper.findComponent({ name: 'TiptapToolbar' })
    const testFile = new File(['content'], 'test.png', { type: 'image/png' })

    await toolbar.vm.$emit('upload-image', testFile)
    await flushPromises()

    const emitted = wrapper.emitted('upload-error')
    expect(emitted).toBeDefined()
    const firstError = emitted?.[0]?.[0] as Error
    expect(firstError).toBeInstanceOf(Error)
    expect(firstError.message).toContain('Network upload error')

    // Error banner should be rendered
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Network upload error')

    // Dismissing the error banner
    const dismissButton = alert.find('button')
    await dismissButton.trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('displays error banner when errorMessage prop is provided', () => {
    const wrapper = mount(TiptapEditor, {
      props: {
        errorMessage: 'Custom upload error message',
      },
    })

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Custom upload error message')
  })

  it('does not enable undo when external content loads into the editor', async () => {
    const wrapper = mount(TiptapEditor, {
      props: {
        modelValue: '',
      },
    })
    await flushPromises()

    const toolbar = wrapper.findComponent({ name: 'TiptapToolbar' })
    const editor = toolbar.props('editor') as {
      can: () => { undo: () => boolean }
      getHTML: () => string
    }

    expect(editor.can().undo()).toBe(false)

    await wrapper.setProps({ modelValue: '<p>Loaded from server</p>' })
    await flushPromises()

    expect(editor.getHTML()).toContain('Loaded from server')
    expect(editor.can().undo()).toBe(false)
  })

  it('renders a scrollable text container and pinned bottom toolbar', () => {
    const wrapper = mount(TiptapEditor, {
      props: {
        modelValue: '<p>Scrollable test note</p>',
      },
    })

    const scrollContainer = wrapper.find('[data-testid="editor-scroll-container"]')
    expect(scrollContainer.exists()).toBe(true)
    expect(scrollContainer.classes()).toContain('overflow-y-auto')
    expect(scrollContainer.classes()).toContain('flex-1')
    expect(scrollContainer.classes()).toContain('min-h-0')

    const toolbar = wrapper.findComponent({ name: 'TiptapToolbar' })
    expect(toolbar.exists()).toBe(true)
    expect(toolbar.classes()).toContain('shrink-0')
    expect(toolbar.classes()).toContain('mt-auto')
    expect(toolbar.classes()).toContain('w-full')
  })
})
