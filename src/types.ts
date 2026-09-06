export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm';

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: ReflectionMode;
  messages: JournalMessage[];
  summarySnippet?: string;
}

export interface AuthUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
