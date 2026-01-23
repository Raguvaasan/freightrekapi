/**
 * Markup API Service
 * 
 * This service replaces localStorage with backend API calls for markup management
 * Copy this file to your frontend project's services folder
 */

import axios from 'axios';

const API_BASE_URL = 'https://freightrekapi.vercel.app/api/v1/settings';

export interface MarkupConfig {
  id: string;
  markup_category: 'rate_calculator' | 'rate_card';
  markup_type: 'percentage' | 'fixed';
  markup_value: number;
  user_id?: string;
  franchise_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarkupServiceResponse {
  success: boolean;
  data: MarkupConfig | null;
  message?: string;
}

class MarkupService {
  private getAuthToken(): string {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    return token;
  }

  /**
   * Get Rate Calculator Markup
   * Priority: User > Franchise > Global
   */
  async getRateCalculatorMarkup(userId?: string, franchiseId?: string): Promise<MarkupConfig | null> {
    try {
      const token = this.getAuthToken();
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (franchiseId) params.append('franchise_id', franchiseId);
      
      const url = `${API_BASE_URL}/rate-calculator-markup${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get<MarkupServiceResponse>(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No markup configured
      }
      console.error('Error fetching rate calculator markup:', error);
      throw error;
    }
  }

  /**
   * Save Rate Calculator Markup (Create or Update)
   */
  async saveRateCalculatorMarkup(
    markupType: 'percentage' | 'fixed',
    markupValue: number,
    userId?: string,
    franchiseId?: string
  ): Promise<MarkupConfig> {
    try {
      const token = this.getAuthToken();
      const response = await axios.post<MarkupServiceResponse>(
        `${API_BASE_URL}/rate-calculator-markup`,
        {
          markup_type: markupType,
          markup_value: markupValue,
          user_id: userId || null,
          franchise_id: franchiseId || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to save markup');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error saving rate calculator markup:', error);
      throw error;
    }
  }

  /**
   * Get Rate Card Markup
   * Priority: User > Franchise > Global
   */
  async getRateCardMarkup(userId?: string, franchiseId?: string): Promise<MarkupConfig | null> {
    try {
      const token = this.getAuthToken();
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (franchiseId) params.append('franchise_id', franchiseId);
      
      const url = `${API_BASE_URL}/rate-card-markup${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get<MarkupServiceResponse>(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No markup configured
      }
      console.error('Error fetching rate card markup:', error);
      throw error;
    }
  }

  /**
   * Save Rate Card Markup (Create or Update)
   */
  async saveRateCardMarkup(
    markupType: 'percentage' | 'fixed',
    markupValue: number,
    userId?: string,
    franchiseId?: string
  ): Promise<MarkupConfig> {
    try {
      const token = this.getAuthToken();
      const response = await axios.post<MarkupServiceResponse>(
        `${API_BASE_URL}/rate-card-markup`,
        {
          markup_type: markupType,
          markup_value: markupValue,
          user_id: userId || null,
          franchise_id: franchiseId || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to save markup');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error saving rate card markup:', error);
      throw error;
    }
  }

  /**
   * Helper: Apply markup to a base rate
   */
  applyMarkup(baseRate: number, markupType: 'percentage' | 'fixed', markupValue: number): number {
    if (markupType === 'percentage') {
      return baseRate + (baseRate * markupValue / 100);
    } else {
      return baseRate + markupValue;
    }
  }

  /**
   * Helper: Calculate markup amount
   */
  calculateMarkupAmount(baseRate: number, markupType: 'percentage' | 'fixed', markupValue: number): number {
    if (markupType === 'percentage') {
      return baseRate * markupValue / 100;
    } else {
      return markupValue;
    }
  }

  /**
   * Migration Helper: Clean up old localStorage values
   */
  cleanupLocalStorage(): void {
    localStorage.removeItem('rateMarkup');
    localStorage.removeItem('rateMarkupType');
    localStorage.removeItem('rateCardMarkup');
    localStorage.removeItem('rateCardMarkupType');
  }
}

// Export singleton instance
export const markupService = new MarkupService();

// Export class for testing
export default MarkupService;
