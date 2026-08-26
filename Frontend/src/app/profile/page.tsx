'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProfileData {
  full_name: string;
  username: string;
  phone_number: string;
  company: string;
  position: string;
  bio: string;
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    username: '',
    phone_number: '',
    company: '',
    position: '',
    bio: '',
  });

  /************ initial fetch ************/
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/login');
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Loading profile for user:', session.user.id);
        
        // try to read row; create blank if missing
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error?.code === 'PGRST116') {
          console.log('Profile not found, creating new profile');
          // Create a new profile with just the ID first
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: session.user.id }]);
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }

          // Fetch the newly created profile
          const { data: newData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (fetchError) throw fetchError;
          data = newData;
        } else if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        if (data) {
          console.log('Profile data loaded:', data);
          setProfile({
            full_name: data.full_name ?? '',
            username: data.username ?? '',
            phone_number: data.phone_number ?? '',
            company: data.company ?? '',
            position: data.position ?? '',
            bio: data.bio ?? '',
          });
        }
      } catch (err: any) {
        console.error('Profile error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, supabase]);

  /************ save ************/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Saving profile for user:', session.user.id);
      console.log('Profile data to save:', profile);

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error saving profile:', error);
        throw error;
      }

      console.log('Profile saved successfully');
      await refreshProfile();
      setSuccess('Profile updated successfully!');
      
      // Only redirect after successful save
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            { label: 'Full Name', key: 'full_name', type: 'text' },
            { label: 'Username', key: 'username', type: 'text' },
            { label: 'Phone Number', key: 'phone_number', type: 'tel' },
            { label: 'Company', key: 'company', type: 'text' },
            { label: 'Position', key: 'position', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={(profile as any)[key]}
                onChange={(e) =>
                  setProfile({ ...profile, [key]: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              rows={4}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
