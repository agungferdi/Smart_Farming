import { ZodError } from 'zod';

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const sendError = (
  c: Context,
  error: unknown,
  status: ContentfulStatusCode = 400,
) => {
  if (error instanceof ZodError) {
    return c.json({ error: error.issues[0].message }, status);
  }

  if (error instanceof Error) {
    return c.json({ error: error.message }, status);
  }

  return c.json({ error: 'Internal server error' }, 500);
};
