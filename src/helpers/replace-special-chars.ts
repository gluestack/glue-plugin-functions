
export const replaceSpecialChars =
  (str: string): string =>
    str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
