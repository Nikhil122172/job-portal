import { Link } from 'react-router-dom'
import { Briefcase, Github, Twitter, Linkedin } from 'lucide-react'
import { useAppSelector } from '../shared/hooks/redux'

export default function Footer() {
  const { user } = useAppSelector((state) => state.auth)
  
  // Normalize role to uppercase
  const userRole = user?.role?.toUpperCase()
  
  // Determine if user is authenticated and their role
  const isJobSeeker = userRole === 'JOB_SEEKER'
  const isRecruiter = userRole === 'RECRUITER'

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-400 mt-auto border-t border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_26%)]" />
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg font-semibold text-white">
                Career<span className="text-brand-400">Bridge</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Your bridge to career success. Connect with top companies and build the future you deserve.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[
                { Icon: Github, label: 'GitHub' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
              ].map(({ Icon, label }) => (
                <button key={label} title={label} aria-label={label} className="p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 text-slate-300 hover:text-white border border-white/10 transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Role-based footer links */}
          {isJobSeeker ? (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">My Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link to="/applications" className="hover:text-white transition-colors">My Applications</Link></li>
                <li><Link to="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
              </ul>
            </div>
          ) : isRecruiter ? (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Recruitment</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/recruiter/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link to="/recruiter/jobs" className="hover:text-white transition-colors">Manage Jobs</Link></li>
                <li><Link to="/recruiter/applications" className="hover:text-white transition-colors">View Applications</Link></li>
              </ul>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Get Started</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p>© 2024 CareerBridge. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
