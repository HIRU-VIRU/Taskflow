import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Task } from '../types';

/**
 * AI Service using AWS Bedrock
 * Provides AI-powered project summarization and insights
 */
export class AIService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    // Initialize AWS Bedrock client
    // Region can be set via AWS_REGION environment variable or default to us-east-1
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    // Using Claude 3 Haiku for fast, cost-effective summaries
    this.modelId = 'anthropic.claude-3-haiku-20240307-v1:0';
  }

  /**
   * Generate AI-powered project summary
   * @param projectName - Name of the project
   * @param projectDescription - Project description
   * @param tasks - Array of tasks in the project
   * @returns AI-generated summary and insights
   */
  async generateProjectSummary(
    projectName: string,
    projectDescription: string,
    tasks: Task[]
  ): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      // Prepare task statistics
      const taskStats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length,
      };

      // Create a concise task list for the AI
      const taskList = tasks.slice(0, 20).map(t =>
        `- [${t.status}] ${t.title}${t.assigned_to_name ? ' (assigned to ' + t.assigned_to_name + ')' : ''}`
      ).join('\n');

      const hasMoreTasks = tasks.length > 20;

      // Construct prompt
      const prompt = `You are a project management AI assistant. Analyze the following project and provide insights:

Project: ${projectName}
Description: ${projectDescription || 'No description provided'}

Task Statistics:
- Total Tasks: ${taskStats.total}
- To Do: ${taskStats.todo}
- In Progress: ${taskStats.inProgress}
- Done: ${taskStats.done}
- Completion Rate: ${taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%

Recent Tasks:
${taskList}
${hasMoreTasks ? `... and ${tasks.length - 20} more tasks` : ''}

Please provide:
1. A brief project summary (2-3 sentences)
2. Key insights about the project's progress and health (3-5 bullet points)
3. Actionable recommendations for improving project outcomes (3-4 bullet points)

Format your response as JSON with the following structure:
{
  "summary": "brief summary here",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Keep it concise and actionable.`;

      // Prepare request body for Claude 3
      const requestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      // Invoke Bedrock model
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody),
      });

      const response = await this.client.send(command);

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const aiResponse = responseBody.content[0].text;

      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const result = JSON.parse(jsonMatch[0]);

      return {
        summary: result.summary || 'No summary available',
        insights: result.insights || [],
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error('AI summarization error:', error);

      // Fallback response if AWS Bedrock fails
      return this.generateFallbackSummary(projectName, tasks);
    }
  }

  /**
   * Fallback summary generator when AI service is unavailable
   */
  private generateFallbackSummary(
    projectName: string,
    tasks: Task[]
  ): {
    summary: string;
    insights: string[];
    recommendations: string[];
  } {
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    const completionRate = taskStats.total > 0
      ? Math.round((taskStats.done / taskStats.total) * 100)
      : 0;

    return {
      summary: `${projectName} has ${taskStats.total} total tasks with a ${completionRate}% completion rate. The project is ${
        completionRate >= 80 ? 'nearing completion' :
        completionRate >= 50 ? 'progressing well' :
        completionRate >= 20 ? 'in early stages' :
        'just getting started'
      }.`,
      insights: [
        `Total tasks: ${taskStats.total} (${taskStats.done} completed, ${taskStats.inProgress} in progress, ${taskStats.todo} pending)`,
        `Project completion: ${completionRate}%`,
        taskStats.inProgress > taskStats.todo ?
          'Team is actively working on tasks' :
          'Consider starting work on pending tasks',
        tasks.length === 0 ? 'No tasks created yet - start by adding project tasks' : '',
      ].filter(Boolean),
      recommendations: [
        taskStats.todo > 5 ? 'Prioritize and assign pending tasks' : 'Good task distribution',
        taskStats.inProgress > 10 ? 'Consider limiting work in progress for better focus' : '',
        completionRate < 30 && taskStats.total > 10 ? 'Review and remove any unnecessary tasks' : '',
        'Regular team standups can improve coordination',
      ].filter(Boolean),
    };
  }

  /**
   * Check if AI service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test to verify AWS credentials and Bedrock access
      await this.client.send(new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      }));
      return true;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService();
