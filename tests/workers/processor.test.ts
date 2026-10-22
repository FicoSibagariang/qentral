import { describe, it, expect, mock, afterEach } from "bun:test";
import { emailProcessor, createEmailWorker } from "../../src/workers/email.worker";
import { startWorkers, stopWorkers, getActiveWorkers } from "../../src/workers";
import { gracefulShutdown } from "../../src/worker";
import { env } from "../../src/config/env";

describe("Dedicated Worker Engine & Processor Runner", () => {
  afterEach(async () => {
    await stopWorkers();
  });

  describe("Processor Execution Logic", () => {
    it("Case 1: Worker should execute job and return result according to contract", async () => {
      const mockJob = {
        id: "job-test-1",
        name: "send-welcome-email",
        data: { to: "user@example.com", subject: "Welcome to Qentral" },
        updateProgress: mock(async (_progress: number) => {}),
        log: mock(async (_message: string) => {}),
      };

      const result = await emailProcessor(mockJob as any);

      expect(result).toBeDefined();
      expect(result.sent).toBe(true);
      expect(result.recipient).toBe("user@example.com");
      expect(result.sentAt).toBeDefined();
    });

    it("Case 2: Worker should record job.updateProgress during execution", async () => {
      const updateProgressMock = mock(async (_progress: number) => {});
      const mockJob = {
        id: "job-test-2",
        name: "send-welcome-email",
        data: { to: "progress@example.com" },
        updateProgress: updateProgressMock,
        log: mock(async (_message: string) => {}),
      };

      await emailProcessor(mockJob as any);

      expect(updateProgressMock).toHaveBeenCalled();
      const progressCalls = updateProgressMock.mock.calls;
      expect(progressCalls.length).toBeGreaterThanOrEqual(1);
      expect(progressCalls[progressCalls.length - 1]![0]).toBe(100);
    });

    it("Case 3: Worker should record job.log during execution", async () => {
      const logMock = mock(async (_message: string) => {});
      const mockJob = {
        id: "job-test-3",
        name: "send-welcome-email",
        data: { to: "log@example.com" },
        updateProgress: mock(async (_progress: number) => {}),
        log: logMock,
      };

      await emailProcessor(mockJob as any);

      expect(logMock).toHaveBeenCalled();
      const logCalls = logMock.mock.calls;
      expect(logCalls.length).toBeGreaterThanOrEqual(1);
    });

    it("Case 4: Worker should handle exception and throw Error without crashing", async () => {
      const mockJobFail = {
        id: "job-test-4",
        name: "send-welcome-email",
        data: { to: "invalid-email", shouldFail: true },
        updateProgress: mock(async (_progress: number) => {}),
        log: mock(async (_message: string) => {}),
      };

      expect(emailProcessor(mockJobFail as any)).rejects.toThrow("Failed to process email");
    });
  });

  describe("Worker Lifecycle & Concurrency", () => {
    it("should instantiate worker with concurrency from env.DEFAULT_WORKER_CONCURRENCY", async () => {
      const worker = createEmailWorker();
      expect(worker).toBeDefined();
      expect(worker.name).toBe("email-queue");
      expect(worker.opts.concurrency).toBe(env.DEFAULT_WORKER_CONCURRENCY);
      await worker.close();
    });

    it("should start all workers via startWorkers and stop them via stopWorkers", async () => {
      const workers = startWorkers();
      expect(Array.isArray(workers)).toBe(true);
      expect(workers.length).toBeGreaterThanOrEqual(1);

      const active = getActiveWorkers();
      expect(active.length).toBe(workers.length);

      await stopWorkers();
      expect(getActiveWorkers().length).toBe(0);
    });

    it("should perform graceful shutdown when receiving exit signal", async () => {
      startWorkers();
      expect(getActiveWorkers().length).toBeGreaterThanOrEqual(1);

      await gracefulShutdown("SIGTERM", false);
      expect(getActiveWorkers().length).toBe(0);
    });
  });
});
