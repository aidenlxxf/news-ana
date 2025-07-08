import { type TaskExecution } from "@na/schema";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import { BasicAuthGuard } from "../auth/basic-auth.guard";
import { User } from "../auth/user.decorator";
import { ValidationPipe } from "../validators/valibot.pipe";
import {
  CreateTaskDto,
  type CreateTaskResponseDto,
} from "./dto/create-task.dto";
import { type GetLatestResultResponseDto } from "./dto/get-latest-result.dto";
import { type GetTaskResponseDto } from "./dto/get-task.dto";
import {
  ListTasksQueryDto,
  type ListTasksResponseDto,
} from "./dto/list-task.dto";
import {
  ListTaskExecutionsQueryDto,
  type ListTaskExecutionsResponseDto,
} from "./dto/list-task-executions.dto";
import { type RefreshTaskResponseDto } from "./dto/refresh-task.dto";
import { NewsAnalysisTaskService } from "./news-analysis-task.service";

@Controller("news-analysis")
@UseGuards(BasicAuthGuard)
export class NewsAnalysisController {
  constructor(private readonly newsAnalysisService: NewsAnalysisTaskService) {}

  @Post("tasks")
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @User() user: UserEntity,
  ): Promise<CreateTaskResponseDto> {
    return this.newsAnalysisService.createTask(createTaskDto.data, user.id);
  }

  @Get("tasks")
  async listTasks(
    @Query(ValidationPipe) query: ListTasksQueryDto,
    @User() user: UserEntity,
  ): Promise<ListTasksResponseDto> {
    return this.newsAnalysisService.listTasks(query.data, user.id);
  }

  @Get("tasks/:id")
  async getTask(
    @Param("id") id: string,
    @User() user: UserEntity,
  ): Promise<GetTaskResponseDto> {
    return this.newsAnalysisService.getTask(id, user.id);
  }

  @Delete("tasks/:id")
  @HttpCode(HttpStatus.OK)
  async cancelTask(
    @Param("id") id: string,
    @User() user: UserEntity,
  ): Promise<{ message: string }> {
    return this.newsAnalysisService.cancelTask(id, user.id);
  }

  @Get("tasks/:id/executions")
  async getTaskExecutions(
    @Param("id") id: string,
    @Query(ValidationPipe) query: ListTaskExecutionsQueryDto,
    @User() user: UserEntity,
  ): Promise<ListTaskExecutionsResponseDto> {
    return this.newsAnalysisService.getTaskExecutions(id, query.data, user.id);
  }

  @Post("tasks/:id/refresh")
  @HttpCode(HttpStatus.OK)
  async refreshTask(
    @Param("id") id: string,
    @User() user: UserEntity,
  ): Promise<RefreshTaskResponseDto> {
    return this.newsAnalysisService.refreshTask(id, user.id);
  }

  @Get("tasks/:id/latest-result")
  async getLatestResult(
    @Param("id") id: string,
    @User() user: UserEntity,
  ): Promise<GetLatestResultResponseDto> {
    return this.newsAnalysisService.getLatestResult(id, user.id);
  }

  @Get("executions/:id")
  async getExecution(
    @Param("id") id: string,
    @User() user: UserEntity,
  ): Promise<TaskExecution> {
    return this.newsAnalysisService.getExecution(id, user.id);
  }
}
