import { listenArrows } from "./arrows";
import { createWatch, isInNotificationPhase } from "./signals";

document.addEventListener('DOMContentLoaded', () => {
  // const root = document.querySelector('#app');

  const arrowGetter = listenArrows();

  const tickWatcher = createWatch(
    () => {
      console.log(arrowGetter());
      
    },
    (watch) => {
      if(!isInNotificationPhase()) {
        watch.run();
      }
    },
    false,
  );

  setInterval(() => {
    tickWatcher.notify();
  }, 1000)
});