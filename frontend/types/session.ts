export interface SessionUser {
    id: string;
    email: string;
    name?: string | null;
    role: string;
}

export type User = SessionUser;
