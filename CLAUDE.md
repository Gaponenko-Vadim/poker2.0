# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 poker application built with React 19, TypeScript, and Tailwind CSS 4. The project is currently in early development stages with minimal custom functionality beyond the default Next.js template.

## Technology Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **React**: 19.2.0
- **TypeScript**: ^5
- **Styling**: Tailwind CSS 4 with PostCSS
- **Fonts**: Geist and Geist Mono (via next/font/google)

## Development Commands

### Running the application
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Create production build
- `npm start` - Run production server
- `npm run lint` - Run ESLint

## Project Structure

- `app/` - Next.js App Router directory
  - `layout.tsx` - Root layout with font configuration and metadata
  - `page.tsx` - Home page component
  - `globals.css` - Global styles and Tailwind directives
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with path alias `@/*` for project root

## Architecture Notes

### TypeScript Configuration
- Uses path alias `@/*` to reference files from the project root
- Target is ES2017 with JSX mode set to `react-jsx`
- Strict mode enabled

### Styling Approach
- Tailwind CSS 4 with PostCSS plugin
- Dark mode support configured with `dark:` variants
- Custom font families via CSS variables: `--font-geist-sans` and `--font-geist-mono`

### Next.js App Router
- Uses Next.js 16 App Router architecture
- Server components by default
- Font optimization with `next/font/google`
