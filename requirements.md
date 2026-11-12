## 1. Overview & Goal

Build a mobile app (iOS + Android) for a home-healthcare staffing company to:

- Track field caregivers' location at a configurable interval (default: every 2 minutes) during shift hours.
- Give each employee a profile page with personal/compliance details and app preferences.
- Provide an AI chatbot for employee questions (HR, scheduling, policy, client-care queries).
- Provide a branded home/dashboard page.
- Provide a notifications/updates tab.

Primary users: elderly-care field workers (often less tech-savvy, may have older phones, variable connectivity, work alone in clients' homes). Design must prioritize **simplicity, large touch targets, offline resilience, and trust/transparency** around tracking.

## 2. Competitive / Role-Model Research

Reviewed comparable products in home-care, EVV (Electronic Visit Verification), and field-workforce tracking:


| App                                                                         | Relevant idea to borrow                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timeero / AlayaCare / Aaniie / CareSmartz360 / CareVoyant (EVV leaders)** | GPS-verified clock-in/out at the client's address, geofenced visit verification, offline capture with background sync, single-swipe clock-in, care notes attached to each visit                                                                                              |
| **Connecteam**                                                              | Transparency banner shown whenever tracking is active; tracking limited strictly to scheduled/clocked-in hours; geofence alerts if a caregiver leaves the client site unexpectedly; adaptive ping interval (frequent while moving, relaxed while stationary) to save battery |
| **Homebase / When I Work**                                                  | At-a-glance "who's on shift / where" dashboard for admins; simple one-tap clock-in on the home screen                                                                                                                                                                        |
| **Life360**                                                                 | Clear, friendly map UI; "last seen" + battery-level indicator so family/employer knows if location is stale vs. device is just off                                                                                                                                           |


**Key best practices to adopt:**

1. Track location **only during scheduled/clocked-in shifts**, never 24/7 — this is both a privacy best practice and (depending on jurisdiction) a legal requirement.
2. Show a persistent, visible **"tracking is active" indicator** on the employee's phone — never track silently.
3. Support **offline capture** — queue location pings/visit check-ins locally and sync when connectivity returns (critical for rural/in-home visits with poor signal).
4. Use **adaptive/geofence-based pinging** (not pure fixed-interval) to save battery: e.g., ping every 2 minutes while in transit, less frequently while stationary inside a geofenced client address, resume on exit.
5. Tie location data to a **real workflow** (visit verification, timesheets, payroll, safety/SOS) — not just a map nobody looks at.
6. Define a **data retention window** (e.g., auto-purge raw GPS pings after 90 days) and restrict who can view raw tracks vs. aggregated visit logs.
7. Provide a **panic/SOS button** — common in elder-care/home-visit apps given caregivers often work alone in strangers' homes.
8. Capture **multiple, prioritized emergency contacts** per employee (not just one) — a practice borrowed from field-safety and EVV apps so an SOS event escalates automatically through a primary → secondary contact (and admin/dispatch) if the first doesn't respond, rather than relying on a single point of failure.

## 3. Functional Requirements

### 3.1 Location Tracking Module

- FR-1: Capture device GPS location every **2 minutes** (configurable per company policy) while the employee is clocked in / on an active shift.
- FR-2: Stop tracking automatically on clock-out; never track outside shift hours.
- FR-3: Show a persistent notification/foreground-service indicator ("Location sharing active") while tracking — required on both Android (foreground service) and iOS (background location usage with "always" or "while using" permission + blue status-bar indicator).
- FR-4: Geofence each client's home address; log geofence-entry/exit events as visit start/end (EVV-style verification).
- FR-5: Queue location pings offline (local SQLite/Room/Core Data) when there's no signal; batch-sync when connectivity resumes.
- FR-6: Adaptive interval: reduce ping frequency to conserve battery when the device has been stationary inside a known geofence for >10 minutes; resume 2-minute cadence on movement.
- FR-7: SOS/panic button on the main tracking screen that immediately pings current location + alerts the employee's **configured emergency contacts in priority order** (primary, then secondary) as well as a company admin/dispatcher.
- FR-8: Admin/dispatcher web or app view showing live map of all active employees, last-seen timestamp, and battery level.

### 3.2 Employee Profile Page

- FR-9: Display and allow editing of:
  - Full name
  - Employee ID (read-only, system-generated)
  - Aadhar number (masked by default, e.g., `XXXX-XXXX-1234`; full value viewable only after re-authentication/biometric step)
  - Email address
  - Residential address
  - Phone number
  - Profile photo
  - Emergency contacts (see FR-9a)
- FR-9a: Support **multiple emergency contacts** per employee (minimum 1, recommended up to 3). Each contact record should capture: name, relationship, phone number, and (optional) email. Employees can add, edit, remove, and reorder contacts, and must designate one as **primary**. Primary/secondary order drives the escalation sequence used by the SOS feature (FR-7) and should be included in the onboarding flow so no employee profile is left without at least one emergency contact.
- FR-10: Theme toggle — Dark / Light / System default.
- FR-11: "Ask AI" entry point (button/icon) navigating to the chatbot screen, pre-seeded with the employee's context (e.g., name, shift, assigned client) so the AI can personalize answers.
- FR-12: Logout / change password / biometric lock settings.
- **Compliance note:** Aadhar is classified as sensitive personal data under India's DPDP Act, 2023. It must be encrypted at rest and in transit, access-logged, masked in the UI by default, and never sent to third-party AI models unmasked (see Section 5). Emergency contact details (name, phone, relationship) are also personal data and should follow the same encryption-at-rest and access-logging standards.

### 3.3 AI Chatbox

- FR-13: Chat UI accessible from the Profile page (and optionally a floating action button on Home).
- FR-14: Employee can ask free-text questions (e.g., "What's my shift tomorrow?", "How do I log a missed visit?", "What's the company sick-leave policy?").
- FR-15: Chat backend should route to an AI model with access to: FAQs/policy docs, the employee's own schedule, and a safe fallback to "contact HR" for anything outside policy scope.
- FR-16: Redact/strip PII (Aadhar, address, emergency contact details) before sending any message content to a third-party LLM provider; only pass the minimum context needed.
- FR-17: Maintain chat history per employee, accessible on re-login.
- FR-18: Clear disclaimer that this is an AI assistant, not a human, with an escalation path to a live HR/support contact.

### 3.4 Home Page

- FR-19: Company logo prominently displayed in the header.
- FR-20: Employee summary card: name, photo, today's shift/client assignment, clock-in/out button.
- FR-21: Quick stats: hours worked this week, upcoming shifts, pending tasks/visit notes.
- FR-22: Quick-access tiles: Profile, Notifications, Chat/Ask AI, SOS.

### 3.5 Notifications / Updates Tab

- FR-23: List of notifications (shift changes, schedule reminders, policy updates, payroll notices, company announcements).
- FR-24: Push notifications (FCM/APNs) for time-sensitive items (e.g., "Shift starts in 30 min", "Client address changed").
- FR-25: Read/unread state, mark-all-as-read, and notification preferences (which categories to receive, quiet hours).
- FR-26: Notify the employee (and log an admin-visible event) if their emergency contact information is missing, incomplete, or hasn't been reviewed/confirmed in the last 6-12 months — prompting them to keep it current.

## 4. Non-Functional Requirements

- NFR-1: **Battery efficiency** — adaptive ping strategy (Sec 3.1) to avoid excessive drain on older Android devices common among field staff.
- NFR-2: **Offline-first** for tracking/visit-logging; graceful sync with conflict resolution.
- NFR-3: **Accessibility** — large fonts, high-contrast dark/light themes, simple navigation (bottom nav bar: Home / Notifications / Profile), since elderly-care staff may skew toward less tech-savvy users.
- NFR-4: **Security**: encryption at rest (AES-256) and in transit (TLS 1.2+), biometric/PIN app-lock, role-based access control for admin dashboards.
- NFR-5: **Privacy & consent**: explicit opt-in consent screen on first login explaining what is tracked, when, and why; link to a privacy policy; comply with India's DPDP Act 2023 (and any applicable labor/consent laws in the country of deployment) for location, Aadhar, and emergency-contact data handling.
- NFR-6: **Data retention**: configurable auto-purge of raw GPS history (e.g., 90 days), while visit-summary/EVV records are retained per payroll/compliance needs.
- NFR-7: **Scalability**: backend should handle N employees pinging every 2 minutes during shift hours (estimate load: active_employees × (shift_hours×30 pings/hr)).
- NFR-8: **Platform**: native or cross-platform (React Native/Flutter) supporting Android (primary, given field-worker device mix) and iOS.

## 5. Data Privacy & Compliance Checklist

- [ ] Explicit consent capture at onboarding (tracking + Aadhar collection) with versioned audit trail.
- [ ] Aadhar masked in UI by default; full value accessible only via re-auth; never logged in plaintext in app logs/crash reports.
- [ ] Location tracking strictly scoped to clocked-in shift windows; persistent on-device indicator while active.
- [ ] PII redaction before any data reaches a third-party AI/LLM provider.
- [ ] Data retention & deletion policy documented and enforced.
- [ ] Role-based access: only authorized admins/dispatchers can view live location or Aadhar; full audit logging of who viewed what.
- [ ] Emergency contact data (name, phone, relationship) encrypted at rest, access-logged, and only used for safety/SOS escalation purposes — never shared with marketing/third parties.
- [ ] Legal review for the specific state/country's labor-tracking consent laws before launch.

## 6. Suggested Tech Stack (high-level)

- **Mobile**: React Native or Flutter (fastest path to Android + iOS parity); native modules for background location (Android foreground service, iOS background location mode).
- **Backend**: REST/GraphQL API + message queue (e.g., Kafka) to ingest high-frequency location pings; time-series DB (e.g., TimescaleDB) for location history; standard RDBMS for profile/employee data.
- **Push notifications**: FCM (Android) + APNs (iOS).
- **AI chatbot**: LLM via secure gateway with PII-redaction middleware + RAG over company policy docs/FAQs.
- **Admin dashboard**: Web app with live map (e.g., Mapbox/Google Maps) for dispatchers.

## 7. Suggested Build Phases

1. **Phase 1 — MVP**: Auth, Profile (view/edit, theme toggle, emergency contacts), Home page with clock-in/out, basic location ping every 2 min during shift, Notifications tab (manual/push).
2. **Phase 2**: Geofencing + visit verification (EVV-style), offline queuing/sync, SOS button with emergency-contact escalation, admin live-map dashboard.
3. **Phase 3**: AI chatbot with policy RAG + schedule context, adaptive battery-saving ping logic, notification preference center.
4. **Phase 4**: Analytics (hours worked, visit compliance reports), payroll export integration, multi-language support for diverse caregiver workforce.

## 8. Open Questions for Stakeholders

1. Which country/state's labor + data-privacy laws apply (impacts consent language and Aadhar handling specifically if deployed in India)?
2. Should tracking be "always during shift" or "geofence-triggered only at client visits"?
3. Who should have access to live location — direct manager only, or company-wide dispatch team?
4. What LLM/AI provider is approved for use with employee data (internal vs. third-party)?
5. Expected number of employees / concurrent active shifts (for backend sizing)?
6. How many emergency contacts should be mandatory at onboarding (one vs. a primary + secondary), and should admins be able to view/edit them, or only the employee?

*Sources consulted for best-practice research: Timeero, AlayaCare, Aaniie, CareSmartz360, CareVoyant (EVV/home-care apps); Connecteam, Homebase, When I Work (field workforce tracking); Life360 (consumer location-sharing UX).*