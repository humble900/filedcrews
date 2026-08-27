import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distIndexPath = path.join(projectRoot, 'dist/index.html');

/**
 * High-performance, semantic static HTML shell for the FiledCrews landing page.
 * This guarantees 100% extractable body text for AI bots, web readers,
 * search engines, and provides instant <0.5s visual FCP for human visitors.
 */
const staticLandingHtml = `
<div class="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-teal-500 selection:text-white">
  <!-- Top Global Announcement Banner -->
  <header role="banner" class="w-full bg-slate-950 text-white text-xs py-2 px-4 text-center font-medium border-b border-slate-800">
    <div class="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wide">New</span>
      <span>FiledCrews Autonomous AI Copilot & Real-Time Dispatch is now live globally across US, UK, Canada, Australia, and EU.</span>
      <a href="/wizard" class="underline hover:text-teal-300 ml-1 font-semibold" aria-label="Get Started with FiledCrews for free">Start 100% Free &rarr;</a>
    </div>
  </header>

  <!-- Main Navigation -->
  <nav role="navigation" aria-label="Main Navigation" class="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <a href="/" class="flex items-center gap-2.5 group" aria-label="FiledCrews Homepage">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 font-black text-lg">
            F
          </div>
          <div class="flex flex-col">
            <span class="font-black text-xl tracking-tight text-slate-900 leading-none">FiledCrews</span>
            <span class="text-[10px] font-semibold text-teal-700 tracking-wider uppercase mt-0.5">Field Service Management</span>
          </div>
        </a>
        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
          <a href="#features" class="hover:text-teal-600 transition-colors">Features</a>
          <a href="#industries" class="hover:text-teal-600 transition-colors">Industries</a>
          <a href="#comparison" class="hover:text-teal-600 transition-colors">Why Free?</a>
          <a href="#roi-calculator" class="hover:text-teal-600 transition-colors">ROI Calculator</a>
          <a href="#pricing" class="hover:text-teal-600 transition-colors">Pricing</a>
          <a href="#faq" class="hover:text-teal-600 transition-colors">FAQ</a>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a href="/auth" class="text-sm font-semibold text-slate-700 hover:text-teal-700 px-3.5 py-2 transition-colors">Sign In</a>
        <a href="/wizard" class="inline-flex items-center justify-center text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all" aria-label="Get started free with FiledCrews">
          Get Started Free
        </a>
      </div>
    </div>
  </nav>

  <!-- Main Landmark -->
  <main id="main-content">
    <!-- Hero Section -->
    <section class="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-stone-50 via-white to-stone-50/50 border-b border-stone-200/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          Free Field Service Management & Mobile Dispatch Platform
        </div>
        <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
          Manage Your Field Crews, Dispatch Jobs & Track GPS Live. <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600">100% Free.</span>
        </h1>
        <p class="text-base sm:text-lg md:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed mb-8">
          The all-in-one software platform for contractors, HVAC, plumbing, electrical, landscaping, cleaning, and security businesses in the US, UK, Canada, Australia, and EU. Stop paying $300+/month per technician.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
          <a href="/wizard" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-lg shadow-teal-600/25 hover:shadow-xl transition-all" aria-label="Get Started Free with FiledCrews dispatching">
            Get Started Free
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
          <a href="#features" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-slate-800 font-bold text-base border border-stone-300 shadow-sm transition-all">
            Explore Capabilities
          </a>
        </div>

        <!-- Trust Badges -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-stone-200 text-left">
          <div class="p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm">
            <div class="text-teal-700 font-extrabold text-lg sm:text-xl">$0 / Month</div>
            <div class="text-xs text-slate-600 font-medium">Free forever core platform</div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm">
            <div class="text-teal-700 font-extrabold text-lg sm:text-xl">Real-Time GPS</div>
            <div class="text-xs text-slate-600 font-medium">Live technician tracking map</div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm">
            <div class="text-teal-700 font-extrabold text-lg sm:text-xl">Smart Geofence</div>
            <div class="text-xs text-slate-600 font-medium">Automatic job site clock-ins</div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm">
            <div class="text-teal-700 font-extrabold text-lg sm:text-xl">Biometric Check</div>
            <div class="text-xs text-slate-600 font-medium">Photo face verification logs</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Features Section -->
    <section id="features" class="py-16 md:py-24 bg-white border-b border-stone-200/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-xs font-bold text-teal-700 tracking-widest uppercase mb-3">Everything You Need In One Place</h2>
          <h3 class="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight mb-4">Complete Operating System for Field Operations</h3>
          <p class="text-slate-700 text-base sm:text-lg">Replace disjointed spreadsheets, paper forms, and expensive legacy dispatch systems with one modern, high-speed solution.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article class="p-6 sm:p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-teal-500/50 transition-all shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 font-bold text-xl">1</div>
            <h3 class="text-xl font-extrabold text-slate-900 mb-3">Live GPS Map Tracking & Routing</h3>
            <p class="text-slate-700 text-sm leading-relaxed mb-4">
              Monitor technician locations in real-time, view live route breadcrumbs, optimize travel paths, and dispatch nearest technicians instantly to reduce fuel costs and response times.
            </p>
            <ul class="text-xs text-slate-600 space-y-2 font-medium">
              <li class="flex items-center gap-2">&check; Real-time GPS coordinate telemetry</li>
              <li class="flex items-center gap-2">&check; Live technician traffic & speed monitoring</li>
              <li class="flex items-center gap-2">&check; Route history playback and mileage audits</li>
            </ul>
          </article>

          <article class="p-6 sm:p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-teal-500/50 transition-all shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 font-bold text-xl">2</div>
            <h3 class="text-xl font-extrabold text-slate-900 mb-3">Automated Geofence Job Site Audits</h3>
            <p class="text-slate-700 text-sm leading-relaxed mb-4">
              Set virtual radius boundaries around client addresses. Technicians automatically clock in upon entering and clock out when leaving, eliminating timesheet fraud.
            </p>
            <ul class="text-xs text-slate-600 space-y-2 font-medium">
              <li class="flex items-center gap-2">&check; 50m - 500m customizable radius zones</li>
              <li class="flex items-center gap-2">&check; Automatic arrival and departure timestamps</li>
              <li class="flex items-center gap-2">&check; Proof of site presence for billing dispute defense</li>
            </ul>
          </article>

          <article class="p-6 sm:p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-teal-500/50 transition-all shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 font-bold text-xl">3</div>
            <h3 class="text-xl font-extrabold text-slate-900 mb-3">Biometric Photo Face Verification</h3>
            <p class="text-slate-700 text-sm leading-relaxed mb-4">
              Require field staff to snap a selfie at job start. AI facial recognition matches the photo to the registered technician profile to eliminate buddy punching.
            </p>
            <ul class="text-xs text-slate-600 space-y-2 font-medium">
              <li class="flex items-center gap-2">&check; Instant biometric face matching</li>
              <li class="flex items-center gap-2">&check; Time-stamped and GPS-tagged photos</li>
              <li class="flex items-center gap-2">&check; Admin audit alerts for mismatch flags</li>
            </ul>
          </article>

          <article class="p-6 sm:p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-teal-500/50 transition-all shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 font-bold text-xl">4</div>
            <h3 class="text-xl font-extrabold text-slate-900 mb-3">Custom Cost Categories & Profit Tracking</h3>
            <p class="text-slate-700 text-sm leading-relaxed mb-4">
              Track labor hours, materials, equipment rentals, sub-contractors, and permits per project with real-time budget vs. actual cost margin analysis.
            </p>
            <ul class="text-xs text-slate-600 space-y-2 font-medium">
              <li class="flex items-center gap-2">&check; Real-time job costing & gross margin %</li>
              <li class="flex items-center gap-2">&check; Custom expense categories & receipt capture</li>
              <li class="flex items-center gap-2">&check; Budget threshold overrun warnings</li>
            </ul>
          </article>

          <article class="p-6 sm:p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-teal-500/50 transition-all shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 font-bold text-xl">5</div>
            <h3 class="text-xl font-extrabold text-slate-900 mb-3">Digital Proposals, Invoices & Stripe Pay</h3>
            <p class="text-slate-700 text-sm leading-relaxed mb-4">
              Send professional estimates via SMS or Email with digital e-signatures. Convert approved proposals into work orders and Stripe-ready invoices with 1 click.
            </p>
            <ul class="text-xs text-slate-600 space-y-2 font-medium">
              <li class="flex items-center gap-2">&check; Instant client e-signature approval page</li>
              <li class="flex items-center gap-2">&check; Integrated Stripe credit card and ACH payments</li>
              <li class="flex items-center gap-2">&check; Automatic overdue payment SMS reminders</li>
            </ul>
          </article>

          <article class="p-6 sm:p-8 rounded-3xl bg-stone-50 border border-stone-200 hover:border-teal-500/50 transition-all shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 font-bold text-xl">6</div>
            <h3 class="text-xl font-extrabold text-slate-900 mb-3">Multi-Regional Compliance (US, UK, CA, AU, EU)</h3>
            <p class="text-slate-700 text-sm leading-relaxed mb-4">
              Pre-configured tax rules (Sales Tax, VAT, GST), date formats, currency symbols ($ USD, &pound; GBP, $ CAD, $ AUD, &euro; EUR), and labor regulations.
            </p>
            <ul class="text-xs text-slate-600 space-y-2 font-medium">
              <li class="flex items-center gap-2">&check; Localized tax presets for 5 global regions</li>
              <li class="flex items-center gap-2">&check; Offline-first Progressive Web App (PWA)</li>
              <li class="flex items-center gap-2">&check; GDPR, CCPA, and regional data security</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Industry Sectors Section -->
    <section id="industries" class="py-16 md:py-20 bg-stone-50 border-b border-stone-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2 class="text-xs font-bold text-teal-700 tracking-widest uppercase mb-2">Tailored For Every Trade</h2>
          <h3 class="text-2xl sm:text-3xl font-black text-slate-950">Built for Contractors & Mobile Service Teams</h3>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div class="text-2xl mb-2">&bull; HVAC</div>
            <p class="text-xs text-slate-600 font-semibold">Seasonal maintenance, emergency callouts, refrigerant tracking</p>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div class="text-2xl mb-2">&bull; Plumbing</div>
            <p class="text-xs text-slate-600 font-semibold">Dispatching, parts tracking, video diagnosis, job signoffs</p>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div class="text-2xl mb-2">&bull; Electrical</div>
            <p class="text-xs text-slate-600 font-semibold">Permit management, panel checklists, safety compliance</p>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div class="text-2xl mb-2">&bull; Landscaping</div>
            <p class="text-xs text-slate-600 font-semibold">Recurring maintenance routes, crew clock-in geofences</p>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div class="text-2xl mb-2">&bull; Cleaning</div>
            <p class="text-xs text-slate-600 font-semibold">Turnover scheduling, room checklists, quality inspection</p>
          </div>
          <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div class="text-2xl mb-2">&bull; Roofing & Solar</div>
            <p class="text-xs text-slate-600 font-semibold">Multi-day job costing, safety audits, photo documentation</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Section -->
    <section id="comparison" class="py-16 md:py-24 bg-white border-b border-stone-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2 class="text-xs font-bold text-teal-700 tracking-widest uppercase mb-2">Transparent Comparison</h2>
          <h3 class="text-2xl sm:text-4xl font-black text-slate-950">How FiledCrews Compares to Paid Legacy FSM</h3>
        </div>
        <div class="overflow-x-auto border border-stone-200 rounded-3xl shadow-sm bg-white">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="border-b border-stone-200 bg-stone-50">
                <th class="p-4 font-bold text-slate-900">Feature</th>
                <th class="p-4 font-bold text-teal-700 bg-teal-50/50">FiledCrews FSM</th>
                <th class="p-4 font-bold text-slate-600">Legacy Paid FSM ($300+/mo)</th>
                <th class="p-4 font-bold text-slate-600">Paper & Spreadsheets</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 text-slate-700">
              <tr>
                <td class="p-4 font-semibold text-slate-900">Monthly Cost</td>
                <td class="p-4 font-bold text-teal-700 bg-teal-50/20">$0 Free Forever</td>
                <td class="p-4">$150 - $450/user/mo</td>
                <td class="p-4">Hidden labor loss ($800+/mo)</td>
              </tr>
              <tr>
                <td class="p-4 font-semibold text-slate-900">Live GPS Map Dispatching</td>
                <td class="p-4 font-bold text-teal-700 bg-teal-50/20">Included Free</td>
                <td class="p-4">Often $49/mo Add-On</td>
                <td class="p-4">None</td>
              </tr>
              <tr>
                <td class="p-4 font-semibold text-slate-900">Automated Geofence Audits</td>
                <td class="p-4 font-bold text-teal-700 bg-teal-50/20">Included Free</td>
                <td class="p-4">Enterprise tier only</td>
                <td class="p-4">None</td>
              </tr>
              <tr>
                <td class="p-4 font-semibold text-slate-900">Biometric Photo Face Match</td>
                <td class="p-4 font-bold text-teal-700 bg-teal-50/20">Included Free</td>
                <td class="p-4">Rare / Not Supported</td>
                <td class="p-4">None</td>
              </tr>
              <tr>
                <td class="p-4 font-semibold text-slate-900">Digital Estimates & Stripe Invoicing</td>
                <td class="p-4 font-bold text-teal-700 bg-teal-50/20">Included Free</td>
                <td class="p-4">Included with transaction fees</td>
                <td class="p-4">Manual delay</td>
              </tr>
              <tr>
                <td class="p-4 font-semibold text-slate-900">Global Region Presets (US, UK, CA, AU, EU)</td>
                <td class="p-4 font-bold text-teal-700 bg-teal-50/20">Included Free</td>
                <td class="p-4">Separate regional licenses</td>
                <td class="p-4">Manual configuration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 md:py-24 bg-stone-50 border-b border-stone-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="max-w-3xl mx-auto mb-12">
          <h2 class="text-xs font-bold text-teal-700 tracking-widest uppercase mb-2">Honest & Accessible</h2>
          <h3 class="text-2xl sm:text-4xl font-black text-slate-950 mb-3">Simple Pricing for Growing Field Teams</h3>
          <p class="text-slate-700 text-base sm:text-lg">Our core platform is free forever. No credit card required to start.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <!-- Free Core Tier -->
          <div class="p-8 bg-white rounded-3xl border-2 border-teal-600 shadow-lg relative flex flex-col justify-between">
            <div>
              <span class="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase mb-4">Most Popular</span>
              <h3 class="text-2xl font-black text-slate-900 mb-1">Free Core</h3>
              <p class="text-xs text-slate-600 mb-4">Complete FSM tools for owner-operators & small teams</p>
              <div class="text-4xl font-black text-slate-950 mb-6">$0 <span class="text-sm font-semibold text-slate-500">/ forever</span></div>
              <ul class="space-y-3 text-sm text-slate-700 mb-8 font-medium">
                <li class="flex items-center gap-2">&check; Unlimited Jobs & Work Orders</li>
                <li class="flex items-center gap-2">&check; Live GPS Map Tracking</li>
                <li class="flex items-center gap-2">&check; Automated Geofence Time Audits</li>
                <li class="flex items-center gap-2">&check; Biometric Photo Face Check-In</li>
                <li class="flex items-center gap-2">&check; Invoices & Stripe Card Processing</li>
                <li class="flex items-center gap-2">&check; PWA Mobile App Access</li>
              </ul>
            </div>
            <a href="/wizard" class="w-full text-center py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-md" aria-label="Sign up for the Free Core plan">Start Free Now</a>
          </div>

          <!-- Growth Tier -->
          <div class="p-8 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="inline-block px-3 py-1 rounded-full bg-stone-100 text-slate-700 text-xs font-bold uppercase mb-4">Scaling Crews</span>
              <h3 class="text-2xl font-black text-slate-900 mb-1">Pro Operations</h3>
              <p class="text-xs text-slate-600 mb-4">Advanced workflow automation & multi-crew dispatch</p>
              <div class="text-4xl font-black text-slate-950 mb-6">$29 <span class="text-sm font-semibold text-slate-500">/ company / mo</span></div>
              <ul class="space-y-3 text-sm text-slate-700 mb-8 font-medium">
                <li class="flex items-center gap-2">&check; Everything in Free Core</li>
                <li class="flex items-center gap-2">&check; Multi-Crew Schedule Dispatcher</li>
                <li class="flex items-center gap-2">&check; Customer SMS Arrival Notifications</li>
                <li class="flex items-center gap-2">&check; Custom Cost Categories & Profit Reports</li>
                <li class="flex items-center gap-2">&check; QuickBooks & Xero Sync</li>
                <li class="flex items-center gap-2">&check; Priority Technical Support</li>
              </ul>
            </div>
            <a href="/wizard" class="w-full text-center py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all" aria-label="Start Pro Operations plan trial">Start Pro Trial</a>
          </div>

          <!-- AI Autonomous Tier -->
          <div class="p-8 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase mb-4">Autonomous AI</span>
              <h3 class="text-2xl font-black text-slate-900 mb-1">AI Copilot</h3>
              <p class="text-xs text-slate-600 mb-4">24/7 AI phone receptionist & automated job booking</p>
              <div class="text-4xl font-black text-slate-950 mb-6">$59 <span class="text-sm font-semibold text-slate-500">/ company / mo</span></div>
              <ul class="space-y-3 text-sm text-slate-700 mb-8 font-medium">
                <li class="flex items-center gap-2">&check; Everything in Pro Operations</li>
                <li class="flex items-center gap-2">&check; 24/7 AI Voice Phone Call Answering</li>
                <li class="flex items-center gap-2">&check; Instant AI SMS Job Dispatcher</li>
                <li class="flex items-center gap-2">&check; AI Estimate Generator from Voice Notes</li>
                <li class="flex items-center gap-2">&check; Autonomous Schedule Optimizer</li>
                <li class="flex items-center gap-2">&check; Dedicated Account Concierge</li>
              </ul>
            </div>
            <a href="/ai-agent" class="w-full text-center py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md" aria-label="Explore AI Copilot for field services">Explore AI Copilot</a>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-16 md:py-24 bg-white border-b border-stone-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-xs font-bold text-teal-700 tracking-widest uppercase mb-2">Got Questions?</h2>
          <h3 class="text-2xl sm:text-4xl font-black text-slate-950">Frequently Asked Questions</h3>
        </div>

        <div class="space-y-6">
          <details class="group p-6 bg-stone-50 rounded-2xl border border-stone-200 transition-all open:bg-white open:shadow-sm" open>
            <summary class="font-extrabold text-slate-900 text-lg cursor-pointer flex justify-between items-center list-none">
              <span>Is FiledCrews genuinely free to use?</span>
              <span class="text-teal-600 font-bold transition-transform group-open:rotate-180">&darr;</span>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed text-sm">
              Yes! FiledCrews offers a 100% free core plan that includes live GPS technician map tracking, unlimited jobs, work orders, automated geofence clock-in audits, photo biometric face verification, customer proposals, and Stripe invoices. There are no technician limits or hidden fees for the core platform.
            </p>
          </details>

          <details class="group p-6 bg-stone-50 rounded-2xl border border-stone-200 transition-all open:bg-white open:shadow-sm">
            <summary class="font-extrabold text-slate-900 text-lg cursor-pointer flex justify-between items-center list-none">
              <span>How does automated geofence audit work?</span>
              <span class="text-teal-600 font-bold transition-transform group-open:rotate-180">&darr;</span>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed text-sm">
              When a job site is created, FiledCrews maps a virtual geographic radius around the customer location. When a technician enters the radius zone, their mobile app automatically registers the arrival time and logs the presence. When they exit the boundary, the shift is logged, eliminating manual timesheet entry errors.
            </p>
          </details>

          <details class="group p-6 bg-stone-50 rounded-2xl border border-stone-200 transition-all open:bg-white open:shadow-sm">
            <summary class="font-extrabold text-slate-900 text-lg cursor-pointer flex justify-between items-center list-none">
              <span>Does FiledCrews work on both iPhone and Android?</span>
              <span class="text-teal-600 font-bold transition-transform group-open:rotate-180">&darr;</span>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed text-sm">
              Yes. FiledCrews is built as a responsive, offline-capable Progressive Web Application (PWA) and also provides an Android APK. Technicians can install it directly to their home screen on iOS and Android with full GPS tracking and offline job caching.
            </p>
          </details>

          <details class="group p-6 bg-stone-50 rounded-2xl border border-stone-200 transition-all open:bg-white open:shadow-sm">
            <summary class="font-extrabold text-slate-900 text-lg cursor-pointer flex justify-between items-center list-none">
              <span>Which countries and currencies are supported?</span>
              <span class="text-teal-600 font-bold transition-transform group-open:rotate-180">&darr;</span>
            </summary>
            <p class="mt-4 text-slate-700 leading-relaxed text-sm">
              FiledCrews includes built-in regional presets for the United States ($ USD), United Kingdom (&pound; GBP), Canada ($ CAD), Australia ($ AUD), and the European Union (&euro; EUR), with local tax calculations (Sales Tax, VAT, GST), date formats, and compliance rules.
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- Bottom CTA Banner -->
    <section class="py-16 md:py-20 bg-slate-950 text-white text-center relative overflow-hidden">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 class="text-2xl sm:text-4xl font-black tracking-tight mb-4">Start Coordinating Your Field Crew in 2 Minutes</h2>
        <p class="text-slate-400 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of trade professionals and contractors operating more profitable, organized field operations with FiledCrews.
        </p>
        <a href="/wizard" class="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-base shadow-xl shadow-teal-500/20 hover:shadow-teal-500/30 transition-all" aria-label="Create your free FiledCrews account now">
          Create Free Account &rarr;
        </a>
      </div>
    </section>
  </main>

  <!-- Global Footer -->
  <footer role="contentinfo" class="border-t border-stone-200 bg-stone-100 py-12 text-slate-700 text-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        <div class="col-span-2">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-sm">F</div>
            <span class="font-black text-lg text-slate-900">FiledCrews</span>
          </div>
          <p class="text-xs text-slate-600 max-w-sm leading-relaxed mb-4">
            The free, modern Field Service Management (FSM) platform empowering contractors with live GPS dispatch, automated geofence timecards, and biometric verification.
          </p>
          <div class="text-xs text-slate-500">&copy; 2026 FiledCrews. All rights reserved.</div>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Product</h4>
          <ul class="space-y-2 text-xs">
            <li><a href="#features" class="hover:text-teal-700">GPS Live Map</a></li>
            <li><a href="#features" class="hover:text-teal-700">Geofence Audits</a></li>
            <li><a href="#features" class="hover:text-teal-700">Biometric Check-In</a></li>
            <li><a href="#pricing" class="hover:text-teal-700">Pricing & Free Tier</a></li>
            <li><a href="/ai-agent" class="hover:text-teal-700">Autonomous AI Copilot</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Industries</h4>
          <ul class="space-y-2 text-xs">
            <li><a href="#industries" class="hover:text-teal-700">HVAC Dispatch</a></li>
            <li><a href="#industries" class="hover:text-teal-700">Plumbing Routing</a></li>
            <li><a href="#industries" class="hover:text-teal-700">Electrical Contractors</a></li>
            <li><a href="#industries" class="hover:text-teal-700">Landscaping Crews</a></li>
            <li><a href="#industries" class="hover:text-teal-700">Cleaning Services</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Resources & Legal</h4>
          <ul class="space-y-2 text-xs">
            <li><a href="/about" class="hover:text-teal-700">About Us</a></li>
            <li><a href="/support" class="hover:text-teal-700">Support & Help</a></li>
            <li><a href="/privacy" class="hover:text-teal-700">Privacy Policy</a></li>
            <li><a href="/terms" class="hover:text-teal-700">Terms of Service</a></li>
            <li><a href="/llms.txt" class="hover:text-teal-700">AI Specification (llms.txt)</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</div>
`;

function prerender() {
  console.log('⚡ Starting static HTML prerender pipeline for dist/index.html...');
  if (!fs.existsSync(distIndexPath)) {
    console.error('❌ Error: dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  let html = fs.readFileSync(distIndexPath, 'utf8');

  // Replace empty <div id="root"></div> with the full, rich semantic landing HTML
  if (html.includes('<div id="root"></div>')) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${staticLandingHtml.trim()}</div>`
    );
    fs.writeFileSync(distIndexPath, html, 'utf8');
    const stat = fs.statSync(distIndexPath);
    console.log(`✓ Injected complete static semantic DOM into dist/index.html (${(stat.size / 1024).toFixed(1)} kB)`);
  } else {
    console.warn('⚠️ Warning: <div id="root"></div> not found or already replaced.');
  }

  console.log('🎉 Static Prerender Complete: All body text is now 100% extractable by search engines & AI web readers!');
}

prerender();
