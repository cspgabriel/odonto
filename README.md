# CareNova (ClinicMaster) - Premium Clinic Management System

CareNova is a modern, high-performance Clinic Management System (CMS) designed for dental & general medical practices. It serves as a superior, "Apple-like" alternative to legacy systems like ClinicPro, featuring a robust SaaS-ready architecture and AI-driven clinical tools.

## 🚀 Technical Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Supabase)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **UI/UX**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Authentication**: [Supabase Auth](https://supabase.com/auth) / [Clerk](https://clerk.com/)
- **AI**: [Google Gemini 2.0/2.5](https://ai.google.dev/) integration for clinical diagnostics

## ✨ Key Features

- **Clinic OS**: A centralized dashboard for Admins, Doctors, Receptionists, and Nurses.
- **Intelligent Scheduler**: Drag-and-drop calendar with conflict detection and real-time sync.
- **360° Patient CRM**: Comprehensive medical histories, document management, and billing integration.
- **Dental Specialization**: Interactive Odontogram mapping and Smile Comparison tools.
- **AI Scribe & Diagnostics**: Automated medical note generation and X-ray analysis hooks.
- **SaaS Ready**: Multi-tenant architecture with Row-Level Security (RLS).

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.x or later
- A Supabase project
- A Clerk account (if using Clerk for auth)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/carenova-clinic-master.git
   cd carenova-clinic-master
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_postgresql_url
   
   # If using Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. **Initialize the database**:
   ```bash
   npx drizzle-kit push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open the browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗺️ Roadmap

- [x] Phase 1: Core Dashboard & Patient CRM
- [ ] Phase 2: Advanced Clinical Tools (Odontogram)
- [ ] Phase 3: AI Diagnostics Integration
- [ ] Phase 4: SaaS Multi-Tenancy & Stripe Billing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support or business inquiries, visit [CareNova Support](https://carenova.example.com).
