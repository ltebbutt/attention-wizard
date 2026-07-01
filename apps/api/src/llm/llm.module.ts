import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { LlmAdminController } from './llm-admin.controller';
import { LlmGatewayService } from './llm-gateway.service';
import { PromptRegistry } from './prompt-registry';
import { UsageStore } from './usage.store';

/** Everything provider-facing lives here (LLM-01); only the gateway is exported. */
@Module({
  controllers: [LlmAdminController],
  providers: [LlmGatewayService, PromptRegistry, BudgetService, UsageStore],
  exports: [LlmGatewayService],
})
export class LlmModule {}
