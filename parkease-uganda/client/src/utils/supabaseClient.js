import { createClient } from '@supabase/supabase-js';
import api from './api';

let supabasePromise;

export const getSupabaseClient = async () => {
  if (!supabasePromise) {
    supabasePromise = api.get('/auth/public-config').then((res) => {
      const { supabaseUrl, supabaseAnonKey } = res.data.data;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase public configuration is missing.');
      }
      return createClient(supabaseUrl, supabaseAnonKey);
    });
  }

  return supabasePromise;
};
