import { ChainsAtlasGOApi, ViewStateGenerator } from "../lib";

/**
 * Represents the authentication status of the {@link ChainsAtlasGOApi}
 * required to manage the state of the extension's views in the {@link ViewStateGenerator}.
 */
export type AuthStatus = "authenticated" | "authenticating";
