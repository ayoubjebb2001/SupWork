process.env.DB_URI = process.env.DB_URI ?? 'mongodb://127.0.0.1:27017/';
process.env.DB_NAME = `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}`;
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'e2e-jwt-secret-min-32-characters-long!!';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.JWT_REFRESH_EXPIRES_DAYS =
  process.env.JWT_REFRESH_EXPIRES_DAYS ?? '7';
process.env.ADMIN_BOOTSTRAP_SECRET =
  process.env.ADMIN_BOOTSTRAP_SECRET ?? 'bootstrap-secret';
