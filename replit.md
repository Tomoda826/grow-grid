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

## Recent Changes (Project Import Setup & Feature Enhancements)
*September 28-29, 2025*

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
- ✅ **NEW**: Email confirmation system with professional HTML templates
- ✅ **NEW**: Gift code auto-population when navigating from order success to claim pages
- ✅ **NEW**: Enhanced UX with auto-focus fields and Enter key navigation
- ✅ **NEW**: Currency formatting for dollar amounts in gift creation

### Email Integration
- Integrated SendGrid for professional order confirmation emails
- Custom HTML email templates with Grow Grid branding
- Secure API key management through Replit environment variables
- Email API endpoint: `/api/send-confirmation-email`

### UX Improvements
- Auto-focus functionality on input fields in gift creation wizard
- Enter key navigation between form fields
- Currency formatting with dollar signs and proper number formatting
- Gift code auto-population from URL parameters (order success → claim flow)
- Fixed UI container overflow issues with progress bars

### Technical Fixes
- Resolved React Hooks violations and infinite re-render loops
- Fixed progress bar container overflow by moving components inside CardHeader
- Separated useEffect dependencies to prevent performance issues
- Proper URL parameter handling with formatted gift code display

### Latest Feature Updates
*September 29, 2025*
- **Enhanced Investment Scheduling**: Added monthly investment goal display on schedule page that updates in real-time when schedules are modified
- **Dollar Formatting**: Applied consistent currency input formatting across gift creation and schedule forms
- **One-Time Investment Feature**: Fully implemented manual investment functionality on dashboard with:
  - Dollar-formatted amount input field
  - Real-time investment tracking table showing amount, date, projected value, investment pins, and interest pins
  - Database persistence - manual investments now save permanently and persist across sessions
  - Integrated calculations affecting all projections and growth charts
- **Improved Chart Visualization**: Enhanced Projected Growth chart with cleaner Y-axis intervals, color-coded lines (blue=principal, green=interest, gold=goal), and detailed tooltips
- **State Synchronization**: Real-time updates between investment actions and dashboard calculations

### Known Configuration Notes
- Supabase integration is fully configured and functional with environment variables
- Automatic claim code formatting implemented: XXXX-XXXX format with auto-dash insertion
- TypeScript warnings exist for enhanced null safety (non-blocking)
- Email sender configured as noreply@mygrowgrid.com
- Manual investments fully persisted in database with proper Supabase integration

## User Preferences
- Standard Next.js development workflow
- Replit-optimized configuration for seamless development
- Focus on functional, clean UI with investment-focused user experience

## Next Steps for Full Functionality
1. Configure Supabase environment variables for database connectivity
2. Test complete gift creation and claiming workflows
3. Implement payment processing integration if needed
4. Deploy to production using Replit's autoscale deployment