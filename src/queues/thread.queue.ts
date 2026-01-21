type ThreadJob = {
  id: number;
  user_id: number;
  content: string;
  image?: string | null;
};

const queue: ThreadJob[] = [];

export function enqueueThreadForProcessing(thread: ThreadJob) {
  queue.push(thread);
}

export function dequeueThread(): ThreadJob | undefined {
  return queue.shift();
}

export function hasJobs() {
  return queue.length > 0;
}
