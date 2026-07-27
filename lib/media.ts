// Shared media limits. These can't live in app/actions/media.ts: a "use server"
// file may only export async functions, so a plain const there fails the build.

export const TITLE_MAX = 120;
export const NOTE_MAX = 500;
