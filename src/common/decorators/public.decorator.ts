import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as not requiring the global JWT auth guard.
 * Used on the /auth/* endpoints (register, login, refresh).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
