import { createWatch, isInNotificationPhase, type Watch } from "../@angular/signals";

import type { Head } from "../engine/body-part";

interface HeadUI {
    element: HTMLElement;
    positionChange: Watch['notify'];
}

export const generateHead = (head: Head): HeadUI => {
    const headElement = document.createElement('div');

    headElement.classList.add('snake-part', 'snake-head');

    const positionWatcher = createWatch(
        () => {
            headElement.style.setProperty('--snake-part-x-position', `${head.x()}`);
            headElement.style.setProperty('--snake-part-y-position', `${head.y()}`);
        },
        (watch) => {
            if (isInNotificationPhase()) {
                return;
            }

            watch.run();
        },
        false
    )

    return { positionChange: () => positionWatcher.notify(), element: headElement };
}