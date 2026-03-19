/**
 * App-wide configuration constants.
 * Edit these values to adjust limits without touching business logic.
 */

export const LIMITS = {
  /** Maximum number of training plans a single IP can generate (lifetime). */
  PLAN_GENERATIONS_PER_IP: 3,

  /** Maximum number of community plans a single IP can share per day. */
  COMMUNITY_SHARES_PER_DAY: 3,
};
