export interface LoginArgs {
  store: (k: string, v: any) => void
  lookup: (k: string) => any
  remove: (k: string) => any
  generate: () => Promise<string>
  appName: string
  messagePrefix?: string
}

export interface LoginInit {
  callbackUrl: string
  callbackParams: any
}

export interface LoginVerify {
  signature: string
  messageHash: string
  address: string
  error: string | null
  cancelled: string | null
}
