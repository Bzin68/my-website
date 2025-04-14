document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('error-message');
    
    // Simple client-side validation
    if (!username || !password) {
        errorElement.textContent = 'Please fill in all fields';
        return;
    }
    
    // Send login request to server
    loginUser(username, password);
});

async function loginUser(username, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'dashboard.html'; // Redirect after login
        } else {
            // Login failed
            document.getElementById('error-message').textContent = data.message || 'Login failed';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('error-message').textContent = 'Network error. Please try again.';
    }
}

// Check login status on page load
function checkLogin() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
    }
}

// Call this when the page loads
window.onload = checkLogin;