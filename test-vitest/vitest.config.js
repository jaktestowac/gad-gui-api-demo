import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    timeout: 60000, // 60 seconds timeout for tests
    hookTimeout: 30000, // 30 seconds timeout for hooks
    testTimeout: 30000, // 30 seconds timeout for individual tests
    globals: true,
    globalSetup: "./tests/setup.js",
    teardownTimeout: 10000, // 10 seconds timeout for teardown
    isolate: false, // Keep shared server state available across test files
    fileParallelism: false, // Shared server/database resources need serialized files
    silent: false,
  },
});
