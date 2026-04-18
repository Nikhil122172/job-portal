import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md animate-slide-up">
        <div className="font-display text-display-4xl font-bold text-brand-100 dark:text-brand-300 mb-2 select-none">404</div>
        <h1 className="font-display text-display-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Page not found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-primary"><Home className="w-4 h-4" /> Go Home</Link>
          <Link to="/jobs" className="btn-secondary"><Search className="w-4 h-4" /> Browse Jobs</Link>
        </div>
      </div>
    </div>
  )
}
