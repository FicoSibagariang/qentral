import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serveStatic } from "@hono/bun";
import { getAllQueues } from "../queues/registry";

export function setupBullBoard() {
  const serverAdapter = new HonoAdapter(serveStatic);
  serverAdapter.setBasePath("/ui");

  const bullBoard = createBullBoard({
    queues: getAllQueues().map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  function syncDashboardQueues() {
    bullBoard.setQueues(getAllQueues().map((q) => new BullMQAdapter(q)));
  }

  return { serverAdapter, bullBoard, syncDashboardQueues };
}

export const { serverAdapter, bullBoard, syncDashboardQueues } = setupBullBoard();
