import { createWatch, isInNotificationPhase, untracked } from "./@angular/signals";

import { subscribeNotifierForUpdate } from "./tick";
import { bindDirection, direction } from "./engine/direction";
import { createHead, createTail, type Head, type Tail } from "./engine/body-part";

// TODO where to move???
const head = createHead({ x: 0, y: 0 }, direction());
let node: Head | Tail = head;
for (let i = 0; i < 3; i++) {
    node = createTail(node);
}

const main = (root: HTMLElement): void => {
    head.move(direction());

    untracked(() => {
        let node: Head | Tail | null = head;
        let count = 0;
        while (node) {
            console.log(
                `Type: ${Object.hasOwn(node, 'move') ? 'Head' : `${'-'.repeat(count)}> Tail`}; x: [${node.x()}]{${node.previousX()}}, y: [${node.y()}]{${node.previousY()}}, direction: [${node.direction()}];`,
            );
            node = node.next;
            count++;
        }
        console.log('-----------------');
    })
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