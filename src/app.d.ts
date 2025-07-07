// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Environment variables
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace NodeJS {
	interface ProcessEnv {
		PUBLIC_SUPABASE_URL: string;
		PUBLIC_SUPABASE_ANON_KEY: string;
		SUPABASE_SERVICE_ROLE_KEY: string;
		OPENAI_API_KEY?: string;
	}
}

export {};
