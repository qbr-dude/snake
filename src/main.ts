import { createWatch, isInNotificationPhase } from "./signals";

import { setStep, x, y } from "./position";
import { scheduleUpdate } from "./tick";
import { createHead, moveHead } from "./ui/snake/head";
import { getSnakeSize } from "./ui/utils";

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector<HTMLElement>('#app');

  if (!root) {
    return;
  }

  const size = getSnakeSize(root);
  if (size) {
    setStep(size);
  }

  createHead(root, { x: x(), y: y() });

  const engineWatcher = createWatch(
    () => {
      moveHead({ x: x(), y: y() });
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