import { supabase } from './supabase';
import { User } from '../types';

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) return null;

  const { user } = session;
  return {
    id: user.id,
    email: user.email!,
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
    country: user.user_metadata?.country
  };
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Falha no login');

  return {
    id: data.user.id,
    email: data.user.email!,
    username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
    country: data.user.user_metadata?.country
  };
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const signup = async (email: string, password: string, username: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Falha no cadastro');

  return {
    id: data.user.id,
    email: data.user.email!,
    username: data.user.user_metadata?.username || username,
    country: undefined
  };
};