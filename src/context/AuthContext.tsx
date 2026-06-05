/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AppUser } from "@/types";
import {
  startSession,
  endSession,
  updateHeartbeat,
} from "@/services/sessionService";

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: string,
    displayName: string,
    brokerId?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProfile = async (uid: string) => {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      setUserProfile(docSnap.data() as AppUser);
    }
  };

  // ─── Session heartbeat ───────────────────────────────────────
  const startHeartbeat = useCallback(
    (uid: string, sid: string) => {
      stopHeartbeat(); // clear any existing interval
      // Fire heartbeat immediately then every 60s
      updateHeartbeat(uid, sid).catch(() => {});
      heartbeatIntervalRef.current = setInterval(() => {
        updateHeartbeat(uid, sid).catch(() => {});
      }, 60_000);
    },
    [],
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // ─── End current session (if any) ────────────────────────────
  const endCurrentSession = useCallback(async () => {
    const sid = sessionIdRef.current;
    const uid = user?.uid;
    if (sid && uid) {
      try {
        await endSession(uid, sid);
      } catch {
        // Best-effort — session may already be gone
      }
    }
    sessionIdRef.current = null;
    stopHeartbeat();
  }, [user?.uid, stopHeartbeat]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // End previous session if user changed
      if (firebaseUser) {
        // Start a new session
        try {
          const sessionId = await startSession(firebaseUser.uid);
          sessionIdRef.current = sessionId;
          startHeartbeat(firebaseUser.uid, sessionId);
        } catch {
          // Session start failure shouldn't break auth
        }
        await fetchProfile(firebaseUser.uid);
      } else {
        await endCurrentSession();
        setUserProfile(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => {
      unsubscribe();
      endCurrentSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (
    email: string,
    password: string,
    role: string,
    displayName: string,
    brokerId?: string,
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userDoc: AppUser = {
      id: cred.user.uid,
      role: role as AppUser["role"],
      brokerId,
      displayName,
      email,
      isActive: true,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userDoc);
  };

  const logout = async () => {
    await endCurrentSession();
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (user) {await fetchProfile(user.uid);}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {throw new Error("useAuth must be used within AuthProvider");}
  return context;
}
