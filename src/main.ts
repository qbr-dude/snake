import { createComputed, createWatch, isInNotificationPhase } from "./@angular/signals";

import { subscribeNotifierForUpdate } from "./engine/tick";
import { bindDirection, direction } from "./engine/direction";
import { createHead, createTail, type Head, type Tail } from "./engine/body-part";
import { createField } from "./engine/field";
import { createFood } from "./engine/food";
import { IntersectionType, type Field } from "./models/field.interface";
import { generateField } from "./ui/field.ui";
import { generateBodyPart } from "./ui/body-part.ui";
import type { FieldUnitPosition, UnitUUID } from "./models/field-unit.interface";

const INITIAL_SNAKE_SIZE = 3;

const field = createField(20, 20);
const fieldUI = generateField(field);

const head = createHead({ x: 0, y: 0 }, direction());
field.appendBodyPart(head);

const headUI = generateBodyPart(head);
fieldUI.appendItem(headUI);

let node: Head | Tail = head;
for (let i = 0; i < INITIAL_SNAKE_SIZE; i++) {
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
    const food = createFood(randomEmptyPosition);
    field.dropFood(food);
}

const snakeSnapshot = createComputed(() => {
    const positions = new Map<UnitUUID, FieldUnitPosition>();

    let node: Head | Tail | null = head;
    while (node) {
        const [x, y] = [node.x(), node.y()];
        positions.set(node.uuid, { x, y })
        node = node.next;
    }

    return positions;
});

// TODO make `getRenderer` which will return `render`
const render = (): void => {
    const snapshot = snakeSnapshot();
    const field = fieldUI.element;

    for (const [uuid, position] of snapshot) {
        const elem = field.querySelector<HTMLElement>(`[data-uuid="${uuid}"]`);

        if (!elem) {
            continue;
        }

        elem.style.setProperty('--snake-part-x-position', `${position.x}`);
        elem.style.setProperty('--snake-part-y-position', `${position.y}`);
    }
}

const updateFieldView = (): void => {
    fieldUI.element.style.setProperty('--snake-movement-step-x', `${fieldUI.cellSize.width()}px`);
    fieldUI.element.style.setProperty('--snake-movement-step-y', `${fieldUI.cellSize.height()}px`);
}

const main = (): void => {
    head.move(direction());

    handleIntersection(field, head);
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

    root.append(fieldUI.element);

    const renderWatcher = createWatch(
        () => {
            updateFieldView();
            render();
        },
        (watch) => {
            if (isInNotificationPhase()) {
                return;
            }

            // TODO will it separate logic and rendering???
            requestAnimationFrame(() => {
                watch.run()
            })
        },
        false,
    )

    const engineWatcher = createWatch(
        () => {
            main();

            // TODO and also run for different cases (like window-resize or else)
            renderWatcher.notify();
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
