import type { Api } from "../lib";

/**
 * Represents the authentication status of the {@link Api} required to manage
 * the state of the extension's views.
 */
export type AuthStatus = "authenticated" | "authenticating";
