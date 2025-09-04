-- CRITICAL SECURITY FIX: Secure the users table to prevent customer data theft
-- Issues identified:
-- 1. Overly permissive INSERT policy allows anyone to insert user records
-- 2. Missing proper authentication restrictions
-- 3. No UPDATE/DELETE policies for data management

-- Step 1: Remove the insecure INSERT policy
DROP POLICY IF EXISTS "Allow inserts" ON public.users;

-- Step 2: Create secure policies that require authentication and proper access control
-- Only allow authenticated users to insert their own record
CREATE POLICY "Users can insert their own record only" 
  ON public.users 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update only their own data
CREATE POLICY "Users can update their own data" 
  ON public.users 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Restrict DELETE operations to users managing their own data
CREATE POLICY "Users can delete their own data" 
  ON public.users 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = id);

-- Step 3: Add additional security measures
-- Prevent any anonymous access by ensuring all policies require authentication
-- (The existing SELECT policy already requires auth.uid() = id which is good)

-- Step 4: Add data validation constraints to prevent malicious input
-- Ensure email format is valid
ALTER TABLE public.users ADD CONSTRAINT valid_email 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure name is not empty and reasonable length
ALTER TABLE public.users ADD CONSTRAINT valid_name 
  CHECK (length(trim(name)) > 0 AND length(name) <= 100);

-- Add security documentation
COMMENT ON TABLE public.users IS 'SECURITY: Contains sensitive customer PII. All operations require authentication and users can only access their own data. Email validation enforced.';
COMMENT ON POLICY "Users can insert their own record only" ON public.users IS 'SECURITY: Prevents unauthorized user creation - only authenticated users can create records with their own auth.uid()';
COMMENT ON POLICY "Users can update their own data" ON public.users IS 'SECURITY: Ensures users can only modify their own personal information';
COMMENT ON POLICY "Users can delete their own data" ON public.users IS 'SECURITY: Allows users to delete their own data for GDPR compliance';