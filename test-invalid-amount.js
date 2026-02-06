const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testInvalidAmount() {
  try {
    console.log('🧪 Testing Invalid Amount (₹0.50)\n');
    
    // Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@freightrek.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');
    
    // Test ₹0.50 amount (should fail)
    console.log('2️⃣ Testing with ₹0.50 (invalid - below minimum)...');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/create-payment-order`,
        {
          amount: 0.5,
          paymentMethod: 'upi'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('❌ UNEXPECTED: Should have failed but succeeded!');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.log('✅ CORRECTLY REJECTED ₹0.50!');
      console.log('   Error:', err.response?.data?.message || err.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testInvalidAmount();
