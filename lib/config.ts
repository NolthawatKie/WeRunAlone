/**
 * App-wide configuration constants.
 * Edit these values to adjust limits without touching business logic.
 */

export const LIMITS = {
  /** Maximum number of training plans a single IP can generate (lifetime). */
  PLAN_GENERATIONS_PER_IP: 3,

  /** Maximum number of community plans a single IP can share per day. */
  COMMUNITY_SHARES_PER_DAY: 3,

  /**
   * Maximum output tokens for Claude plan generation.
   * Realistic plans use 750–3,500 tokens. 14,000 gives safe headroom
   * for the most complex configs (Full Marathon, 30w, 7 days/week).
   * Worst-case cost at this limit: ~$0.21/call.
   */
  MAX_OUTPUT_TOKENS: 14000,
};
