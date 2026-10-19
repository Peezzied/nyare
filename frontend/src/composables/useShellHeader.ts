import {
  inject,
  markRaw,
  provide,
  reactive,
  type Component,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue'

/**
 * Per-view configuration for the shared AppShell top bar.
 * `left` and `right` are components (plain render functions work too)
 * rendered inside the header's side regions.
 */
export interface ShellHeaderConfig {
  title: MaybeRefOrGetter<string>
  /** Replaces the default account-menu button. */
  left?: Component
  /** Replaces the centered title. */
  center?: Component
  /** Replaces the default spacer. */
  right?: Component
}

export const shellHeaderKey: InjectionKey<ShellHeaderConfig> = Symbol('shellHeader')

/** Creates and provides the header state. AppShell calls this once. */
export function provideShellHeader(): ShellHeaderConfig {
  const header = reactive<ShellHeaderConfig>({ title: '' })
  provide(shellHeaderKey, header)
  return header
}

/**
 * Sets the shell header for the current view. No-ops when the view
 * renders outside AppShell (tests, stories), so views stay mountable alone.
 */
export function useShellHeader(config: ShellHeaderConfig): void {
  const header = inject(shellHeaderKey, undefined)
  if (!header) return
  header.title = config.title
  header.left = config.left === undefined ? undefined : markRaw(config.left)
  header.center = config.center === undefined ? undefined : markRaw(config.center)
  header.right = config.right === undefined ? undefined : markRaw(config.right)
}
