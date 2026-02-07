/**
 * Wallet Service - Frontend Integration
 * 
 * This service handles wallet operations including payment creation and verification
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface PaymentOrderResponse {
  success: boolean;
  orderId: string;
  sessionId: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  newBalance: number;
  message?: string;
}

interface BalanceResponse {
  success: boolean;
  balance: number;
  currency: string;
}

export const walletService = {
  /**
   * Get current wallet balance
   */
  async getBalance(token: string): Promise<BalanceResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/wallet/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Create a payment order for wallet recharge
   * @param amount - Amount to recharge (in INR)
   * @param paymentMethod - Payment method (upi, card, netbanking, wallet)
   * @param token - JWT auth token
   */
  async createPaymentOrder(
    amount: number,
    paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet',
    token: string
  ): Promise<PaymentOrderResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/api/wallet/create-payment-order`,
      {
        amount,
        paymentMethod,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Verify payment after redirect from Cashfree
   * @param orderId - Order ID from URL parameter
   * @param token - JWT auth token
   * 
   * NOTE: paymentId is now optional - the backend will fetch it from Cashfree
   */
  async verifyPayment(orderId: string, token: string): Promise<VerifyPaymentResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/api/wallet/verify-payment`,
      {
        orderId,
        // paymentId is optional - backend will fetch from Cashfree
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Get transaction history
   * @param token - JWT auth token
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   * @param type - Filter by transaction type (optional)
   */
  async getTransactions(
    token: string,
    page = 1,
    limit = 20,
    type?: 'credit' | 'debit' | 'refund' | 'reversal'
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/wallet/transactions?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};

/**
 * Example usage in payment callback page:
 * 
 * // pages/admin/wallet/payment-callback.tsx
 * 
 * import { useEffect, useState } from 'react';
 * import { useRouter } from 'next/router';
 * import { walletService } from '@/services/walletService';
 * 
 * export default function PaymentCallback() {
 *   const router = useRouter();
 *   const { order_id } = router.query;
 *   const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
 * 
 *   useEffect(() => {
 *     async function verifyPayment() {
 *       if (!order_id) return;
 * 
 *       try {
 *         const token = localStorage.getItem('authToken');
 *         if (!token) {
 *           router.push('/login');
 *           return;
 *         }
 * 
 *         // Verify the payment - only orderId is needed
 *         const result = await walletService.verifyPayment(order_id as string, token);
 * 
 *         if (result.success && result.status === 'SUCCESS') {
 *           setStatus('success');
 *           // Show success message with new balance
 *           console.log('Payment successful!', result);
 *           
 *           // Redirect to wallet page after 2 seconds
 *           setTimeout(() => {
 *             router.push('/admin/wallet/add');
 *           }, 2000);
 *         } else {
 *           setStatus('failed');
 *         }
 *       } catch (error) {
 *         console.error('Payment verification failed:', error);
 *         setStatus('failed');
 *       }
 *     }
 * 
 *     verifyPayment();
 *   }, [order_id, router]);
 * 
 *   return (
 *     <div className="payment-callback">
 *       {status === 'loading' && <p>Verifying payment...</p>}
 *       {status === 'success' && <p>Payment successful! Redirecting...</p>}
 *       {status === 'failed' && <p>Payment failed. Please try again.</p>}
 *     </div>
 *   );
 * }
 */
