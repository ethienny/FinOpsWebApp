// The English dictionaries are declared `as const` so missing/extra keys are
// caught by the compiler. That also freezes each leaf to its literal string
// type, which would otherwise force every Portuguese string to match the
// English one verbatim. Widen<T> maps every leaf back to plain `string`,
// so a Portuguese namespace only has to match the English *shape*.
export type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };
