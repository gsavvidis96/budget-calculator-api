export const areAllValuesUndefined = (obj: any) => {
  return !Object.values(obj).some((value) => value !== undefined);
};
