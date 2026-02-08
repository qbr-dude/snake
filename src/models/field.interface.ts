import type { Head, Tail } from "../engine/body-part";
import type { Food } from "../engine/food";
import type { FieldUnitPosition } from "./field-unit.interface";

export interface Field {
    /** number of FieldUnits in x direction (not px) */
    width: number;
    /** number of FieldUnits in y direction (not px) */
    height: number;

    checkBoundaries: (bodyPart: Head | Tail) => boolean;

    // appendFood: (position: { x: number; y: number }) => void;

    appendBodyPart: (bodyPart: Head | Tail) => void;
    removeBodyPart: (bodyPart: Head | Tail) => void;

    contains: (bodyPart: Head | Tail) => boolean;

    getRandomEmptyFieldUnit: () => { x: FieldUnitPosition['x']; y: FieldUnitPosition['y'] } | null;

    /** Update Field BitMap */
    requestUpdate: () => void;

    /** Drop food on the field at the specified position */
    dropFood: (food: Food) => void;
}

/** Default step inside a field */
export const DEFAULT_STEP = 1;
