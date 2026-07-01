import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Phase 0 auth stub: a fixed dev user until Entra ID lands (docs/06-roadmap.md).
 *  Timezone comes from the `x-aw-timezone` header the web client always sends. */
export interface UserContext {
  id: string;
  timezone: string;
}

export const DEV_USER_ID = 'dev-user';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): UserContext => {
  const req = ctx.switchToHttp().getRequest();
  const tz = req.headers['x-aw-timezone'];
  return {
    id: DEV_USER_ID,
    timezone: typeof tz === 'string' && tz.length > 0 ? tz : 'UTC',
  };
});
