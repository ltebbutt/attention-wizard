import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/user-context';
import type { UserContext } from '../common/user-context';
import type { TaskStatus } from '../domain/models';
import { TasksService } from './tasks.service';
import type { CreateTaskDto, UpdateTaskDto } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreateTaskDto) {
    if (!dto?.title?.trim()) throw new BadRequestException('title is required');
    return this.tasks.create(user.id, { ...dto, title: dto.title.trim() });
  }

  @Get()
  list(@CurrentUser() user: UserContext, @Query('status') status?: TaskStatus) {
    return this.tasks.list(user.id, status);
  }

  @Patch(':id')
  update(@CurrentUser() user: UserContext, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: UserContext, @Param('id') id: string) {
    this.tasks.remove(user.id, id);
  }
}
