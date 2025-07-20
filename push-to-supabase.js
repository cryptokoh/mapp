#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://nkfoxyaxtkfwsncunqne.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZm94eWF4dGtmd3NuY3VucW5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk1NDI0OCwiZXhwIjoyMDY4NTMwMjQ4fQ.oBG59jl0tPPyoQw0MBff09i1NSoCNzy8ieOHBniUytU';

// Create Supabase client with service role (has admin privileges)
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQLScript() {
  try {
    console.log('🚀 Setting up Supabase database with service role...');
    
    // Read the SQL setup file
    const sqlPath = path.join(__dirname, 'supabase-setup.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ SQL setup file not found:', sqlPath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Read SQL setup script successfully');
    
    // Clean and prepare SQL statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT \''));
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`\n[${i+1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
        
        try {
          // Use the REST API to execute raw SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            // Try alternative approach using direct query
            const { error } = await supabase.rpc('query', { sql: statement });
            if (error) {
              console.log('⚠️  Warning:', error.message);
              // Continue with next statement
            } else {
              console.log('✅ Success');
            }
          } else {
            console.log('✅ Success');
          }
        } catch (error) {
          console.log('⚠️  Warning:', error.message);
          // Continue with next statement
        }
      }
    }
    
    console.log('\n🧪 Testing database setup...');
    
    // Test the setup by checking if table exists and querying it
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Database test failed:', error.message);
        console.log('\n📝 Manual setup required. Please run the SQL in Supabase Dashboard:');
        console.log('1. Go to https://app.supabase.com');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Run the contents of supabase-setup.sql');
      } else {
        console.log('✅ Database setup completed successfully!');
        
        // Get count of entries
        const { count } = await supabase
          .from('leaderboard')
          .select('*', { count: 'exact', head: true });
        
        console.log(`📊 Found ${count || 0} entries in leaderboard table`);
        console.log('\n🎉 Setup complete! Your leaderboard is ready to use.');
        console.log('🧪 Test it by clicking the "Test Supabase" button in your Mini App');
      }
      
    } catch (error) {
      console.error('❌ Final test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

console.log('🏆 SuperInu River - Supabase Database Setup');
console.log('==========================================');
executeSQLScript();