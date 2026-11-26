import { MongoMemoryReplSet } from "mongodb-memory-server";

export default async function globalSetup(): Promise<void> {
  if (process.env.MONGO_TEST_URI) {
    return;
  }
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGO_TEST_URI = replSet.getUri();
  (globalThis as unknown as { __REPL_SET__: MongoMemoryReplSet }).__REPL_SET__ = replSet;
}
