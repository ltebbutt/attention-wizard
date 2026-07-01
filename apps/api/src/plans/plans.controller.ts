import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/user-context';
import type { UserContext } from '../common/user-context';
import type { ActualFeedback, EntryStatus } from '../domain/models';
import { PlansService } from './plans.service';
import type { WrapUpOutcome } from './plans.service';

@Controller()
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get('plans/today')
  getToday(@CurrentUser() user: UserContext) {
    return this.plans.getToday(user.id, user.timezone);
  }

  @Post('plans/today/entries')
  addEntry(@CurrentUser() user: UserContext, @Body() body: { taskId: string }) {
    return this.plans.addEntry(user.id, user.timezone, body.taskId);
  }

  @Delete('plans/today/entries/:id')
  removeEntry(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.plans.removeEntry(user.id, user.timezone, id);
  }

  @Post('plans/today/confirm')
  confirm(@CurrentUser() user: UserContext) {
    return this.plans.confirm(user.id, user.timezone);
  }

  @Post('plans/today/wrapup')
  wrapUp(@CurrentUser() user: UserContext, @Body() body: { outcomes?: WrapUpOutcome[] }) {
    return this.plans.wrapUp(user.id, user.timezone, body?.outcomes ?? []);
  }

  @Post('entries/:id/status')
  setStatus(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() body: { status: EntryStatus; actualFeedback?: ActualFeedback },
  ) {
    return this.plans.setEntryStatus(user.id, user.timezone, id, body.status, body.actualFeedback);
  }
}
