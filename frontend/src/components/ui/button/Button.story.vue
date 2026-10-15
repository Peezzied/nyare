<script setup lang="ts">
import { Button } from '.'
</script>

<template>
  <Story title="UI/Button">
    <Variant title="Default">
      <div class="p-4">
        <Button>Click me</Button>
      </div>
    </Variant>

    <Variant title="Secondary">
      <div class="p-4">
        <Button variant="secondary">Secondary</Button>
      </div>
    </Variant>

    <Variant title="Destructive">
      <div class="p-4">
        <Button variant="destructive">Delete</Button>
      </div>
    </Variant>

    <Variant title="Outline">
      <div class="p-4">
        <Button variant="outline">Outline</Button>
      </div>
    </Variant>

    <Variant title="Ghost">
      <div class="p-4">
        <Button variant="ghost">Ghost</Button>
      </div>
    </Variant>

    <Variant title="Link">
      <div class="p-4">
        <Button variant="link">Link</Button>
      </div>
    </Variant>

    <Variant title="Sizes">
      <div class="flex items-center gap-3 p-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    </Variant>

    <Variant title="Disabled">
      <div class="p-4">
        <Button disabled>Disabled</Button>
      </div>
    </Variant>
  </Story>
</template>
