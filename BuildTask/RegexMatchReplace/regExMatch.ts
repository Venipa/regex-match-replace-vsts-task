export class RegExMatch {
  public static MatchAndReplace(
    content: string,
    expression: string,
    valueToReplace: string,
    global: boolean,
    ignoreCase: boolean,
    multiLine: boolean
  ): string {
    let regExModifier: string = '';

    // if any of the modifiers are not set, it defaults to global
    if (!global && !ignoreCase && !multiLine) {
      global = true;
    }

    if (global) {
      regExModifier += 'g';
    }
    if (ignoreCase) {
      regExModifier += 'i';
    }
    if (multiLine) {
      regExModifier += 'm';
    }

    const regEx: RegExp = new RegExp(expression, regExModifier);
    return content.replace(regEx, valueToReplace);
  }
}
