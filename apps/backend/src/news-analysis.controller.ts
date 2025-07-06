import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NewsAnalysisService } from './news-analysis.service';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  CreateTaskResponseDto,
  TaskDetailResponseDto,
  TaskExecutionResponseDto,
  ListTasksQueryDto,
  ListTasksResponseDto,
} from './dto/task-response.dto';

@Controller('api/news-analysis')
export class NewsAnalysisController {
  constructor(private readonly newsAnalysisService: NewsAnalysisService) {}

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Body(ValidationPipe) createTaskDto: CreateTaskDto,
  ): Promise<CreateTaskResponseDto> {
    return this.newsAnalysisService.createTask(createTaskDto);
  }

  @Get('tasks')
  async listTasks(
    @Query(ValidationPipe) query: ListTasksQueryDto,
  ): Promise<ListTasksResponseDto> {
    return this.newsAnalysisService.listTasks(query);
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string): Promise<TaskDetailResponseDto> {
    return this.newsAnalysisService.getTask(id);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  async cancelTask(@Param('id') id: string): Promise<{ message: string }> {
    return this.newsAnalysisService.cancelTask(id);
  }

  @Get('tasks/:id/executions')
  async getTaskExecutions(
    @Param('id') id: string,
  ): Promise<TaskExecutionResponseDto[]> {
    return this.newsAnalysisService.getTaskExecutions(id);
  }
}
