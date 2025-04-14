// netlify/functions/upload.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  try {
    // Parse incoming data
    const { text, fileData, fileName, token } = JSON.parse(event.body);

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw new Error('Unauthorized');

    // Upload file to Supabase Storage
    const { data: file, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(`user_${user.id}/${Date.now()}_${fileName}`, Buffer.from(fileData), {
        contentType: 'arraybuffer'
      });

    if (uploadError) throw uploadError;

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('user_uploads')
      .insert({ 
        text_content: text, 
        file_path: file.path, 
        user_id: user.id 
      });

    if (dbError) throw dbError;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        fileUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/user-uploads/${file.path}`
      })
    };

  } catch (error) {
    return {
      statusCode: error.message === 'Unauthorized' ? 401 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};