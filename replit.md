# Grow Grid - Investment Platform for Children

## Overview
Grow Grid is a Next.js application that helps families invest in a child's future through an interactive pin-based investment system. Users can gift investment grids, claim gifts, and track investment progress over time.

## Project Architecture
- **Frontend**: Next.js 15.3.3 with React 19, Tailwind CSS, and TypeScript
- **UI Components**: Radix UI components with custom styling
- **Database**: Supabase (PostgreSQL) for user management and data storage
- **Authentication**: Supabase Auth for user signup/login
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth UI interactions

## Recent Changes (Project Import Setup)
*December 28, 2024*

### Dependencies & Environment
- Installed all Node.js dependencies via npm install
- Configured Next.js for Replit environment (0.0.0.0:5000)
- Set up development workflow with proper host binding
- Configured deployment settings for autoscale deployment

### Configuration Updates
- **package.json**: Updated dev and start scripts to bind to 0.0.0.0:5000
- **next.config.ts**: Added proper headers configuration for iframe compatibility
- **Supabase Client**: Made Supabase configuration optional to allow development without credentials

### Features Working
- ✅ Homepage with landing page and CTA sections
- ✅ Gift creation wizard (Start a Gift functionality)
- ✅ Login/signup forms and authentication flows
- ✅ Navigation header with proper menu states
- ✅ Responsive design and animations

### Known Configuration Notes
- Supabase integration is configured but made optional for development
- Environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) can be added for full database functionality
- TypeScript warnings exist in gift_wizard.tsx for enhanced null safety (non-blocking)

## User Preferences
- Standard Next.js development workflow
- Replit-optimized configuration for seamless development
- Focus on functional, clean UI with investment-focused user experience

## Next Steps for Full Functionality
1. Configure Supabase environment variables for database connectivity
2. Test complete gift creation and claiming workflows
3. Implement payment processing integration if needed
4. Deploy to production using Replit's autoscale deployment