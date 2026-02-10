import { createWatch, isInNotificationPhase, untracked } from "./@angular/signals";

import { subscribeNotifierForUpdate } from "./tick";
import { bindDirection, direction } from "./engine/direction";
import { createHead, createTail, type Head, type Tail } from "./engine/body-part";
import { createField } from "./engine/field";
import { createFood } from "./engine/food";
import { IntersectionType, type Field } from "./models/field.interface";

const init = (): { head: Head, field: Field } => {
    // TODO replace all hardcode with config
    const field = createField(20, 20);
    const head = createHead({ x: 0, y: 0 }, direction());

    field.appendBodyPart(head);

    let node: Head | Tail = head;
    for (let i = 0; i < 3; i++) {
        node = createTail(
            node,
            (parent) => field.findGrowthCell(parent)
        );
        field.appendBodyPart(node);
    }

    const randomEmptyPosition = field.getRandomEmptyFieldUnit();
    if (randomEmptyPosition) {
        field.dropFood(createFood(randomEmptyPosition));
    }

    return { head, field };
}

const { field, head } = init();

const main = (root: HTMLElement): void => {
    head.move(direction());

    field.requestUpdate();

    const headIntersection = field.intersection();

    // TODO wrap to react function
    if (!headIntersection) {
        return;
    }

    switch (headIntersection.type) {
        case IntersectionType.HeadToFood: {
            const tail = head.eat();

            if (tail) {
                field.appendBodyPart(tail);
            }

            const emptyFieldUnit = field.getRandomEmptyFieldUnit();

            if (emptyFieldUnit) {
                field.dropFood(createFood(emptyFieldUnit));
            } else {
                console.log('You win!');
            }

            break;
        }
        case IntersectionType.HeadToBody: {
            console.log('Game over');
            break;
        }
        default: {
            console.log('unknown type')
            break;
        }
    }
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