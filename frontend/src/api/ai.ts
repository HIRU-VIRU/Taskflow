import apiClient from './client';

interface ProjectSummary {
  project: {
    id: string;
    name: string;
  };
  summary: string;
  insights: string[];
  recommendations: string[];
  taskCount: number;
  completionRate: number;
  generatedAt: string;
}

interface AIHealthResponse {
  available: boolean;
  provider: string;
  model: string;
  fallback?: string;
}

export const aiApi = {
  /**
   * Generate AI-powered project summary
   */
  async summarizeProject(projectId: string): Promise<ProjectSummary> {
    return (await apiClient.post<any>(`/ai/summarize-project/${projectId}`)) as any;
  },

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<AIHealthResponse> {
    return (await apiClient.get<any>('/ai/health')) as any;
  },
};
