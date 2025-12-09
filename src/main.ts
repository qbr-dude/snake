import { createWatch, isInNotificationPhase } from "./signals";

import { direction } from "./direction";
import { scheduleTick } from "./tick";

document.addEventListener('DOMContentLoaded', () => {
  // const root = document.querySelector('#app');

  const tickWatcher = createWatch(
    () => {
      console.log(direction());
    },
    (watch) => {
      if (!isInNotificationPhase()) {
        watch.run();
      }
    },
    false,
  );

  scheduleTick(tickWatcher);
});