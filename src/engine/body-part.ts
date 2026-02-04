import { createLinkedSignal, createSignal, type SignalGetter, } from "../signals";

import { DEFAULT_STEP, type Position } from "../models/position.interface";
import { Direction, type DirectionType } from "./direction";

interface BodyPart {
    x: SignalGetter<Position['x']>;
    y: SignalGetter<Position['y']>;
    next: BodyPart | null;
}

interface MovableBodyPart extends BodyPart {
    move: (direction: DirectionType, step?: number) => void;
}

const isBodyPart = (part: BodyPart | Position): part is BodyPart =>
    Object.hasOwn(part, 'next');

function createBodyPart(position: Position): MovableBodyPart;
function createBodyPart(parent: BodyPart): BodyPart;
function createBodyPart(positionOrParent: Position | BodyPart): BodyPart | MovableBodyPart {
    if (isBodyPart(positionOrParent)) {
        const x = createLinkedSignal<Position['x'], Position['x']>(
            () => positionOrParent.x(),
            (parentXPosition, previous) => {
                const { source } = previous ?? {};
                const fallback = parentXPosition - DEFAULT_STEP;
                return source ?? fallback;
            }
        );
        const y = createLinkedSignal<Position['y'], Position['y']>(
            () => positionOrParent.y(),
            (parentYPosition, previous) => {
                const { source } = previous ?? {};
                const fallback = parentYPosition - DEFAULT_STEP;
                return source ?? fallback;
            }
        );

        const part = { x, y, next: null } satisfies BodyPart;

        positionOrParent.next = part;

        return part;
    }

    const [x, setX] = createSignal(positionOrParent.x);
    const [y, setY] = createSignal(positionOrParent.y);

    const move: MovableBodyPart['move'] = (direction, step = DEFAULT_STEP) => {
        switch (direction) {
            case Direction.Up: {
                return setY(y() - step);
            }
            case Direction.Right: {
                return setX(x() + step);
            }
            case Direction.Down: {
                return setY(y() + step);
            }
            case Direction.Left: {
                return setX(x() - step);
            }
        }
    }

    return { x, y, move, next: null } satisfies MovableBodyPart;
}

export interface Head extends MovableBodyPart {
    eat: () => void;
};

export const createHead = (position: Position): Head => {
    const head = createBodyPart(position) as Head;

    head.eat = () => {
        let lastTail = head.next;

        while (lastTail?.next) {
            lastTail = lastTail.next;
        }

        if (lastTail) {
            createTail(lastTail);
        }
    }

    return head;
}

export interface Tail extends BodyPart { };

export const createTail = (parent: Head | Tail): Tail => {
    const tail = createBodyPart(parent) as Tail;

    return tail;
}
