'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  team_id?: string;
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  checkEmailVerification: () => Promise<boolean>;
  jwt: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const initializationRef = useRef(false);
  const jwtFetchingRef = useRef(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [jwt, setJwt] = useState<string | null>(null);

  /************ helpers ************/
  const validateJwt = useCallback((token: string | null): boolean => {
    if (!token) return false;
    
    try {
      // Basic JWT validation - check if it's properly formed and not expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired (with 5 minute buffer)
      if (payload.exp && payload.exp < currentTime + 300) {
        console.log('JWT is expired or expires soon');
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Invalid JWT format:', e);
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      console.log('🔍 Starting fetchProfile...');
      console.log('📞 About to call supabase.auth.getSession()...');
      
      // Add timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
      );
      
      const result = await Promise.race([sessionPromise, timeoutPromise]);
      const { data: { session }, error } = result as any;
      
      console.log('✅ getSession completed, error:', error, 'hasSession:', !!session);

      if (error) {
        console.error('❌ Error getting session in fetchProfile:', error);
        setUser(null);
        return null;
      }

      if (!session) {
        console.log('ℹ️ No session found in fetchProfile');
        setUser(null);
        return null;
      }

      console.log('👤 Session found, user:', session.user.email, 'id:', session.user.id);

      // Set basic user profile immediately from session data
      const basicUserProfile = {
        id: session.user.id,
        email: session.user.email!,
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        team_id: null,
        role: null,
      };

      console.log('⚡ Setting basic user profile immediately:', basicUserProfile);
      setUser(basicUserProfile);

      // Try to enhance with database profile data (optional and non-blocking)
      try {
        console.log('🗄️ Attempting to fetch profile from database...');
        
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
        );
        
        const profileResult = await Promise.race([profilePromise, timeoutPromise]);
        const { data: profile, error: profileError } = profileResult as any;

        console.log('📊 Database profile query result:', { profile, profileError });

        if (profileError) {
          console.warn('⚠️ Profile table query failed (using basic profile):', profileError.message);
          return basicUserProfile;
        }

        if (profile) {
          const enhancedUserProfile = {
            id: session.user.id,
            email: session.user.email!,
            full_name: profile.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            team_id: profile.team_id,
            role: profile.role,
          };

          console.log('🎯 Enhanced user profile with database data:', enhancedUserProfile);
          setUser(enhancedUserProfile);
          return enhancedUserProfile;
        }
      } catch (profileFetchError) {
        console.warn('⚠️ Non-critical profile enhancement error:', profileFetchError);
      }

      console.log('✅ fetchProfile completed successfully with basic profile');
      return basicUserProfile;
    } catch (e) {
      console.error('💥 fetchProfile unexpected error:', e);
      
      // Emergency fallback - try to create a basic profile from localStorage or any available data
      try {
        console.log('🚨 Attempting emergency profile creation...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const emergencyProfile = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.email?.split('@')[0] || 'User',
            team_id: null,
            role: null,
          };
          console.log('🆘 Emergency fallback profile:', emergencyProfile);
          setUser(emergencyProfile);
          return emergencyProfile;
        }
      } catch (emergencyError) {
        console.error('💀 Emergency profile creation failed:', emergencyError);
      }
      
      setUser(null);
      return null;
    }
  }, [supabase]);

  const fetchJwt = useCallback(async (userId: string, forceRefresh = false) => {
    // Prevent multiple simultaneous JWT fetches
    if (jwtFetchingRef.current && !forceRefresh) {
      console.log('JWT fetch already in progress, skipping...');
      return jwt;
    }
    
    // Check if current JWT is still valid (unless forcing refresh)
    if (!forceRefresh) {
      const currentJwt = jwt || localStorage.getItem('jwt');
      if (validateJwt(currentJwt)) {
        console.log('Current JWT is still valid, no need to fetch new one');
        if (!jwt && currentJwt) {
          setJwt(currentJwt);
        }
        return currentJwt;
      }
    }
    
    jwtFetchingRef.current = true;
    
    try {
      const apiUrl = config.api.baseUrl;
      console.log('Fetching JWT from:', `${apiUrl}/api/get-jwt`, 'for user:', userId);
      
      const res = await fetch(`${apiUrl}/api/get-jwt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error(`JWT fetch failed with status: ${res.status}, response: ${errorText}`);
        throw new Error(`JWT fetch failed with status: ${res.status}`);
      }

      const responseData = await res.json();
      const { token } = responseData;
      
      if (!token) {
        console.error('No token received from server, response:', responseData);
        throw new Error('No token received from server');
      }

      // Validate the new token before storing
      if (!validateJwt(token)) {
        console.error('Received invalid JWT from server');
        throw new Error('Received invalid JWT from server');
      }

      setJwt(token);
      localStorage.setItem('jwt', token);
      console.log('JWT fetched and stored successfully');
      return token;
    } catch (e) {
      console.error('Failed to fetch JWT:', e);
      
      // If JWT fetch fails, don't necessarily clear the current JWT unless it's invalid
      const storedJwt = localStorage.getItem('jwt');
      if (storedJwt && !validateJwt(storedJwt)) {
        console.log('Clearing invalid stored JWT');
        localStorage.removeItem('jwt');
        setJwt(null);
      } else if (storedJwt && validateJwt(storedJwt)) {
        console.log('Keeping valid stored JWT despite fetch failure');
        if (!jwt) setJwt(storedJwt);
        return storedJwt;
      }
      
      // For deployment, we might want to continue without JWT if backend is not available
      console.warn('Continuing without JWT - some features may not work');
      return null;
    } finally {
      jwtFetchingRef.current = false;
    }
  }, [jwt, validateJwt]);

  /************ actions ************/
  const signIn = async (email: string, password: string) => {
    console.log('🔐 Starting sign-in process for:', email);
    setLoading(true);
    try {
      // Remove backend health check - authentication should work independently
      console.log('📡 Calling supabase.auth.signInWithPassword...');
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Supabase sign-in error:', error);
        throw error;
      }
      
      console.log('✅ Supabase sign-in successful:', {
        user: data.user?.email,
        session: !!data.session,
        sessionExpires: data.session?.expires_at
      });

      // Profile and JWT will be handled by the auth state change handler
      console.log('⏳ Waiting for auth state change handler...');
    } catch (error) {
      console.error('💥 Sign-in process failed:', error);
      throw error;
    } finally {
      setLoading(false);
      console.log('🏁 Sign-in process completed');
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string = ''
  ) => {
    setLoading(true);
    try {
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('No user data returned');
        throw new Error('Could not obtain new user id');
      }

      console.log('Signup successful, checking verification status');
      
      // Check if email verification is required
      const needsEmailVerification = !data.session;
      console.log('Needs email verification:', needsEmailVerification);

      if (!needsEmailVerification) {
        console.log('No verification needed, proceeding with profile setup');
        let retries = 0;
        let session = null;
        
        while (retries < 5) {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
          if (currentSession) {
            session = currentSession;
            break;
          }
          console.log('Waiting for session, attempt:', retries + 1);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }

        if (!session) {
          console.error('No session established after signup');
          throw new Error('No session established after signup');
        }

        if (fullName) {
          console.log('Updating profile with full name');
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);

          if (profileErr) {
            console.error('Profile update error:', profileErr);
            throw profileErr;
          }
        }

        await fetchProfile();
        // Let the login page handle redirect to dashboard
      } else {
        console.log('Email verification required, verification email should be sent');
      }

      return { needsEmailVerification };
    } catch (error) {
      console.error('Signup process error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;


    setUser(null);
    setJwt(null);
    setLoading(false);
    localStorage.removeItem('jwt');
    
    // Reset initialization flag to allow re-initialization after next sign in
    initializationRef.current = false;
    
    router.push('/login');
  };

  const refreshProfile = useCallback(async () => {
    return await fetchProfile();
  }, [fetchProfile]);

  const checkEmailVerification = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return !!session;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  /************ init ************/
  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // First, check for existing JWT in localStorage and validate it
        const storedJwt = localStorage.getItem('jwt');
        if (storedJwt && validateJwt(storedJwt)) {
          console.log('Found valid stored JWT, restoring...');
          setJwt(storedJwt);
        } else if (storedJwt) {
          console.log('Found expired JWT, removing...');
          localStorage.removeItem('jwt');
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          localStorage.removeItem('jwt');
          setJwt(null);
          return;
        }

        if (session) {
          console.log('Session found, fetching profile...');
          const userProfile = await fetchProfile();
          
          // Don't block on JWT fetching
          if (userProfile && session.user?.id) {
            console.log('Starting background JWT fetch...');
            fetchJwt(session.user.id, true).catch(error => {
              console.warn('Background JWT fetch failed:', error.message);
            });
          }
        } else {
          console.log('No session found');
          setUser(null);
          localStorage.removeItem('jwt');
          setJwt(null);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        setUser(null);
        localStorage.removeItem('jwt');
        setJwt(null);
      } finally {
        console.log('🏁 Auth initialization completed, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, 'User ID:', session?.user?.id);
      console.log('📊 Session details:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at
      });
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          console.log('✅ Session available, handling auth state change...');
          console.log('👤 Session user:', session.user.email);
          try {
            console.log('📋 Fetching user profile...');
            const userProfile = await fetchProfile();
            if (userProfile) {
              console.log('✅ Profile fetched successfully:', userProfile.email);
              
              // Try to fetch JWT in background (non-blocking)
              // Don't await this - let it run in background
              const backendUrl = config.api.baseUrl;
              if (backendUrl.includes('localhost')) {
                console.log('🔑 Starting JWT fetch in background for local backend...');
                fetchJwt(session.user.id, true).then(jwtResult => {
                  console.log('JWT fetch result:', jwtResult ? '✅ Success' : '❌ Failed');
                }).catch(jwtError => {
                  console.warn('JWT fetch failed (non-critical):', jwtError.message);
                });
              } else {
                console.log('⏭️ Skipping JWT fetch - using production backend without local server');
              }
            } else {
              console.error('❌ Failed to fetch user profile during auth state change');
            }
          } catch (error) {
            console.error('💥 Error during auth state change handling:', error);
          }
        } else {
          console.warn('⚠️ Auth state change but no session available');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out, clearing state...');
        setUser(null);
        setJwt(null);
        localStorage.removeItem('jwt');
      } else {
        console.log('ℹ️ Other auth event:', event);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, fetchJwt, validateJwt]);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    checkEmailVerification,
    jwt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
