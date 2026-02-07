// File: pages/admin/wallet/payment-callback.tsx (or wherever your callback page is)
// Replace your current payment-callback page code with this:

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function PaymentCallback() {
  const router = useRouter();
  const { order_id } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying payment...');
  const [amount, setAmount] = useState(0);
  const [newBalance, setNewBalance] = useState(0);

  useEffect(() => {
    async function verifyPayment() {
      if (!order_id) {
        console.log('❌ No order_id in URL');
        setStatus('failed');
        setMessage('Invalid payment link');
        return;
      }

      try {
        console.log('🔍 Verifying payment for order:', order_id);
        
        // Get token from wherever you store it (localStorage, cookies, etc.)
        const token = 
          localStorage.getItem('authToken') || 
          localStorage.getItem('token') ||
          sessionStorage.getItem('authToken') ||
          document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

        if (!token) {
          console.log('❌ No auth token found');
          setStatus('failed');
          setMessage('Please login and try again');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        console.log('📡 Calling API: /api/wallet/verify-payment');
        console.log('📦 Payload:', { orderId: order_id });

        // Call verify payment API - ONLY orderId needed (no paymentId)
        const response = await axios.post(
          'https://freightrekapi.vercel.app/api/wallet/verify-payment',
          {
            orderId: order_id, // Only orderId - backend will fetch paymentId from Cashfree
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ API Response:', response.data);

        if (response.data.success && response.data.status === 'SUCCESS') {
          setStatus('success');
          setAmount(response.data.amount);
          setNewBalance(response.data.newBalance);
          setMessage(response.data.message || 'Payment successful!');
          
          // Redirect to wallet page after 3 seconds
          setTimeout(() => {
            router.push('/admin/wallet/add');
          }, 3000);
        } else {
          console.log('❌ Payment verification failed:', response.data);
          setStatus('failed');
          setMessage(response.data.message || 'Payment verification failed');
        }
        
      } catch (error: any) {
        console.error('❌ Error verifying payment:', error);
        console.error('Error details:', error.response?.data);
        
        setStatus('failed');
        setMessage(
          error.response?.data?.message || 
          error.message || 
          'Payment verification failed. Please contact support.'
        );
      }
    }

    verifyPayment();
  }, [order_id, router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Loading State */}
        {status === 'loading' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>
              Verifying Payment...
            </h2>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Please wait while we confirm your payment
            </p>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
              Order: {order_id}
            </p>
          </>
        )}
        
        {/* Success State */}
        {status === 'success' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              backgroundColor: '#4caf50',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '48px', color: 'white' }}>✓</span>
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '15px', color: '#4caf50' }}>
              Payment Successful! 🎉
            </h2>
            <div style={{ 
              backgroundColor: '#e8f5e9', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <p style={{ fontSize: '18px', color: '#333', marginBottom: '10px' }}>
                <strong>Amount Added:</strong> ₹{amount}
              </p>
              <p style={{ fontSize: '18px', color: '#333' }}>
                <strong>New Balance:</strong> ₹{newBalance}
              </p>
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>
              {message}
            </p>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '15px' }}>
              Redirecting to wallet...
            </p>
          </>
        )}
        
        {/* Failed State */}
        {status === 'failed' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              backgroundColor: '#f44336',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '48px', color: 'white' }}>✗</span>
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '15px', color: '#f44336' }}>
              Payment Failed
            </h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
              {message}
            </p>
            <button
              onClick={() => router.push('/admin/wallet/add')}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                fontSize: '16px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '10px',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
            >
              Try Again
            </button>
          </>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
