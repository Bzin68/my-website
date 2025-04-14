const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Username and password are required' }),
        };
    }

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );

    try {
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('email')
            .eq('username', username)
            .single();

        if (fetchError || !userData) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid username' }),
            };
        }

        const email = userData.email;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: error.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ user: data.user, session: data.session }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' }),
        };
    }
};