import { createSignal, type SignalGetter } from "./signals";

/** Arrow Keys definition place */

export const Arrow = Object.freeze({
    Up: 'ArrowUp',
    Down: 'ArrowDown',
    Left: 'ArrowLeft',
    Right: 'ArrowRight'
});

export type ArrowType = typeof Arrow[keyof typeof Arrow];

const isArrow = (key: string): key is ArrowType => Object.values(Arrow).includes(key as ArrowType);

const [arrowGet, arrowSet] = createSignal<ArrowType>(Arrow.Right);

const keydownHandler = (arrow: ArrowType): void => {
    arrowSet(arrow);
}

let isEventAlreadyListened = false;

export const listenArrows = (): SignalGetter<ArrowType> => {
    if(!isEventAlreadyListened) {
        document.addEventListener(
            'keydown', 
            e => isArrow(e.key) && keydownHandler(e.key)
        );
    }

    return arrowGet;
}