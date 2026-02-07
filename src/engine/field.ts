import { untracked } from "../@angular/signals";

import type { Field } from "../models/field.interface";
import { isHead, type Head, type Tail } from "./body-part";


export const createField = (width: number, height: number): Field => {
    const bodyParts = new Set<Head | Tail>();

    const contains: Field['contains'] = (bodyPart) => bodyParts.has(bodyPart);

    const checkBoundaries: Field['checkBoundaries'] = (bodyPart) => {
        if (!contains(bodyPart)) {
            console.warn('Body part is not present in the field. Boundary check may be inaccurate.');
            return false;
        }

        return untracked(() => bodyPart.x() >= 0 && bodyPart.x() < width && bodyPart.y() >= 0 && bodyPart.y() < height);
    };

    const appendBodyPart: Field['appendBodyPart'] = (bodyPart) => {
        if (isHead(bodyPart) && contains(bodyPart)) {
            console.warn('Head already exists in the field. Cannot append another head.');
            return;

        }

        bodyParts.add(bodyPart);
    };

    const removeBodyPart: Field['removeBodyPart'] = (bodyPart) => {
        if (isHead(bodyPart) && bodyParts.size > 1) {
            console.warn('Attempting to remove head while other body parts exist.');
            return;
        }

        bodyParts.delete(bodyPart);
    };

    const field: Field = {
        width,
        height,
        checkBoundaries,
        appendBodyPart,
        removeBodyPart,
        contains,
    };

    return field;
}