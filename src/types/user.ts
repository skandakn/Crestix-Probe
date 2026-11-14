export type UserRole = "mission_commander" | "probe_engineer" | "payload_specialist" | "viewer";

export interface UserProfile {
  id: string;
  name: string;
  callsign: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  probeClearanceLevel: 1 | 2 | 3 | 4 | 5;
  station: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
