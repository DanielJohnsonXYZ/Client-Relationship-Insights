-- Force refresh Supabase schema cache
SELECT pg_reload_conf();
NOTIFY pgrst, 'reload schema';

-- Verify table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gmail_accounts' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'gmail_accounts';
EOF < /dev/null