import { Module } from '@nestjs/common';
import { LlmModule } from './llm/llm.module';
import { PlansController } from './plans/plans.controller';
import { PlansService } from './plans/plans.service';
import { EstimateController } from './tasks/estimate.controller';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [LlmModule],
  controllers: [TasksController, EstimateController, PlansController],
  providers: [TasksService, PlansService],
})
export class AppModule {}
