import { Controller, Get } from '@nestjs/common';
import { UsageStore } from './usage.store';

/** LLM-15: Phase 0 usage dashboard (dev-auth only until Entra ID lands). */
@Controller('admin/llm')
export class LlmAdminController {
  constructor(private readonly usage: UsageStore) {}

  @Get('usage')
  usageAggregates() {
    return this.usage.aggregates();
  }
}
