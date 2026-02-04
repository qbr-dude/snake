import type { Position } from "../position";
import { createSignal, type SignalGetter } from "../signals";
import type { SignalSetter } from "../signals/src/signal";

export interface SnakePart {
    /** Part follows this one */
    next: SnakePart | null;
    readonly position: SignalGetter<Position>;
    readonly _move: SignalSetter<Position>;
}

export interface SnakeHead extends SnakePart {
    move: (position: Position) => void;
}

const createSnakePart = (position: Position): SnakePart => {
    const [partPosition, setPartPosition] = createSignal(position);

    const part: SnakePart = {
        position: partPosition,
        next: null,
        _move: (pos: Position) => setPartPosition(pos),
    };

    return part;
}

export const createSnakeHead = (position: Position): SnakeHead => {
    const head = createSnakePart(position);

    // TODO if eats something, new part should appear via Head (like it eats it =])
    (head as SnakeHead).move = (pos: Position) => {
        movePart(head, pos);
    };

    return head as SnakeHead;
}

const movePart = (part: SnakePart, position: Position): void => {
    const oldPosition = {...part.position()};

    part._move(position);    

    if(part.next) {
        movePart(part.next, oldPosition);
    }
}