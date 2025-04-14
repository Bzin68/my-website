// Initialize Supabase
const supabase = createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_SUPABASE_KEY'
  );
  
  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p class="loading">Uploading...</p>';
  
    try {
      const file = document.getElementById('fileInput').files[0];
      const text = document.getElementById('textInput').value;
  
      // Verify user session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Please sign in first');
      }
  
      // Prepare file data
      const fileData = await file.arrayBuffer();
  
      // Call Netlify Function
      const response = await fetch('/.netlify/functions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          fileData: Array.from(new Uint8Array(fileData)),
          fileName: file.name,
          token: session.access_token
        })
      });
  
      const result = await response.json();
      
      if (response.ok) {
        resultDiv.innerHTML = `
          <div class="success">
            <p>✅ Upload successful!</p>
            <a href="${result.fileUrl}" target="_blank">View File</a>
          </div>
        `;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="error">
          <p>❌ Error: ${error.message}</p>
          ${error.message.includes('sign in') ? 
            '<a href="/login.html">Go to Login</a>' : ''}
        </div>
      `;
      console.error(error);
    }
  });