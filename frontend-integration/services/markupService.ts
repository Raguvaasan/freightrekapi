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
  private buildParams(userId?: string, franchiseId?: string): string {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (franchiseId) params.append('franchise_id', franchiseId);
    return params.toString() ? '?' + params.toString() : '';
  }

  private async getMarkup(
    endpoint: 'rate-calculator-markup' | 'rate-card-markup',
    userId?: string,
    franchiseId?: string
  ): Promise<MarkupConfig | null> {
    try {
      const token = this.getAuthToken();
      const url = `${API_BASE_URL}/${endpoint}${this.buildParams(userId, franchiseId)}`;
      const response = await axios.get<MarkupServiceResponse>(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No markup configured
      }
      console.error(`Error fetching ${endpoint} markup:`, error);
      throw error;
    }
  }

  private async saveMarkup(
    endpoint: 'rate-calculator-markup' | 'rate-card-markup',
    markupType: 'percentage' | 'fixed',
    markupValue: number,
    userId?: string,
    franchiseId?: string
  ): Promise<MarkupConfig> {
    try {
      const token = this.getAuthToken();
      const response = await axios.post<MarkupServiceResponse>(
        `${API_BASE_URL}/${endpoint}`,
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
      console.error(`Error saving ${endpoint} markup:`, error);
      throw error;
    }
  }

  async getRateCalculatorMarkup(userId?: string, franchiseId?: string): Promise<MarkupConfig | null> {
    return this.getMarkup('rate-calculator-markup', userId, franchiseId);
  }

  async saveRateCalculatorMarkup(
    markupType: 'percentage' | 'fixed',
    markupValue: number,
    userId?: string,
    franchiseId?: string
  ): Promise<MarkupConfig> {
    return this.saveMarkup('rate-calculator-markup', markupType, markupValue, userId, franchiseId);
  }

  async getRateCardMarkup(userId?: string, franchiseId?: string): Promise<MarkupConfig | null> {
    return this.getMarkup('rate-card-markup', userId, franchiseId);
  }

  async saveRateCardMarkup(
    markupType: 'percentage' | 'fixed',
    markupValue: number,
    userId?: string,
    franchiseId?: string
  ): Promise<MarkupConfig> {
    return this.saveMarkup('rate-card-markup', markupType, markupValue, userId, franchiseId);
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
