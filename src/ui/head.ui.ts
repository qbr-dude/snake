import { createWatch, isInNotificationPhase, type Watch } from "../@angular/signals";

import { isHead, type Head, type Tail } from "../engine/body-part";

export interface BodyPartUI {
    element: HTMLElement;
    positionChange: Watch['notify'];
}

export const generateBodyPart = (bodyPart: Head | Tail): BodyPartUI => {
    const bodyPartElement = document.createElement('div');

    if (isHead(bodyPart)) {
        bodyPartElement.classList.add('snake-part', 'snake-head');
    } else {
        bodyPartElement.classList.add('snake-part', 'snake-tail');
    }

    const positionWatcher = createWatch(
        () => {
            bodyPartElement.style.setProperty('--snake-part-x-position', `${bodyPart.x()}`);
            bodyPartElement.style.setProperty('--snake-part-y-position', `${bodyPart.y()}`);
        },
        (watch) => {
            if (isInNotificationPhase()) {
                return;
            }

            watch.run();
        },
        false
    )

    return { positionChange: () => positionWatcher.notify(), element: bodyPartElement };
}