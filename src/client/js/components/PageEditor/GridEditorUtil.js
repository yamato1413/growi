/**
 * Utility for grid editor
 */
class GridEditorUtil {
  constructor() {
    // TODO url
    this.lineBeginPartOfGridRE = /(<[^/].*>)/;
    this.lineEndPartOfGridRE = /(<\/.*>)/;
    this.linePartOfGridRE = /(<[^/].*>)[\s\S]*<\/.*>$/;
    this.replaceGridWithHtmlWithEditor = this.replaceGridWithHtmlWithEditor.bind(this);
  }
  /**
   * return boolean value whether the cursor position is in a row
   */
  isInRow(editor) {
    const curPos = editor.getCursor();
    // return this.linePartOfTableRE.test(editor.getDoc().getLine(curPos.line));
    return this.linePartOfRow.test(editor.getDoc().getLine(curPos.line));
  }

  /**
   * return the postion of the BOD(beginning of grid)
   */
  getBog(editor) {
    const curPos = editor.getCursor();
    const firstLine = editor.getDoc().firstLine();

    let line = curPos.line - 1;
    let isFound = false;
    for (; line >= firstLine; line--) {
      const strLine = editor.getDoc().getLine(line);
      if (this.lineBeginPartOfGridRE.test(strLine)) {
        isFound = true;
        break;
      }

      if (this.lineBeginPartOfGridRE.test(strLine)) {
        isFound = false;
        break;
      }
    }

    if (!isFound) {
      return { line: curPos.line, ch: curPos.ch };
    }

    const bodLine = Math.max(firstLine, line);
    return { line: bodLine, ch: 0 };
  }

  /**
   * return the postion of the EOD(end of grid)
   */
  getEog(editor) {
    const curPos = editor.getCursor();
    const lastLine = editor.getDoc().lastLine();

    let line = curPos.line;
    let isFound = false;
    for (; line <= lastLine; line++) {
      const strLine = editor.getDoc().getLine(line);
      if (this.lineEndPartOfGridRE.test(strLine)) {
        isFound = true;
        break;
      }

      if (this.lineEndPartOfGridRE.test(strLine)) {
        isFound = false;
        break;
      }
    }

    if (!isFound) {
      return { line: curPos.line, ch: curPos.ch };
    }

    const eodLine = Math.min(line, lastLine);
    const lineLength = editor.getDoc().getLine(eodLine).length;
    return { line: eodLine, ch: lineLength };
    // return { line: lastLine, ch: curPos.ch };
  }

  replaceGridWithHtmlWithEditor(editor, grid) {
    const curPos = editor.getCursor();
    editor.getDoc().setCursor(curPos.line + 1, 2);
  }
}
// singleton pattern
const instance = new GridEditorUtil();
Object.freeze(instance);
export default instance;
