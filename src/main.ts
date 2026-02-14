import { createComputed, createWatch, isInNotificationPhase, untracked } from "./@angular/signals";

import { subscribeNotifierForUpdate } from "./engine/tick";
import { bindDirection, direction } from "./engine/direction";
import { createHead, createTail, type Head, type Tail } from "./engine/body-part";
import { createField } from "./engine/field";
import { createFood } from "./engine/food";
import { IntersectionType, type Field } from "./models/field.interface";
import { generateField } from "./ui/field.ui";
import { generateBodyPart, type BodyPartUI } from "./ui/body-part.ui";
import type { FieldUnitPosition } from "./models/field-unit.interface";

const INITIAL_SNAKE_SIZE = 3;

// const state = {
//     headPosition: 
// }

// TODO replace all hardcode with config
const init = (): { head: Head, field: Field } => {
    const field = createField(20, 20);
    const fieldUI = generateField(field);

    const head = createHead({ x: 0, y: 0 }, direction());
    field.appendBodyPart(head);

    let node: Head | Tail = head;
    for (let i = 1; i < INITIAL_SNAKE_SIZE; i++) {
        node = createTail(
            node,
            (parent) => field.findGrowthCell(parent)
        );
        const ui = generateBodyPart(node);

        field.appendBodyPart(node);
        fieldUI.appendItem(ui);
    }

    const randomEmptyPosition = field.getRandomEmptyFieldUnit();
    if (randomEmptyPosition) {
        field.dropFood(createFood(randomEmptyPosition));
    }

    return { head, field };
}

const main = (field: Field, head: Head): void => {
    head.move(direction());

    handleIntersection(field, head);

    // updateView();

    // fieldUI.element.style.setProperty('--snake-movement-step-x', `${fieldUI.cellSize.width()}px`);
    // fieldUI.element.style.setProperty('--snake-movement-step-y', `${fieldUI.cellSize.height()}px`);
}

const updatePositions = (head: BodyPartUI): void => {

}

const handleIntersection = (field: Field, head: Head) => {
    const intersection = field.intersection();

    switch (intersection) {
        case IntersectionType.HeadToFood: {
            const tail = head.eat();

            if (tail) {
                field.appendBodyPart(tail);
                // fieldUI.appendItem(ui);
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
            console.error('Game over');
            break;
        }

        default: {

        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector<HTMLElement>('#app');

    if (!root) {
        return;
    }

    bindDirection();

    const { field, head } = init();
    const snapshot = createComputed(() => {
        const positions: FieldUnitPosition[] = [];

        let node: Head | Tail | null = head;
        while (node) {
            const [x, y] = [node.x(), node.y()];
            positions.push({ x, y })
            node = node.next;
        }

        return positions;
    });

    const engineWatcher = createWatch(
        () => {
            main(field, head);

            console.log(snapshot());
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