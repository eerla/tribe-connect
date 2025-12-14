// scripts/test-supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
  // sign up (use random email to avoid collisions)
  // const user = `test1`;
  const email = `bentyler60@gmail.com`;
  const pw = 'admintest1!';
  console.log('Signing up', email);
  const { data: sign, error: signErr } = await supabase.auth.signUp({ email, password: pw });
  console.log(signErr || sign);

  // wait and sign in
  const { data: signin, error: sErr } = await supabase.auth.signInWithPassword({ email, password: pw });
  console.log(sErr || signin);

  const user = (await supabase.auth.getUser()).data.user;
  console.log('user id', user?.id);

  // create profile
  const { error: upErr } = await supabase.from('profiles').upsert({ id: user.id, full_name: 'Test User' });
  if (upErr) console.error('profile upsert error', upErr);
  else console.log('profile created');

  // create tribe
  const { data: tribe } = await supabase.from('tribes').insert([{ owner: user.id, title: 'Test Tribe', slug: `test-${Date.now()}`, city: 'TestCity' }]).select().single();
  console.log('tribe created', tribe);

  // create event
  const { data: event } = await supabase.from('events').insert([{ tribe_id: tribe.id, organizer: user.id, title: 'Test Event', starts_at: new Date().toISOString() }]).select().single();
  console.log('event created', event);
}

main().catch(console.error);
