import { createSignal, type Watch } from "./signals";

const defaultInterval = 1_000;

// Notifier, который будет уведомляться, что произошел тик
let notifier: Watch['notify'] | undefined = undefined;

const subscribeNotifierForUpdate = (notify: Watch['notify']): void => {
    notifier = notify;
}

const [time, setTime] = createSignal(0);

setInterval(() => {
    setTime(time() + defaultInterval);

    if (notifier) {
        notifier();
    }
}, defaultInterval);

export {
    /** How many time was passed since start */
    time,
    /**  */
    subscribeNotifierForUpdate,
};