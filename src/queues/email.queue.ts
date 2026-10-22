import { createQueue } from "./registry";

export const EMAIL_QUEUE_NAME = "email-queue";

export const emailQueue = createQueue(EMAIL_QUEUE_NAME);
