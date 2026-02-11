/**
 * Test script to verify wallet limit error handling
 * This tests the order creation API when wallet balance is insufficient
 */

const API_URL = 'http://localhost:3000';

async function testWalletLimit() {
  try {
    console.log('🧪 Testing Wallet Limit Error Handling\n');

    // Step 1: Login as franchise
    console.log('1️⃣ Logging in as franchise...');
    const loginResponse = await fetch(`${API_URL}/admin/agency/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test@franchise.com', // Update with your test franchise
        password: 'password123'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', loginResponse.status, loginData);

    if (!loginData.success) {
      console.error('❌ Login failed. Please update credentials in test file.');
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful\n');

    // Step 2: Check current wallet balance
    console.log('2️⃣ Checking wallet balance...');
    const walletResponse = await fetch(`${API_URL}/wallet/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const walletData = await walletResponse.json();
    console.log('Wallet Balance:', walletData);
    const currentBalance = walletData.balance || 0;
    console.log(`Current Balance: ₹${currentBalance}\n`);

    // Step 3: Try to create order with amount > wallet balance
    const orderAmount = currentBalance + 1000; // More than balance
    console.log(`3️⃣ Creating Prepaid order with amount ₹${orderAmount} (exceeds balance)...`);

    const orderResponse = await fetch(`${API_URL}/shipment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Customer',
        add: '123 Test Street',
        pin: '600001',
        city: 'Chennai',
        state: 'Tamil Nadu',
        phone: '9876543210',
        order: 'TEST001',
        paymentMode: 'Prepaid',
        totalAmount: orderAmount.toString(),
        weight: '1',
        pickupLocation: {
          name: 'Test Location'
        }
      }),
    });

    const orderData = await orderResponse.json();
    
    console.log('\n📋 ORDER CREATION RESPONSE:');
    console.log('Status Code:', orderResponse.status);
    console.log('Response Body:', JSON.stringify(orderData, null, 2));

    // Verify error response
    if (orderResponse.status === 400 && orderData.success === false) {
      console.log('\n✅ SUCCESS! Error handling is working correctly.');
      console.log('❌ Status: 400 (Bad Request)');
      console.log('📝 Error Message:', orderData.message);
    } else if (orderResponse.status === 200 || orderResponse.status === 201) {
      console.log('\n⚠️  PROBLEM DETECTED!');
      console.log('Expected: Status 400 with error message');
      console.log('Received: Status', orderResponse.status, 'with success response');
    } else {
      console.log('\n❓ Unexpected response. Check the details above.');
    }

    // Step 4: Try with sufficient balance (COD order - should work)
    console.log('\n4️⃣ Testing COD order (should work without wallet check)...');
    const codResponse = await fetch(`${API_URL}/shipment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Customer',
        add: '123 Test Street',
        pin: '600001',
        city: 'Chennai',
        state: 'Tamil Nadu',
        phone: '9876543210',
        order: 'TEST002',
        paymentMode: 'COD',
        codAmount: '500',
        weight: '1',
        pickupLocation: {
          name: 'Test Location'
        }
      }),
    });

    const codData = await codResponse.json();
    console.log('COD Order Status:', codResponse.status);
    console.log('COD Order Response:', codData.success ? '✅ Created' : '❌ Failed');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run the test
testWalletLimit();
