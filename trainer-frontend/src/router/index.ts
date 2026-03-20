import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/workout/:id',
    name: 'workout',
    component: () => import('@/views/WorkoutView.vue'),
  },
  {
    path: '/summary/:id',
    name: 'summary',
    component: () => import('@/views/SummaryView.vue'),
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
  },
  {
    path: '/history/:id',
    name: 'historyDetail',
    component: () => import('@/views/HistoryDetailView.vue'),
  },],
})

export default router
