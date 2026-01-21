import { dequeueThread, hasJobs } from "../queues/thread.queue";
import { prisma } from "../connections/client";

async function processThreadImage(thread: any) {
  if (!thread.image) return;

  // simulate image processing
  console.log("Processing image for thread:", thread.id);
}

export async function processMessageQueue() {
  while (true) {
    if (!hasJobs()) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    const thread = dequeueThread();
    if (!thread) continue;

    await processThreadImage(thread);

    await prisma.thread.update({
      where: { id: thread.id },
      data: {
        updated_at: new Date(),
      },
    });

    console.log("Thread processed:", thread.id);
  }
}
