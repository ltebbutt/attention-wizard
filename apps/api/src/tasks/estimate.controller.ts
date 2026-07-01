import { Controller, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/user-context';
import type { UserContext } from '../common/user-context';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { TasksService } from './tasks.service';

interface Estimate {
  estimateMin: number;
  firstStep: string;
}

/** TOP3-08 support + the Phase 0 "one working prompt": LLM effort estimation.
 *  Degrades per LLM-20: on any gateway failure the task keeps its manual estimate. */
@Controller('tasks')
export class EstimateController {
  constructor(
    private readonly tasks: TasksService,
    private readonly gateway: LlmGatewayService,
  ) {}

  @Post(':id/estimate')
  async estimate(@CurrentUser() user: UserContext, @Param('id') id: string) {
    const task = this.tasks.get(user.id, id);
    const result = await this.gateway.complete<Estimate>({
      useCase: 'estimation',
      userId: user.id,
      prompt: { key: 'estimation', version: 'v1' },
      variables: { title: task.title, note: task.note ?? '' },
      schema: {
        type: 'object',
        required: ['estimateMin', 'firstStep'],
        properties: { estimateMin: { type: 'number' }, firstStep: { type: 'string' } },
      },
    });

    if (!result.ok) {
      return { task, estimated: false, reason: result.status };
    }
    const estimateMin = Math.round(Math.min(240, Math.max(5, result.value.estimateMin)));
    this.tasks.update(user.id, id, { estimateMin });
    return { task, estimated: true, estimateMin, firstStep: result.value.firstStep };
  }
}
