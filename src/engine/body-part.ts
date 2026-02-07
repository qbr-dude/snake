import { createSignal, createLinkedSignal, untracked, type SignalGetter, } from "../@angular/signals";

import { DEFAULT_STEP, type Position } from "../models/position.interface";
import { DEFAULT_DIRECTION, Direction, isXDirection, isYDirection, type DirectionType } from "./direction";

interface BodyPart {
    /** Current position */
    x: SignalGetter<Position['x']>;
    /** Current position */
    y: SignalGetter<Position['y']>;
    /** Куда направлено "тело" */
    direction: SignalGetter<DirectionType>;

    previousX: SignalGetter<Position['x'] | null>;
    previousY: SignalGetter<Position['y'] | null>;
    previousDirection: SignalGetter<DirectionType | null>;

    /** Следующая часть тела */
    next: BodyPart | null;
}

export interface Head extends BodyPart {
    move: (direction: DirectionType, step?: number) => void;
    eat: () => void;
};

export const createHead = (position: Position, initialDirection: DirectionType): Head => {
    const [x, setX] = createSignal(position.x);
    const [y, setY] = createSignal(position.y);
    const [bodyDirection, setBodyDirection] = createSignal(initialDirection ?? DEFAULT_DIRECTION);

    const previousX = createLinkedSignal<Position['x'], Position['x'] | null>(() => x(), (_source, previous) => previous?.source ?? null);
    const previousY = createLinkedSignal<Position['y'], Position['y'] | null>(() => y(), (_source, previous) => previous?.source ?? null);
    const previousDirection = createLinkedSignal<DirectionType, DirectionType | null>(() => bodyDirection(), (_source, previous) => previous?.source ?? null);

    const head = {
        x,
        y,
        direction: bodyDirection,
        previousX, previousY,
        previousDirection,
        next: null,
        move: (direction, step = DEFAULT_STEP) => {
            setBodyDirection(direction);

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
        },
        eat: function () {
            let lastTail = this.next;

            while (lastTail?.next) {
                lastTail = lastTail.next;
            }

            if (lastTail) {
                createTail(lastTail);
            }
        }
    } satisfies Head;

    return head;
}

export interface Tail extends BodyPart { };

export const createTail = (parent: Head | Tail): Tail => {
    const x = createLinkedSignal<Position['x'], Position['x']>(
        () => parent.x(),
        (_source, previous) =>
            previous?.source ?? (untracked(() => parent.x()) - (untracked(() => isXDirection(parent.direction())) ? DEFAULT_STEP : 0)),
    );

    const y = createLinkedSignal<Position['y'], Position['y']>(
        () => parent.y(),
        (_source, previous) =>
            previous?.source ?? (untracked(() => parent.y()) - (untracked(() => isYDirection(parent.direction())) ? DEFAULT_STEP : 0)),
    );

    const parentDirection = createLinkedSignal<DirectionType, DirectionType>(
        () => parent.direction(),
        (source, previous) => previous?.source ?? source
    );

    const previousX = createLinkedSignal<Position['x'], Position['x'] | null>(() => x(), (_source, previous) => previous?.source ?? null);
    const previousY = createLinkedSignal<Position['y'], Position['y'] | null>(() => y(), (_source, previous) => previous?.source ?? null);
    const previousDirection = createLinkedSignal<DirectionType, DirectionType | null>(() => parentDirection(), (_source, previous) => previous?.source ?? null);

    const tail = { x, y, direction: parentDirection, next: null, previousX, previousY, previousDirection } as Tail;

    parent.next = tail;

    return tail;
}
