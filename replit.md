# Grow Grid - Next.js Application

## Overview
Grow Grid is a Next.js application designed to help families invest in a child's future through an interactive pin-based investment platform. The application allows users to gift investment grids, track progress, and manage portfolios.

## Project Architecture
- **Framework**: Next.js 15.3.3 with TypeScript
- **UI**: React 19 with Tailwind CSS and Radix UI components
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts for data visualization

## Current State
The application is successfully configured for the Replit environment:
- Running on port 5000 with 0.0.0.0 host binding
- Development server configured with Turbopack
- Supabase client properly handled for optional environment variables
- All main pages rendering correctly (home, gift, login)

## Key Features
- Landing page with call-to-action cards
- Gift creation system
- User authentication (login/signup)
- Investment tracking dashboard
- Portfolio management
- Progress visualization

## Development Setup
- Dependencies installed via npm
- Development server: `npm run dev`
- Build command: `npm run build`
- Production server: `npm start`

## Deployment Configuration
- Target: Autoscale deployment
- Build: `npm run build`
- Run: `npm start`
- Configured for stateless web application

## Recent Changes (September 28, 2025)
- Imported from GitHub repository
- Configured Next.js for Replit environment
- Set up development workflow on port 5000
- Fixed Supabase client null handling
- Configured deployment settings
- Application successfully running and tested

## User Preferences
- Clean, modern UI design
- Family-friendly investment platform
- Responsive design with mobile support
- Professional color scheme with gradient backgrounds

## Next Steps for User
- Configure Supabase environment variables if database functionality is needed
- Set up production Supabase project
- Customize branding and content as needed
- Deploy to production when ready