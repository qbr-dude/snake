import { createWatch, isInNotificationPhase } from "./signals";

import { subscribeNotifierForUpdate } from "./tick";
import { bindDirection } from "./engine/direction";

const main = (root: HTMLElement): void => {

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