-- Create user if not exists
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'horiznn7@gmail.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'horiznn7@gmail.com',
            crypt('JEDh2007', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now(),
            'authenticated',
            '',
            '',
            '',
            ''
        );

        -- Add admin role
        -- Note: user_roles table was mentioned in the history as being created in schema private
        -- But let's check where it actually is. History said "Criei a tabela user_roles... em schema private".
        -- Let's check schemas first.
    END IF;
END $$;
