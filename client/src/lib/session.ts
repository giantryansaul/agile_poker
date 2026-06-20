export interface Profile {
  name: string
  color: string
}

// sessionStorage (not localStorage) so each browser tab acts as its own
// participant, while a refresh keeps the same identity.
const USER_ID_KEY = 'ap_userId'

export function getUserId(): string {
  let id = sessionStorage.getItem(USER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

export function getProfile(code: string): Profile | null {
  const raw = sessionStorage.getItem(`ap_profile_${code.toUpperCase()}`)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Profile
    return parsed.name && parsed.color ? parsed : null
  } catch {
    return null
  }
}

export function saveProfile(code: string, profile: Profile): void {
  sessionStorage.setItem(
    `ap_profile_${code.toUpperCase()}`,
    JSON.stringify(profile),
  )
}

export function clearProfile(code: string): void {
  sessionStorage.removeItem(`ap_profile_${code.toUpperCase()}`)
}
