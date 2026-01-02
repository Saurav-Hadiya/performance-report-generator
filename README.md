# Employee Performance Feedback System

A modern, full-stack web application for managing employee performance reviews and feedback. Built with Next.js 15, Supabase, and powered by Google Gemini AI for intelligent performance report generation.

## About the Project

This application provides a comprehensive solution for organizations to manage employee performance reviews. It enables employees to provide feedback to their colleagues, track review history, and generate AI-powered performance reports. The system supports multi-organization management with separate authentication flows for employees and organization administrators.

### Key Features

- Employee management with role and department tracking
- Performance review creation and management
- AI-powered performance report generation using Google Gemini
- Review assignment and tracking
- Organization dashboard for centralized management
- Secure authentication with role-based access control
- Responsive design with modern UI components

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **AI Integration**: [Google Gemini AI](https://ai.google.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Setup Instructions

### Prerequisites

Before you begin, ensure you have the following:

- [Node.js](https://nodejs.org/) 18 or higher
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) account and project
- A [Google Gemini API](https://ai.google.dev/) key

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd next-performace-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run the Supabase migrations located in `supabase/migrations/` to set up your database schema.

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.
