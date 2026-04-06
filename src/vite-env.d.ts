/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the ShadowStack API */
  readonly VITE_API_BASE_URL: string
  /** Polling interval in milliseconds */
  readonly VITE_POLLING_INTERVAL_MS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
