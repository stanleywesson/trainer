import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { useCalendarStore } from '@/stores/calendar'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/workout/:id',
    name: 'workoutDetail',
    component: () => import('@/views/WorkoutDetailView.vue'),
  },
  {
    path: '/workout/:id/session',
    name: 'workout',
    component: () => import('@/views/WorkoutView.vue'),
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: () => import('@/views/OnboardingView.vue'),
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/views/CalendarView.vue'),
  },
  {
    path: '/run/:entryId',
    name: 'run',
    component: () => import('@/views/RunView.vue'),
  },
  {
    path: '/workout/:id/circuit',
    name: 'circuit',
    component: () => import('@/views/CircuitView.vue'),
  },
  {
    path: '/workout/:id/rounds',
    name: 'rounds',
    component: () => import('@/views/RoundsView.vue'),
  },
  {
    path: '/summary/:id',
    name: 'summary',
    component: () => import('@/views/SummaryView.vue'),
  },
  {
    path: '/exercises',
    name: 'exercises',
    component: () => import('@/views/ExercisesView.vue'),
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
  },
  {
    path: '/history/exercise/:exerciseId',
    name: 'exerciseHistory',
    component: () => import('@/views/ExerciseHistoryView.vue'),
  },
  {
    path: '/history/:id',
    name: 'historyDetail',
    component: () => import('@/views/HistoryDetailView.vue'),
  },],
})

// First launch (no plan chosen yet): send to plan setup
router.beforeEach(to => {
  if (to.name !== 'welcome' && useCalendarStore().needsSetup) return { name: 'welcome' }
})

export default router
