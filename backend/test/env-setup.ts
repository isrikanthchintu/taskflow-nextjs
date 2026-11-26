const base = process.env.MONGO_TEST_URI;

if (base) {
  const url = new URL(base);
  url.pathname = `/taskflow_test_${process.pid}_${Date.now()}`;
  process.env.MONGO_URI = url.toString();
}

process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.BCRYPT_ROUNDS = "4";
