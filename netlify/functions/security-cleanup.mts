import { lt } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { sessions, limits } from '../../db/schema.js';
export default async () => {
  const db = database();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.delete(limits).where(lt(limits.expiresAt, new Date()));
};
export const config = { schedule: '@hourly' };
