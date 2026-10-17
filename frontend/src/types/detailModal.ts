export interface TapOriginRect {
  top: number
  left: number
  width: number
  height: number
}

export interface CourseBlockDetailState {
  courseId: number | string
  courseName: string
  colorDot: string
  timeWindow: string
  tasksTarget: string
  notesTarget: string
}

export interface NonCourseBlockDetailState {
  id: number | string
  title: string
  itemType: 'task' | 'academic-event'
  linkedNote: string | null
}

export type DetailModalKind = 'course' | 'other'

export type AnimationPhase = 'idle' | 'expanding' | 'settled' | 'collapsing'

export interface ActiveModalState {
  isOpen: boolean
  originRect: TapOriginRect | null
  kind: DetailModalKind | null
  animationPhase: AnimationPhase
  payload: CourseBlockDetailState | NonCourseBlockDetailState | null
}
