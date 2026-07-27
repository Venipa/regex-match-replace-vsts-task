export class RegExMatch {
  private static readonly GLOBAL_FLAG = 'g';
  private static readonly IGNORE_CASE_FLAG = 'i';
  private static readonly MULTI_LINE_FLAG = 'm';

  public static MatchAndReplace(
    content: string,
    expression: string,
    valueToReplace: string,
    global: boolean,
    ignoreCase: boolean,
    multiLine: boolean
  ): string {
    const shouldUseGlobalMatch = global || (!ignoreCase && !multiLine);
    const regExModifier = [
      shouldUseGlobalMatch ? RegExMatch.GLOBAL_FLAG : '',
      ignoreCase ? RegExMatch.IGNORE_CASE_FLAG : '',
      multiLine ? RegExMatch.MULTI_LINE_FLAG : ''
    ].join('');
    const regEx: RegExp = new RegExp(expression, regExModifier);
    return content.replace(regEx, valueToReplace);
  }
}
