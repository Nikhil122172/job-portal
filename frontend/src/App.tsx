import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { ProtectedRoute, PublicOnlyRoute } from './core/guards/RouteGuards'
import { PageSpinner } from './shared/components/ui'

// Lazy-loaded pages
const HomePage            = lazy(() => import('./features/jobs/HomePage'))
const JobsPage            = lazy(() => import('./features/jobs/JobsPage'))
const JobDetailPage       = lazy(() => import('./features/jobs/JobDetailPage'))
const LoginPage           = lazy(() => import('./features/auth/LoginPage'))
const RegisterPage        = lazy(() => import('./features/auth/RegisterPage'))
const ApplicationsPage    = lazy(() => import('./features/applications/ApplicationsPage'))
const RecruiterJobsPage   = lazy(() => import('./features/jobs/RecruiterJobsPage'))
const PostJobPage         = lazy(() => import('./features/jobs/PostJobPage'))
const RecruiterAppsPage   = lazy(() => import('./features/applications/RecruiterApplicationsPage'))
const ProfilePage         = lazy(() => import('./features/profile/ProfilePage'))
const AdminDashboardPage    = lazy(() => import('./features/dashboard/AdminDashboardPage'))
const RecruiterDashboardPage = lazy(() => import('./features/dashboard/RecruiterDashboardPage'))
const JobSeekerDashboardPage = lazy(() => import('./features/dashboard/JobSeekerDashboardPage'))
const AboutUsPage         = lazy(() => import('./features/info/AboutUsPage'))
const ContactUsPage       = lazy(() => import('./features/info/ContactUsPage'))
const AdminPage           = lazy(() => import('./features/admin/AdminPage'))
const NotFoundPage        = lazy(() => import('./features/NotFoundPage'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSpinner />}>{children}</Suspense>
}

export default function App() {
  return (
    <SuspenseWrapper>
      <Routes>
        {/* Auth routes (public only) */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        {/* Main layout routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />

          {/* Job seeker */}
          <Route path="/applications" element={
            <ProtectedRoute roles={['JOB_SEEKER']}>
              <ApplicationsPage />
            </ProtectedRoute>
          } />

          {/* Recruiter */}
          <Route path="/recruiter/jobs" element={
            <ProtectedRoute roles={['RECRUITER']}>
              <RecruiterJobsPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/post-job" element={
            <ProtectedRoute roles={['RECRUITER']}>
              <PostJobPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/jobs/:id/edit" element={
            <ProtectedRoute roles={['RECRUITER']}>
              <PostJobPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/applications" element={
            <ProtectedRoute roles={['RECRUITER']}>
              <RecruiterAppsPage />
            </ProtectedRoute>
          } />

          {/* Shared protected */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/recruiter" element={
            <ProtectedRoute roles={['RECRUITER']}>
              <RecruiterDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/job-seeker" element={
            <ProtectedRoute roles={['JOB_SEEKER']}>
              <JobSeekerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminPage />
            </ProtectedRoute>
          } />

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </SuspenseWrapper>
  )
}
