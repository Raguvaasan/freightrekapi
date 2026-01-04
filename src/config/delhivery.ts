export interface DelhiveryConfig {
  apiBaseUrl: string;
  apiKey: string;
}

export const delhiveryConfig: DelhiveryConfig = {
  apiBaseUrl: process.env.DELHIVERY_API_BASE_URL || "https://staging-external.delhivery.com",
  apiKey: process.env.DELHIVERY_API_KEY || "",
};
