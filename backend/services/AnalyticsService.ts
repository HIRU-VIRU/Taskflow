import { projectService } from './ProjectService';
import { taskService } from './TaskService';
import { userService } from './UserService';

export class AnalyticsService {
  /**
   * Get dashboard analytics (requires VIEW_ANALYTICS feature)
   */
  async getDashboard(tenantId: string): Promise<{
    projectCount: number;
    tasksByStatus: Record<string, number>;
    userCount: number;
  }> {
    const [projectCount, tasksByStatus, userCount] = await Promise.all([
      projectService.getCount(tenantId),
      taskService.getCountByStatus(tenantId),
      userService.getCount(tenantId),
    ]);

    return {
      projectCount,
      tasksByStatus,
      userCount,
    };
  }
}

export const analyticsService = new AnalyticsService();
