import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

export async function shareTranscription(transcriptionId: string, email: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Cloud sync not configured');

  // Look up user by email
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', (
      await supabase.rpc('get_user_id_by_email', { email_input: email })
    ).data);

  if (!profiles?.length) {
    throw new Error('User not found. They need to create an account first.');
  }

  const targetUserId = profiles[0].id;
  const userId = useAuthStore.getState().user?.id;
  if (targetUserId === userId) throw new Error('Cannot share with yourself');

  // Add to shared_with array
  const { error } = await supabase.rpc('add_shared_user', {
    transcription_id: transcriptionId,
    target_user_id: targetUserId,
  });

  if (error) throw new Error(error.message);
}

export async function removeSharedUser(transcriptionId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_shared_user', {
    transcription_id: transcriptionId,
    target_user_id: targetUserId,
  });
  if (error) throw new Error(error.message);
}

export async function getSharedTranscriptions(): Promise<Array<{ id: string; title: string; mode: string; ownerName: string; createdAt: number }>> {
  if (!isSupabaseConfigured()) return [];

  const userId = useAuthStore.getState().user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('transcriptions')
    .select('id, title, mode, created_at, user_id')
    .contains('shared_with', [userId])
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    mode: row.mode,
    ownerName: row.user_id,
    createdAt: row.created_at,
  }));
}
