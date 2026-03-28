import { Request, Response } from 'express';
import { aiService } from '../services/AIService';
import { projectRepository } from '../repositories/ProjectRepository';
import { taskRepository } from '../repositories/TaskRepository';

/**
 * AI Controller
 * Handles AI-powered features like project summarization
 */
export class AIController {
  /**
   * POST /api/ai/summarize-project/:projectId
   * Generate AI-powered project summary
   * Requires AI_SUMMARIZER feature and usage limit check (handled by middleware)
   */
  async summarizeProject(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tenantId = user.tenantId;
      const projectId = req.params.projectId;

      // Fetch project details
      const project = await projectRepository.findById(projectId, tenantId);
      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      // Fetch all tasks for the project
      const tasks = await taskRepository.findByProjectId(projectId, tenantId);

      // Generate AI summary
      const result = await aiService.generateProjectSummary(
        project.name,
        project.description || '',
        tasks
      );

      res.status(200).json({
        success: true,
        data: {
          project: {
            id: project.id,
            name: project.name,
          },
          summary: result.summary,
          insights: result.insights,
          recommendations: result.recommendations,
          taskCount: tasks.length,
          completionRate: tasks.length > 0
            ? Math.round((tasks.filter(t => t.status === 'done' ).length / tasks.length) * 100)
            : 0,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('AI summarization error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_ERROR',
          message: 'Failed to generate project summary. Please try again.',
        },
      });
    }
  }

  /**
   * GET /api/ai/health
   * Check if AI service is available
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = await aiService.healthCheck();

      res.status(200).json({
        success: true,
        data: {
          available: isHealthy,
          provider: 'AWS Bedrock',
          model: 'Claude 3 Haiku',
        },
      });
    } catch (error) {
      res.status(200).json({
        success: true,
        data: {
          available: false,
          provider: 'AWS Bedrock',
          model: 'Claude 3 Haiku',
          fallback: 'Basic summarization available',
        },
      });
    }
  }
}

export const aiController = new AIController();
