import '../harness/clientSetup'
import { describe, beforeAll, it, expect } from 'vitest'
import { aiEnabled, assertBackendReachable } from '../harness/clientSetup'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  authApi,
  coursesApi,
  schedulesApi,
  imagesApi,
  notesApi,
  tasksApi,
  academicEventsApi,
} from '@/api'
import { usePlannerStatus } from '@/composables/usePlannerStatus'
import { useProcess } from '@/composables/useProcess'
import { useTasks } from '@/composables/useTasks'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { useStudyPlan } from '@/composables/useStudyPlan'
import { getPlanCategory } from '@/utils/planCategory'
import { plannerScenario } from '../fixtures/plannerScenario'

describe('User Story 2: Journal to Planner', () => {
  const createdCourses: Awaited<ReturnType<typeof coursesApi.create>>[] = []
  let noticeImage: Awaited<ReturnType<typeof imagesApi.upload>>
  let slideImage: Awaited<ReturnType<typeof imagesApi.upload>>

  beforeAll(async () => {
    await assertBackendReachable()

    const username = `flow_journal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    await authApi.register({ username })
    await authApi.login({ username })

    for (const c of plannerScenario.courses) {
      const created = await coursesApi.create(c)
      createdCourses.push(created)
    }

    for (const s of plannerScenario.schedules) {
      const course = createdCourses[s.courseIndex]
      if (!course) continue
      await schedulesApi.create({
        courseId: course.id,
        day: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })
    }

    const assetsDir = path.resolve(__dirname, '../fixtures/assets')
    const noticeBuffer = fs.readFileSync(path.join(assetsDir, 'notice.png'))
    const slideBuffer = fs.readFileSync(path.join(assetsDir, 'slide.png'))

    const noticeFile = new File([noticeBuffer], 'notice.png', { type: 'image/png' })
    const slideFile = new File([slideBuffer], 'slide.png', { type: 'image/png' })

    noticeImage = await imagesApi.upload(noticeFile)
    slideImage = await imagesApi.upload(slideFile)

    const today = new Date().toISOString().split('T')[0]

    for (const n of plannerScenario.notes) {
      let text = n.textTemplate
      text = text.replace('{{noticeUrl}}', `/api/images/${noticeImage.id}`)
      text = text.replace('{{slideUrl}}', `/api/images/${slideImage.id}`)

      const course = createdCourses[n.courseIndex]
      if (!course) continue

      await notesApi.create({
        courseId: course.id,
        entryDate: today,
        content: text,
      })
    }

    const taskCourse = createdCourses[plannerScenario.existingTask.courseIndex]
    if (taskCourse) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + plannerScenario.existingTask.dayOffset)
      const scheduledDate = dueDate.toISOString().split('T')[0]

      await tasksApi.create({
        courseId: taskCourse.id,
        title: plannerScenario.existingTask.title,
        scheduledDate,
        status: plannerScenario.existingTask.status,
      })
    }

    const eventCourse = createdCourses[plannerScenario.existingEvent.courseIndex]
    if (eventCourse) {
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + plannerScenario.existingEvent.dayOffset)
      const deadline = eventDate.toISOString().slice(0, 19)

      await academicEventsApi.create({
        courseId: eventCourse.id,
        title: plannerScenario.existingEvent.title,
        description: plannerScenario.existingEvent.description,
        deadline,
      })
    }
  })

  describe('T011: Planner Status Without AI', () => {
    it('shows pending notes and can process', async () => {
      await usePlannerStatus().refresh()

      expect(usePlannerStatus().pendingCount.value).toBeGreaterThan(0)
      expect(usePlannerStatus().canProcess.value).toBe(true)
    })
  })

  describe.skipIf(!aiEnabled)('AI Study Planning Flow', () => {
    it('T012: processes notes, generates tasks and events, and shows study plan', async () => {
      const process = useProcess({
        onDone: async (summary) => {
          const courseIds = summary.affectedCourseIds ?? []
          await Promise.all([
            useTasks().refetchForCourses(courseIds),
            useAcademicEvents().refetchForCourses(courseIds),
            usePlannerStatus().refresh(),
          ])
        },
      })

      const summary = await process.start()

      // The done handler refetches affected courses only; load the full list so
      // tasks in unaffected courses (the pre-existing task) join the plan view.
      await useTasks().loadTasks(undefined, true)

      expect(summary).not.toBeNull()
      expect(summary!.affectedCourseIds).toBeDefined()
      expect(usePlannerStatus().pendingCount.value).toBe(0)

      const plan = useStudyPlan()

      expect(useTasks().tasks.value.length).toBeGreaterThan(0)

      for (const task of useTasks().tasks.value) {
        const category = getPlanCategory(task)
        expect(['SCHEDULED', 'LATER', 'BACKLOG']).toContain(category)
      }

      expect(plan.scheduledCount.value + plan.laterCount.value + plan.backlogCount.value).toBe(
        useTasks().tasks.value.length,
      )

      const originalTask = useTasks().tasks.value.find(
        (t) => t.title === 'Review MIPS instruction encoding',
      )
      expect(originalTask).toBeDefined()
    })
  })
})
