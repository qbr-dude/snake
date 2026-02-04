import type { Position } from "../../old/position";

interface Tail {
    ref: HTMLElement;
    move: (position: Position) => void;
}

export const createTail = (container: HTMLElement, position: Position): Tail['move'] => {
    const tailElem = document.createElement('div');
    const tail: Tail = {
        ref: tailElem,
        move: (pos: Position) => {
            tail.ref.style.left = `${pos.x}px`;
            tail.ref.style.top = `${pos.y}px`;
        }
    };

    tail.ref.classList.add('snake-part', 'snake-tail');

    tail.move(position);

    container.append(tail.ref);

    return tail.move;
}
