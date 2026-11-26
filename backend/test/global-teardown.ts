import type { MongoMemoryReplSet } from "mongodb-memory-server";

export default async function globalTeardown(): Promise<void> {
  const replSet = (globalThis as unknown as { __REPL_SET__?: MongoMemoryReplSet }).__REPL_SET__;
  if (replSet) {
    await replSet.stop();
  }
}
