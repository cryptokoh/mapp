import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL');
  process.exit(1);
}

// Create admin client with service role key if available
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createClient(supabaseUrl, supabaseAnonKey);

console.log('🔐 Using:', supabaseServiceKey ? 'Service Role Key (Admin)' : 'Anon Key (Limited)');

async function deleteTestData() {
  try {
    console.log('🧹 Attempting to delete test data...\n');
    
    // First, show current data
    const { data: allEntries, error: fetchError } = await supabase
      .from('leaderboard')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Failed to fetch entries:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${allEntries?.length || 0} entries:\n`);
    allEntries?.forEach((entry, i) => {
      console.log(`${i + 1}. ${entry.username} (fid: ${entry.fid}) - ${entry.score} points`);
    });
    
    const testEntries = allEntries?.filter(entry => 
      entry.username.toLowerCase().startsWith('testuser')
    ) || [];
    
    if (testEntries.length === 0) {
      console.log('\n✅ No test entries to delete');
      return;
    }
    
    console.log(`\n🗑️  Found ${testEntries.length} test entries to delete`);
    
    if (!supabaseServiceKey) {
      console.log('\n⚠️  WARNING: Using anon key - deletion may fail due to RLS policies');
      console.log('To delete data, you need the service role key.');
      console.log('\n📝 To get your service role key:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to Settings > API');
      console.log('4. Copy the "service_role" key (keep it secret!)');
      console.log('5. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
      console.log('\nAlternatively, you can:');
      console.log('- Use the SQL Editor in Supabase dashboard');
      console.log('- Run: DELETE FROM leaderboard WHERE username LIKE \'testuser%\';');
    }
    
    // Try to delete anyway
    for (const entry of testEntries) {
      const { error } = await supabase
        .from('leaderboard')
        .delete()
        .eq('id', entry.id);
      
      if (error) {
        console.error(`\n❌ Failed to delete ${entry.username}:`, error.message);
        if (error.code === '42501') {
          console.log('This is a permission error - RLS policy is blocking deletes');
        }
      } else {
        console.log(`✅ Deleted ${entry.username}`);
      }
    }
    
    // Verify deletion
    const { data: remaining } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false });
    
    console.log(`\n📊 Remaining entries: ${remaining?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'delete-test':
    deleteTestData();
    break;
  
  case 'list':
    listEntries();
    break;
  
  case 'help':
  default:
    console.log('Supabase Admin CLI\n');
    console.log('Commands:');
    console.log('  node supabase-admin.js list          - List all leaderboard entries');
    console.log('  node supabase-admin.js delete-test   - Delete test entries');
    console.log('  node supabase-admin.js help          - Show this help');
    break;
}

async function listEntries() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Leaderboard (${data?.length || 0} entries):\n`);
  data?.forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.username} - ${entry.score} points (fid: ${entry.fid})`);
  });
}