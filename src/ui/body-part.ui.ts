import { createComputed } from "../@angular/signals";

import { isHead, type Head, type Tail } from "../engine/body-part";
import type { FieldUIPosition, FieldUIUnit } from "../models/field-unit.interface";

export interface BodyPartUI extends FieldUIUnit { };

// TODO untie of body-part
// TODO rename
export const generateBodyPart = (bodyPart: Head | Tail): BodyPartUI => {
    const bodyPartElement = document.createElement('div');

    // TODO data-uuid => const
    bodyPartElement.setAttribute('data-uuid', bodyPart.uuid);

    if (isHead(bodyPart)) {
        bodyPartElement.classList.add('snake-part', 'snake-head');
    } else {
        bodyPartElement.classList.add('snake-part', 'snake-tail');
    }

    const position = createComputed<FieldUIPosition>(() => ({
        x: {
            property: '--snake-part-x-position',
            value: `${bodyPart.x()}`,
        },
        y: {
            property: '--snake-part-y-position',
            value: `${bodyPart.x()}`,
        },
    }))

    return { element: bodyPartElement, position };
}