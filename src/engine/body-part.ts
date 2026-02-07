import { createSignal, createLinkedSignal, untracked, type SignalGetter, type LinkedSignalGetter, } from "../@angular/signals";

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

    /** Следующая часть тела */
    next: BodyPart | null;
}
interface LinkedPreviousXSource {
    x: BodyPart['x'];
    direction: BodyPart['direction'];
}
interface LinkedPreviousYSource {
    y: BodyPart['y'];
    direction: BodyPart['direction'];
}
interface LinkedX {
    x: Position['x'] | null;
    direction: DirectionType;
}
interface LinkedY {
    y: Position['y'] | null;
    direction: DirectionType;
}
interface DirectionSource {
    direction: DirectionType;
    x: Position['x'] | null;
    y: Position['y'] | null;
}

export interface Head extends BodyPart {
    move: (direction: DirectionType, step?: number) => void;
    eat: () => void;
};

export const createHead = (position: Position, initialDirection: DirectionType): Head => {
    const [x, setX] = createSignal(position.x);
    const [y, setY] = createSignal(position.y);

    const [direction, setDirection] = createSignal(initialDirection ?? DEFAULT_DIRECTION);

    const previousX = getPreviousXLink({ x, direction });
    const previousY = getPreviousYLink({ y, direction });

    const move: Head['move'] = (dir, step = DEFAULT_STEP) => {
        setDirection(dir);

        switch (dir) {
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
    };

    const head = {
        x,
        y,
        direction,
        previousX,
        previousY,
        next: null,
        move,
        eat: () => void 0,
    } satisfies Head;

    head.eat = function () {
        let lastTail = (this as Head).next;

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
    const x = createLinkedSignal<Position['x'] | null, Position['x']>(
        () => parent.previousX(),
        (source) => {
            const fallback = untracked(() => parent.x()) - (isXDirection(parent.direction()) ? DEFAULT_STEP : 0);
            return source ?? fallback;
        }
    );

    const y = createLinkedSignal<Position['y'] | null, Position['y']>(
        () => parent.previousY(),
        (source) => {
            const fallback = untracked(() => parent.y() - (isYDirection(parent.direction()) ? DEFAULT_STEP : 0));
            return source ?? fallback;
        }
    );

    // back ref logic (compare to head direction)
    const direction = createLinkedSignal<DirectionSource, DirectionType>(
        () => ({ direction: parent.direction(), x: x(), y: y() }),
        ({ direction }, previous) => previous?.source.direction ?? direction
    );

    const previousX = getPreviousXLink({ x, direction });
    const previousY = getPreviousYLink({ y, direction });

    const tail = { x, y, direction, next: null, previousX, previousY } as Tail;

    // link with parent
    parent.next = tail;

    return tail;
}

/**
 * Links for previousX of body parts, based on the position and direction of the parent part. 
 * If the source value is not available (e.g. during the first computation), 
 * it falls back to calculating the previous position based on the current position and direction of movement.
 */
const getPreviousXLink = ({ x, direction }: LinkedPreviousXSource): LinkedSignalGetter<LinkedX, Position['x'] | null> =>
    createLinkedSignal<LinkedX, Position['x'] | null>(
        () => ({ x: x(), direction: direction() }),
        (_source, previous) => previous?.source?.x ?? null
    )

/**
 * Links for previousY of body parts, based on the position and direction of the parent part. 
 * If the source value is not available (e.g. during the first computation), 
 * it falls back to calculating the previous position based on the current position and direction of movement.
 */
const getPreviousYLink = ({ y, direction }: LinkedPreviousYSource): LinkedSignalGetter<LinkedY, Position['y'] | null> =>
    createLinkedSignal<LinkedY, Position['y'] | null>(
        () => ({ y: y(), direction: direction() }),
        (_source, previous) => previous?.source?.y ?? null
    )
