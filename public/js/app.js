const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('upload-button').onclick = async () => {
    const fileInput = document.getElementById('image');
    const description = document.getElementById('description').value;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const { data, error } = await supabase.storage.from('images').upload(`public/${file.name}`, file);

        if (error) {
            console.error('Error uploading file:', error);
            alert('Upload failed. Please try again.');
            return;
        }

        const url = `${supabaseUrl}/storage/v1/object/public/images/public/${file.name}`;
        const { error: insertError } = await supabase
            .from('images')
            .insert([{ url, description }]);

        if (insertError) {
            console.error('Error inserting image:', insertError);
            alert('Error saving image data. Please try again.');
        } else {
            alert('Image uploaded successfully!');
            loadImages(); // Reload images after upload
            fileInput.value = ''; // Clear file input
            document.getElementById('description').value = ''; // Clear description
        }
    } else {
        alert('Please select an image to upload.');
    }
};

async function loadImages() {
    const { data: images, error } = await supabase.from('images').select('*');

    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear existing images

    if (error) {
        console.error('Error loading images:', error);
        return;
    }

    images.forEach(image => {
        const imgElement = document.createElement('div');
        imgElement.innerHTML = `
            <img src="${image.url}" alt="${image.description}" style="width: 200px; height: auto;" />
            <p>${image.description}</p>
        `;
        gallery.appendChild(imgElement);
    });
}

// Load images on page load
loadImages();
