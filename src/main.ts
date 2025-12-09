import { createWatch, isInNotificationPhase } from "./signals";

import { x, y } from "./position";
import { scheduleUpdate } from "./tick";

document.addEventListener('DOMContentLoaded', () => {
  // const root = document.querySelector('#app');

  const engineWatcher = createWatch(
    () => {
      console.log(x(), y());
    },
    (watch) => {
      if (!isInNotificationPhase()) {
        watch.run();
      }
    },
    false,
  );

  scheduleUpdate(engineWatcher.notify);
});