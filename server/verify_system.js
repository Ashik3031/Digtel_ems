const axios = require('axios');
const { assert } = require('console');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let adminCookie = '';

async function runTests() {
    console.log('--- Starting System Verification ---');

    try {
        // 1. Test Login (Super Admin)
        console.log('1. Testing Login (Super Admin)...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@ems.com',
            password: 'password123'
        });

        if (loginRes.data.success && loginRes.data.user.role === 'Super Admin') {
            console.log('   [PASS] Login Successful. Role: Super Admin');
            // Extract cookie if possible, but axios doesn't store it auto without jar.
            // For API test, we might need the token if we returned it. 
            // Our controller returns { token, user }.
            adminToken = loginRes.data.token;
        } else {
            console.error('   [FAIL] Login Failed');
            process.exit(1);
        }

        // 2. Test User Creation (RBAC)
        console.log('2. Testing Create User (Super Admin)...');
        const newUser = {
            name: 'Test HR',
            email: `testhr_${Date.now()}@ems.com`,
            password: 'password123',
            role: 'HR'
        };

        try {
            const createRes = await axios.post(`${BASE_URL}/users`, newUser, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (createRes.data.success) {
                console.log('   [PASS] User Creation Successful');
            }
        } catch (err) {
            console.error('   [FAIL] User Creation Faied:', err.response?.data || err.message);
        }

        // 3. Test Rate Limiting
        console.log('3. Testing Rate Limiting (Firing 105 requests)...');
        let blocked = false;
        // We configured limit 100 per 15 min.
        // We need to fire > 100 requests.
        const promises = [];
        for (let i = 0; i < 110; i++) {
            promises.push(
                axios.get('http://localhost:5000/', { validateStatus: false })
            );
        }

        const responses = await Promise.all(promises);
        const tooManyRequests = responses.filter(r => r.status === 429);

        if (tooManyRequests.length > 0) {
            console.log(`   [PASS] Rate Limiting Working. blocked ${tooManyRequests.length} requests.`);
            blocked = true;
        } else {
            console.warn('   [WARN] Rate Limiting might not be strict enough or window is large.');
        }

        // 4. Test Forgot Password (Stub)
        console.log('4. Testing Forgot Password...');
        try {
            const fpRes = await axios.post(`${BASE_URL}/auth/forgotpassword`, {
                email: 'admin@ems.com'
            });
            if (fpRes.data.resetToken) {
                console.log('   [PASS] Forgot Password Stub Working');
            }
        } catch (err) {
            console.error('   [FAIL] Forgot Password Failed');
        }

    } catch (err) {
        console.error('GLOBAL TEST FAILED:', err.message);
        if (err.response) console.error(err.response.data);
    }

    console.log('--- Verification Complete ---');
}

runTests();
