import { createWatch, isInNotificationPhase } from "./@angular/signals";

import { subscribeNotifierForUpdate } from "./tick";
import { bindDirection, direction } from "./engine/direction";
import { createHead, createTail, type Head, type Tail } from "./engine/body-part";
import { createField } from "./engine/field";
import { createFood } from "./engine/food";

const field = createField(20, 20);
const head = createHead({ x: 0, y: 0 }, direction());
field.appendBodyPart(head);

let node: Head | Tail = head;
for (let i = 0; i < 3; i++) {
    node = createTail(node);
    field.appendBodyPart(node);
}

field.dropFood(createFood({ x: 5, y: 5 }));


const main = (root: HTMLElement): void => {
    head.move(direction());

    field.requestUpdate();
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

            // IMPORTANT
            watch.run();
        },
        true,
    );

    subscribeNotifierForUpdate(engineWatcher.notify);
});



// untracked(() => {
//     let node: Head | Tail | null = head;
//     let count = 0;
//     while (node) {
//         console.log(
//             `Type: ${Object.hasOwn(node, 'move') ? 'Head' : `${'-'.repeat(count)}> Tail`}; x: [${node.x()}]{${node.previousX()}}, y: [${node.y()}]{${node.previousY()}}, direction: [${node.direction()}];`,
//         );
//         node = node.next;
//         count++;
//     }
//     console.log(`Food position: x: [${food.x()}], y: [${food.y()}]`);
//     console.log('-----------------');
// })