import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactUsPage() {
  return (
    <div className="py-12">
      <div className="page-container max-w-4xl">
        <div className="card relative overflow-hidden p-8 md:p-10 border border-slate-100/80 dark:border-slate-800/80">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-500 to-indigo-500" />
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl opacity-70" />
          <p className="text-sm uppercase tracking-[0.2em] text-brand-500 font-semibold mb-3">Contact us</p>
          <h1 className="font-display text-display-2xl md:text-display-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Connect with the CareerBridge team</h1>
          <p className="text-slate-500 max-w-2xl mb-8">
            If you need help with your account, hiring workflow, or platform access, reach out using the details below.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-5 flex items-start gap-3 border border-slate-100/80 dark:border-slate-800/80">
              <Mail className="w-5 h-5 text-brand-500 mt-1" />
              <div>
                <p className="font-semibold mb-1">Email</p>
                <p className="text-sm text-slate-500">support@careerbridge.com</p>
              </div>
            </div>
            <div className="card p-5 flex items-start gap-3 border border-slate-100/80 dark:border-slate-800/80">
              <Phone className="w-5 h-5 text-brand-500 mt-1" />
              <div>
                <p className="font-semibold mb-1">Phone</p>
                <p className="text-sm text-slate-500">+1 (555) 012-3456</p>
              </div>
            </div>
            <div className="card p-5 flex items-start gap-3 border border-slate-100/80 dark:border-slate-800/80">
              <MapPin className="w-5 h-5 text-brand-500 mt-1" />
              <div>
                <p className="font-semibold mb-1">Office</p>
                <p className="text-sm text-slate-500">Remote-first support team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}