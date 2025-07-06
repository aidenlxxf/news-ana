import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { NewsAnalysisTaskService } from "./news-analysis-task.service";
import { CreateTaskDto, type CreateTaskResponseDto,
} from "../dto/create-task.dto";
import { ValidationPipe } from "../validators/valibot.pipe";
import { ListTasksQueryDto, type ListTasksResponseDto } from "../dto/list-task.dto";
import { type GetTaskResponseDto } from "../dto/get-task.dto";
import { ListTaskExecutionsQueryDto, type ListTaskExecutionsResponseDto } from "../dto/list-task-executions.dto";

@Controller("api/news-analysis")
export class NewsAnalysisController {
  constructor(private readonly newsAnalysisService: NewsAnalysisTaskService) {}

  @Post("tasks")
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<CreateTaskResponseDto> {
    return this.newsAnalysisService.createTask(createTaskDto.data);
  }

  @Get("tasks")
  async listTasks(
    @Query(ValidationPipe) query: ListTasksQueryDto,
  ): Promise<ListTasksResponseDto> {
    return this.newsAnalysisService.listTasks(query.data);
  }

  @Get("tasks/:id")
  async getTask(@Param("id") id: string): Promise<GetTaskResponseDto> {
    return this.newsAnalysisService.getTask(id);
  }

  @Delete("tasks/:id")
  @HttpCode(HttpStatus.OK)
  async cancelTask(@Param("id") id: string): Promise<{ message: string }> {
    return this.newsAnalysisService.cancelTask(id);
  }

  @Get("tasks/:id/executions")
  async getTaskExecutions(
    @Param("id") id: string,
    @Query(ValidationPipe) query: ListTaskExecutionsQueryDto,
  ): Promise<ListTaskExecutionsResponseDto> {
    return this.newsAnalysisService.getTaskExecutions(id, query.data);
  }
}
