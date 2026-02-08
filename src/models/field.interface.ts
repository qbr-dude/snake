import type { SignalGetter } from "../@angular/signals";

import type { Head, Tail } from "../engine/body-part";
import type { Food } from "../engine/food";
import type { FieldUnitPosition } from "./field-unit.interface";

export const IntersectionType = {
    HeadToBody: 'head-to-body',
    HeadToFood: 'head-to-food',
} as const;

export type IntersectionType = typeof IntersectionType[keyof typeof IntersectionType];

export interface HeadToBodyIntersection {
    type: typeof IntersectionType.HeadToBody;
    head: Head;
    bodyPart: Tail;
}

export interface HeadToFoodIntersection {
    type: typeof IntersectionType.HeadToFood;
    head: Head;
    food: Food;
}

export type HeadIntersection = HeadToBodyIntersection | HeadToFoodIntersection;

export interface Field {
    /** number of FieldUnits in x direction (not px) */
    width: number;
    /** number of FieldUnits in y direction (not px) */
    height: number;

    // appendFood: (position: { x: number; y: number }) => void;

    appendBodyPart: (bodyPart: Head | Tail) => void;
    removeBodyPart: (bodyPart: Head | Tail) => void;

    contains: (bodyPart: Head | Tail) => boolean;

    getRandomEmptyFieldUnit: () => FieldUnitPosition | null;
    /** @todo rename */
    findGrowthCell: (bodyPartParent: Head | Tail) => FieldUnitPosition | null;

    /** Update Field BitMap */
    requestUpdate: () => void;
    intersection: SignalGetter<HeadIntersection | null>;

    /** Drop food on the field at the specified position */
    dropFood: (food: Food) => void;
}

/** Default step inside a field */
export const DEFAULT_STEP = 1;
