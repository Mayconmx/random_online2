import { supabase } from './supabase';

const TABLE = 'rooms';

export const registerPresence = async (peerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'User not authenticated' };

    // upsert: insert or update if constraint matches
    const { error } = await supabase
        .from(TABLE)
        .upsert({ user_id: user.id, peer_id: peerId, status: 'waiting', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) console.error('Error registering presence:', error);
    return { error };
};

export const updateStatus = async (status: 'waiting' | 'chatting') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from(TABLE)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
};

export const findRandomPeer = async (myPeerId: string): Promise<{ peerId: string | null, error: any }> => {
    // Get all waiting users excluding self
    // Note: For high scale, this should be done with a robust backend function or more randomness.
    // For this scale, client-side random selection from a small list is fine.

    const { data, error } = await supabase
        .from(TABLE)
        .select('peer_id')
        .eq('status', 'waiting')
        .neq('peer_id', myPeerId)
        .limit(20); // Get a batch of waiting users

    if (error) return { peerId: null, error };
    if (!data || data.length === 0) return { peerId: null, error: null };

    // Pick one at random
    const randomPeer = data[Math.floor(Math.random() * data.length)];
    return { peerId: randomPeer.peer_id, error: null };
};

export const removePresence = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from(TABLE)
        .delete()
        .eq('user_id', user.id);
};
