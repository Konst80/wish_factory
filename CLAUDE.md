# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wish-Factory is a web-based Content Management System (CMS) for creating, managing, and delivering AI-assisted wishes/greetings. The project is built with SvelteKit and includes internationalization support for German and English.

## Development Commands

### Core Development

- `npm run dev` - Start development server
- `npm run dev -- --open` - Start development server and open browser
- `npm run build` - Build production version
- `npm run preview` - Preview production build

### Code Quality

- `npm run check` - Run SvelteKit sync and type checking
- `npm run check:watch` - Run type checking in watch mode
- `npm run lint` - Run Prettier and ESLint checks
- `npm run format` - Format code with Prettier

### Setup

- `npm install` - Install dependencies
- `npm run prepare` - Run SvelteKit sync (prepare command)

## Architecture

### Technology Stack

- **Frontend**: SvelteKit with Svelte 5
- **Styling**: Tailwind CSS 4.0
- **Internationalization**: Inlang Paraglide-JS
- **Development**: Vite, TypeScript, ESLint, Prettier

### Key Directories

- `src/routes/` - SvelteKit routes and pages
- `src/lib/` - Reusable components and utilities
- `src/lib/paraglide/` - Generated internationalization files
- `messages/` - Translation source files (en.json, de.json)
- `project.inlang/` - Internationalization configuration
- `doc/FRS/` - Functional requirements specification

### Core Data Model

The system centers around a "Wish" object with the following structure:

```json
{
  "id": "string",
  "type": "normal" | "funny",
  "eventType": "birthday" | "anniversary" | "custom",
  "relations": ["friend", "family", "partner", "colleague"],
  "ageGroups": ["all", "young", "middle", "senior"],
  "specificValues": [Number],
  "text": "string",
  "belated": "string",
  "status": "Entwurf" | "Zur Freigabe" | "Freigegeben" | "Archiviert",
  "language": "de" | "en"
}
```

### Internationalization

- Uses Inlang Paraglide-JS for type-safe i18n
- Supports German (de) and English (en)
- Message files in `messages/` directory
- Generated code in `src/lib/paraglide/`
- Language detection via middleware in `hooks.server.ts`

### Planned Features (from FRS)

- Dashboard with wish management
- AI-powered wish generation
- Workflow management with status transitions
- Role-based access (Editor/Administrator)
- REST API for external access
- JSON export functionality

## Configuration Files

- `svelte.config.js` - SvelteKit configuration
- `vite.config.ts` - Vite configuration with Tailwind and Paraglide plugins
- `eslint.config.js` - ESLint configuration with TypeScript and Svelte support
- `tsconfig.json` - TypeScript configuration
- `project.inlang/settings.json` - Internationalization settings

## Development Rules & Standards

**IMPORTANT**: This project follows strict development guidelines documented in `/doc/rules/SvelteKitRegelnundBestPractices.md`. All code must adhere to these rules covering:

- Modular architecture and Single Responsibility Principle
- SvelteKit conventions (file-based routing, load functions, Form Actions)
- Component design patterns (typed props, events, slots)
- State management hierarchy (local → stores → context)
- Progressive enhancement approach
- TypeScript strict mode requirements
- Code quality standards (ESLint, Prettier, testing)

## Development Notes

- Uses Svelte 5 with the new `$props()` syntax per development rules
- Tailwind CSS is configured via Vite plugin (approved framework)
- TypeScript is strictly configured (mandatory per rules)
- ESLint and Prettier are set up for code quality (required)
- The project follows SvelteKit conventions for file structure and routing (mandatory)

## Deployment Standards

- Quality Gates: Type check, lint, build must pass before deployment
