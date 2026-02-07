import type { SignalGetter } from "../@angular/signals";

export interface FieldUnitPosition {
    x: number;
    y: number;
}

export interface FieldUnit {
    /** Position in field */
    x: SignalGetter<FieldUnitPosition['x']>;
    /** Position in field */
    y: SignalGetter<FieldUnitPosition['y']>;

    uiScale?: number;
};