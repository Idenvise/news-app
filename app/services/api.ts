import News from '@/interfaces/News';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl =
      process.env.EXPO_PUBLIC_API_URL ??
      'https://app-api.sm117.ru/api/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }
 
  public async getNews(): Promise<News[]> {
    const response = await fetch(`${this.baseUrl}/contract/news_for_test`, {
      method: 'GET',
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await this.responseHandler(response);
    return data;
  }

  private responseHandler = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || 'API request failed'
      );
      console.error('API Error:', errorData);
      throw error;
    }
    return await response.json();
  }
}
const api = new ApiClient();
export default api;
