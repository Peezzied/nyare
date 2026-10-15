<script setup lang="ts">
import { ref } from 'vue'
import TiptapEditor from './TiptapEditor.vue'

const sampleContent = ref(
  '<h2>Week 4: Data Structures</h2><p>Notes on <strong>Binary Search Trees</strong> and <em>balanced traversal</em>.</p><blockquote>Keep operations at logarithmic time complexity.</blockquote><ul><li>In-order traversal</li><li>Pre-order traversal</li></ul>',
)

const emptyContent = ref('')

const imageDemoContent = ref(
  '<h3>Computer Science Lecture</h3><p>Embedded diagram example:</p><img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500" alt="Laptop display" class="rounded-lg shadow-xs" />',
)

const dynamicContent = ref('<p>Type your notes here...</p>')
const dynamicError = ref('Failed to upload image: Server connection timed out (backend offline)')
</script>

<template>
  <Story title="components/editor/TiptapEditor">
    <Variant title="Default Rich Text">
      <div class="mx-auto max-w-2xl p-6">
        <TiptapEditor v-model="sampleContent" />
      </div>
    </Variant>

    <Variant title="Empty Note">
      <div class="mx-auto max-w-2xl p-6">
        <TiptapEditor v-model="emptyContent" placeholder="Enter notes here..." />
      </div>
    </Variant>

    <Variant title="With Embedded Visuals">
      <div class="mx-auto max-w-2xl p-6">
        <TiptapEditor v-model="imageDemoContent" />
      </div>
    </Variant>

    <Variant title="Upload Network Error Notice">
      <div class="mx-auto max-w-2xl p-6">
        <TiptapEditor v-model="dynamicContent" :error-message="dynamicError" />
      </div>
    </Variant>

    <Variant title="File Size Limit Notice">
      <div class="mx-auto max-w-2xl p-6">
        <TiptapEditor v-model="sampleContent" error-message="Image size must not exceed 10 MB" />
      </div>
    </Variant>

    <Variant title="Read Only">
      <div class="mx-auto max-w-2xl p-6">
        <TiptapEditor v-model="sampleContent" :editable="false" />
      </div>
    </Variant>
  </Story>
</template>
