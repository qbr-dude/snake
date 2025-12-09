import type { Position } from "../../position";

interface Head extends HTMLElement { };

let head: Head | undefined = undefined;

// TODO replace container with Map
export const createHead = (container: HTMLElement, position: Position): void => {
    if (head) {
        return;
    }

    head = document.createElement('div');

    head.classList.add('snake-part', 'snake-head');

    moveHead(position);

    container.append(head);
}

export const moveHead = (position: Position): void => {
    if (!head) {
        return;
    }

    head.style.left = `${position.x}px`;
    head.style.top = `${position.y}px`;
}