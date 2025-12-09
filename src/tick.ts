import { createSignal, type Watch } from "./signals";

const defaultInterval = 1_000;

let notifier: Watch['notify'] | undefined = undefined;

const scheduleUpdate = (notify: Watch['notify']): void => {
    notifier = notify;
}

const [time, _setTime, updateTime] = createSignal(0);

setInterval(() => requestAnimationFrame(() => {
    updateTime((lastTime) => lastTime + defaultInterval);
    notifier && notifier();
}), defaultInterval);

export {
    /** How many time was passed since start */
    time,
    /**  */
    scheduleUpdate,
};