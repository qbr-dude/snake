import type { Head, Tail } from "../engine/body-part";

export interface Field {
    width: number;
    height: number;

    checkBoundaries: (bodyPart: Head | Tail) => boolean;

    // appendFood: (position: { x: number; y: number }) => void;

    appendBodyPart: (bodyPart: Head | Tail) => void;
    removeBodyPart: (bodyPart: Head | Tail) => void;

    contains: (bodyPart: Head | Tail) => boolean;
}

/** Default step inside a field */
export const DEFAULT_STEP = 1;
