import type { SignalGetter } from "../@angular/signals";

export interface FieldUnitPosition {
    x: number;
    y: number;
}

export type UnitUUID = ReturnType<typeof crypto.randomUUID>;

export interface FieldUnit {
    readonly uuid: UnitUUID;
    /** Position in field */
    readonly x: SignalGetter<FieldUnitPosition['x']>;
    /** Position in field */
    readonly y: SignalGetter<FieldUnitPosition['y']>;

    uiScale?: number;
};

/// UI

interface FieldUIPositionX {
    property: '--snake-part-x-position';
    value: string;
}

interface FieldUIPositionY {
    property: '--snake-part-y-position';
    value: string;
}

export interface FieldUIPosition {
    x: FieldUIPositionX;
    y: FieldUIPositionY;
}

export interface FieldUIUnit {
    element: HTMLElement;
    position: SignalGetter<FieldUIPosition>;
}