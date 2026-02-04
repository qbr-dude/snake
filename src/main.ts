import { createWatch, isInNotificationPhase, untracked } from "./signals";

import { subscribeNotifierForUpdate } from "./tick";
import { bindDirection, direction } from "./engine/direction";
import { createHead, createTail, type Head, type Tail } from "./engine/body-part";

// TODO where to move???
const head = createHead({ x: 0, y: 0 });
let node: Head | Tail = head;
for (let i = 0; i < 3; i++) {
    node = createTail(node);
}

const main = (root: HTMLElement): void => {
    head.move(direction());

    console.log(untracked(() => head.x()), untracked(() => head.y()));
}

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector<HTMLElement>('#app');

    if (!root) {
        return;
    }

    bindDirection();

    const engineWatcher = createWatch(
        () => {
            main(root);
        },
        (watch) => {
            if (isInNotificationPhase()) {
                return;
            }

            watch.run();
        },
        true,
    );

    subscribeNotifierForUpdate(engineWatcher.notify);
});