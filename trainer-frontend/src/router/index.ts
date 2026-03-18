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
  },],
})

export default router
