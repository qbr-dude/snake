import { type Watch } from "./signals";

const defaultInterval = 1_000;

export const scheduleTick = (watch: Watch): void => {
    setInterval(() => {
        requestAnimationFrame(() => {
            watch.notify();
        })
    }, defaultInterval);

}
