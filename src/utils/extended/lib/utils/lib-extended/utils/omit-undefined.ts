import { isUndefined, omitBy } from 'lodash-es';

export const omitUndefined = <T extends Record<string, any>>(value: T): Partial<T> =>
  omitBy(value, isUndefined) as Partial<T>;
