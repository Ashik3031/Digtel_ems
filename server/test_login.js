const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@ems.com',
            password: 'password123'
        });
        console.log('Login Result:', response.data);
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
}

testLogin();
