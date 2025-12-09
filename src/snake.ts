import { Direction, defaultDirection, type DirectionType } from "./direction";
import { createSignal } from "./signals";


const [directionGetter, directionSetter] = createSignal<DirectionType>(defaultDirection);

export const changeDirection = (direction: DirectionType): 