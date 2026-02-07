const axios = require('axios');

async function testVerifyPayment() {
  const orderId = 'ORDER_697ccff8c13c521b28f76354_1770448639421';
  
  console.log('🔍 Testing payment verification for:', orderId);
  console.log('📍 API URL: https://freightrekapi.vercel.app/api/wallet/verify-payment');
  console.log('');
  
  try {
    // First, let's check if we need a token
    const response = await axios.post(
      'https://freightrekapi.vercel.app/api/wallet/verify-payment',
      {
        orderId: orderId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // No token - will fail but we can see the error
        },
        validateStatus: () => true, // Accept any status code
      }
    );

    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('');
      console.log('⚠️  Authentication required!');
      console.log('Your frontend needs to pass the user token.');
      console.log('');
      console.log('Frontend fix needed:');
      console.log('');
      console.log('const token = localStorage.getItem("authToken") || Cookies.get("token");');
      console.log('');
      console.log('axios.post(');
      console.log('  "https://freightrekapi.vercel.app/api/wallet/verify-payment",');
      console.log('  { orderId: order_id },');
      console.log('  { headers: { Authorization: `Bearer ${token}` } }');
      console.log(')');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

testVerifyPayment();
