const supabase = createClient(
    'YOUR_SUPABASE_URL',  // Replace with your actual URL
    'YOUR_SUPABASE_KEY'   // Replace with your anon key
  );
  
  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'Uploading...';
  
    try {
      const file = document.getElementById('fileInput').files[0];
      const text = document.getElementById('textInput').value;
  
      // Get session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
  
      // Read file as ArrayBuffer
      const fileData = await file.arrayBuffer();
  
      // Call Netlify Function
      const response = await fetch('/.netlify/functions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          fileData: Array.from(new Uint8Array(fileData)), // Convert to serializable array
          fileName: file.name,
          token: session.access_token
        })
      });
  
      const result = await response.json();
      if (response.ok) {
        resultDiv.innerHTML = `
          <p>✅ Upload successful!</p>
          <a href="${result.fileUrl}" target="_blank">View File</a>
        `;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      resultDiv.textContent = `❌ Error: ${error.message}`;
      console.error(error);
    }
  });