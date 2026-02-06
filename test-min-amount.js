const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMinimumAmount() {
  try {
    console.log('🧪 Testing Minimum Amount Validation (₹1)\n');
    
    // Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@freightrek.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!\n');
    
    // Test ₹1 amount
    console.log('2️⃣ Testing with ₹1 (minimum amount)...');
    try {
      const response1 = await axios.post(
        `${BASE_URL}/api/wallet/create-payment-order`,
        {
          amount: 1,
          paymentMethod: 'upi'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ SUCCESS with ₹1!');
      console.log('   Order ID:', response1.data.orderId);
      console.log('   Full Response:', JSON.stringify(response1.data, null, 2));
    } catch (err) {
      console.log('❌ FAILED with ₹1!');
      console.log('   Error:', err.response?.data?.message || err.message);
      console.log('   Full Error:', JSON.stringify(err.response?.data, null, 2));
    }
    
    console.log('\n3️⃣ Testing with ₹100...');
    try {
      const response100 = await axios.post(
        `${BASE_URL}/api/wallet/create-payment-order`,
        {
          amount: 100,
          paymentMethod: 'upi'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ SUCCESS with ₹100!');
      console.log('   Order ID:', response100.data.orderId);
      console.log('   Full Response:', JSON.stringify(response100.data, null, 2));
    } catch (err) {
      console.log('❌ FAILED with ₹100!');
      console.log('   Error:', err.response?.data?.message || err.message);
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMinimumAmount();
