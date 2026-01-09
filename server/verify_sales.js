const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let salesToken = '';

async function runTests() {
    console.log('--- Starting Sales Module Verification ---');

    try {
        // 1. Login as Sales Manager
        console.log('1. Login as Sales Manager...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'sales_mgr@ems.com',
            password: 'password123'
        });
        // Assuming backend returns token in body or we use cookie jar. 
        // Since our backend sets httpOnly cookie, axios won't carry it automatically without a jar.
        // However, our backend ALSO returns token in body in sendTokenResponse (token var).
        if (loginRes.data.success) {
            salesToken = loginRes.data.token;
            console.log('   [PASS] Login Successful');
        } else {
            throw new Error('Login failed');
        }

        // 2. Create Prospect
        console.log('2. Create Prospect...');
        const prospectRes = await axios.post(`${BASE_URL}/sales`, {
            clientName: 'Test Client',
            clientPhone: '555-0199',
            companyName: 'Test Corp',
            price: 5000,
            notes: 'Interested in premium plan'
        }, { headers: { Authorization: `Bearer ${salesToken}` } });

        const saleId = prospectRes.data.data._id;
        console.log('   [PASS] Prospect Created:', saleId);

        // 3. Convert to Sale
        console.log('3. Convert to Sale...');
        await axios.put(`${BASE_URL}/sales/${saleId}/convert`, {
            payment: {
                amount: 5000,
                collectedAmount: 1000,
                paymentType: 'Partial'
            }
        }, { headers: { Authorization: `Bearer ${salesToken}` } });
        console.log('   [PASS] Converted to Sale');

        // 4. Push to Backend
        console.log('4. Push to Backend...');
        await axios.put(`${BASE_URL}/sales/${saleId}/push`, {
            checklist: {
                emailSent: true,
                whatsappGroupCreated: true
            }
        }, { headers: { Authorization: `Bearer ${salesToken}` } });
        console.log('   [PASS] Pushed to Backend');

        // 5. Verify Locked
        console.log('5. Verify Layout Lock...');
        try {
            await axios.put(`${BASE_URL}/sales/${saleId}/convert`, {
                payment: { amount: 5000, collectedAmount: 5000 }
            }, { headers: { Authorization: `Bearer ${salesToken}` } });
            console.error('   [FAIL] Should have been locked!');
        } catch (err) {
            if (err.response.status === 403) {
                console.log('   [PASS] Record is correctly locked (403)');
            } else {
                console.error('   [FAIL] Expected 403, got', err.response.status);
            }
        }

    } catch (err) {
        console.error('TEST FAILED:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

runTests();
