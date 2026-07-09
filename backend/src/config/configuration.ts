export default () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || "60", 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || "100", 10),
  },
  recharge: {
    dailyChargeLimit: parseFloat(process.env.RECHARGE_DAILY_CHARGE_LIMIT || "5000"),
    dailyWithdrawLimit: parseFloat(process.env.RECHARGE_DAILY_WITHDRAW_LIMIT || "2000"),
    largeTransactionThreshold: parseFloat(
      process.env.RECHARGE_LARGE_TRANSACTION_THRESHOLD || "1000",
    ),
  },
});
