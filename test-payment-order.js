const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPaymentOrderAPI() {
  try {
    console.log('🚀 Testing Payment Order API\n');
    
    // Step 1: Login to get JWT token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@freightrek.com',
      password: 'Admin@123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log('   Token:', token.substring(0, 20) + '...\n');
    
    // Step 2: Get wallet balance
    console.log('2️⃣ Getting wallet balance...');
    const balanceResponse = await axios.get(`${BASE_URL}/api/wallet/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Current balance:', balanceResponse.data);
    console.log();
    
    // Step 3: Create payment order
    console.log('3️⃣ Creating payment order...');
    const orderData = {
      amount: 500,
      paymentMethod: 'upi'
    };
    
    console.log('   Order details:', orderData);
    
    const orderResponse = await axios.post(
      `${BASE_URL}/api/wallet/create-payment-order`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Payment order created successfully!');
    console.log('   Order Response:', JSON.stringify(orderResponse.data, null, 2));
    console.log();
    
    // Step 4: Test with different payment methods
    console.log('4️⃣ Testing different payment methods...');
    
    const paymentMethods = ['card', 'netbanking', 'wallet'];
    
    for (const method of paymentMethods) {
      try {
        console.log(`   Testing ${method}...`);
        const response = await axios.post(
          `${BASE_URL}/api/wallet/create-payment-order`,
          {
            amount: 100,
            paymentMethod: method
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`   ✅ ${method}: Order ID = ${response.data.orderId}`);
      } catch (error) {
        console.log(`   ❌ ${method}: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the tests
testPaymentOrderAPI();
