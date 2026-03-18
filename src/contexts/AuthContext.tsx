import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, type AppProfile } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AppProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle<AppProfile>();

  if (error) {
    throw error;
  }

  return data;
}

function fallbackProfileFromUser(user: User): AppProfile {
  const username =
    typeof user.user_metadata?.username === "string" && user.user_metadata.username.trim().length > 0
      ? user.user_metadata.username.trim()
      : null;
  const displayName =
    typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim().length > 0
      ? user.user_metadata.display_name.trim()
      : username;

  return {
    id: user.id,
    username,
    display_name: displayName,
    avatar_url:
      typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function resolveInitialSession() {
      setLoading(true);
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;
      if (error) {
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        try {
          const nextProfile = await fetchProfile(currentSession.user.id);
          if (!isMounted) return;
          setProfile(nextProfile ?? fallbackProfileFromUser(currentSession.user));
        } catch {
          if (!isMounted) return;
          setProfile(fallbackProfileFromUser(currentSession.user));
        }
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    void resolveInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void fetchProfile(nextSession.user.id)
        .then((nextProfile) => {
          if (!isMounted) return;
          setProfile(nextProfile ?? fallbackProfileFromUser(nextSession.user));
        })
        .catch(() => {
          if (!isMounted) return;
          setProfile(fallbackProfileFromUser(nextSession.user));
        })
        .finally(() => {
          if (!isMounted) return;
          setLoading(false);
        });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      async signUp(email, password, username) {
        const normalizedUsername = username.trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: normalizedUsername,
              display_name: normalizedUsername,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              username: normalizedUsername,
              display_name: normalizedUsername,
              avatar_url: null,
            },
            {
              onConflict: "id",
            },
          );

          if (profileError) {
            throw profileError;
          }
        }
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [loading, profile, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
