export interface IToolsTranslation {
  crop: string;
  pixelize: string;
  rect: string;
  ellipse: string;
  line: string;
  arrow: string;
  rotate: string;
  save: string;
  load: string;
  text: string;
  brush: string;
  resize: string;
  open: string;
  select: string;
  close: string;
  eraser: string;
  settings: string;
  zoomin?: string;
  zoomout?: string;
  undo?: string;
  redo?: string;
}

export interface IPasteOptionsTranslation {
  fit: string;
  extend_down: string;
  extend_right: string;
  extend_left?: string;
  extend_top?: string;
  extend: string;
  over: string;
  how_to_paste: string;
}

export interface IStringsTranslation {
  lineColor: string;
  lineColorFull: string;
  fillColor: string;
  fillColorFull: string;
  alpha: string;
  alphaFull: string;
  lineWidth: string;
  lineWidthFull: string;
  arrowLength?: string;
  arrowLengthFull?: string;
  eraserWidth: string;
  eraserWidthFull: string;
  textColor: string;
  textColorFull: string;
  fontSize: string;
  fontSizeFull: string;
  fontStrokeSize: string;
  fontStrokeSizeFull: string;
  fontIsBold?: string;
  fontIsBoldFull?: string;
  fontIsItalic?: string;
  fontIsItalicFull?: string;
  shadowOn?: string;
  shadowOnFull?: string;
  fontStrokeAndShadow?: string;
  fontStrokeAndShadowFull?: string;
  fontStyle?: string;
  fontStyleFull?: string;
  fontName: string;
  fontNameFull: string;
  textStrokeColor: string;
  textStrokeColorFull: string;
  apply: string;
  cancel: string;
  close: string;
  clear: string;
  width: string;
  height: string;
  keepRatio: string;
  fillPageWith: string;
  pixelSize: string;
  pixelSizeFull: string;
  resizeScale: string;
  resizeResize: string;
  backgroundColor: string;
  pixelizePixelSize: string;
  language?: string;
  wrongPixelSizeValue: string;
}

export interface ITranslation {
  name: string;
  strings: IStringsTranslation;
  tools: IToolsTranslation;
  paste: IPasteOptionsTranslation;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Tr {
  /**
   * scite regex
   * search:  *\([^:?]*\)\??:.*;$
   * replace: public readonly \1 = "t.\1";
   */

  class Strings implements IStringsTranslation {
    public readonly lineColor = "s.lineColor";
    public readonly lineColorFull = "s.lineColorFull";
    public readonly fillColor = "s.fillColor";
    public readonly fillColorFull = "s.fillColorFull";
    public readonly alpha = "s.alpha";
    public readonly alphaFull = "s.alphaFull";
    public readonly lineWidth = "s.lineWidth";
    public readonly lineWidthFull = "s.lineWidthFull";
    public readonly arrowLength = "s.arrowLength";
    public readonly arrowLengthFull = "s.arrowLengthFull";
    public readonly eraserWidth = "s.eraserWidth";
    public readonly eraserWidthFull = "s.eraserWidthFull";
    public readonly textColor = "s.textColor";
    public readonly textColorFull = "s.textColorFull";
    public readonly fontSize = "s.fontSize";
    public readonly fontSizeFull = "s.fontSizeFull";
    public readonly fontStrokeSize = "s.fontStrokeSize";
    public readonly fontStrokeSizeFull = "s.fontStrokeSizeFull";
    public readonly fontIsBold = "s.fontIsBold";
    public readonly fontIsBoldFull = "s.fontIsBoldFull";
    public readonly fontIsItalic = "s.fontIsItalic";
    public readonly fontIsItalicFull = "s.fontIsItalicFull";
    public readonly shadowOn = "s.shadowOn";
    public readonly shadowOnFull = "s.shadowOnFull";
    public readonly fontStrokeAndShadow = "s.fontStrokeAndShadow";
    public readonly fontStrokeAndShadowFull = "s.fontStrokeAndShadowFull";
    public readonly fontStyle = "s.fontStyle";
    public readonly fontStyleFull = "s.fontStyleFull";
    public readonly fontName = "s.fontName";
    public readonly fontNameFull = "s.fontNameFull";
    public readonly textStrokeColor = "s.textStrokeColor";
    public readonly textStrokeColorFull = "s.textStrokeColorFull";
    public readonly apply = "s.apply";
    public readonly cancel = "s.cancel";
    public readonly close = "s.close";
    public readonly clear = "s.clear";
    public readonly width = "s.width";
    public readonly height = "s.height";
    public readonly keepRatio = "s.keepRatio";
    public readonly fillPageWith = "s.fillPageWith";
    public readonly pixelSize = "s.pixelSize";
    public readonly pixelSizeFull = "s.pixelSizeFull";
    public readonly resizeScale = "s.resizeScale";
    public readonly resizeResize = "s.resizeResize";
    public readonly backgroundColor = "s.backgroundColor";
    public readonly pixelizePixelSize = "s.pixelizePixelSize";
    public readonly language = "s.language";
    public readonly wrongPixelSizeValue = "s.wrongPixelSizeValue";
  }
  export const S = new Strings();

  class Tools implements IToolsTranslation {
    public readonly crop = "t.crop";
    public readonly pixelize = "t.pixelize";
    public readonly rect = "t.rect";
    public readonly ellipse = "t.ellipse";
    public readonly line = "t.line";
    public readonly arrow = "t.arrow";
    public readonly rotate = "t.rotate";
    public readonly save = "t.save";
    public readonly load = "t.load";
    public readonly text = "t.text";
    public readonly brush = "t.brush";
    public readonly resize = "t.resize";
    public readonly open = "t.open";
    public readonly select = "t.select";
    public readonly close = "t.close";
    public readonly eraser = "t.eraser";
    public readonly settings = "t.settings";
    public readonly zoomin = "t.zoomin";
    public readonly zoomout = "t.zoomout";
    public readonly undo = "t.undo";
    public readonly redo = "t.redo";
  }
  export const T = new Tools();

  class PasteOptions implements IPasteOptionsTranslation {
    public readonly fit = "p.fit";
    public readonly extend_down = "p.extend_down";
    public readonly extend_right = "p.extend_right";
    public readonly extend_left = "p.extend_left";
    public readonly extend_top = "p.extend_top";
    public readonly extend = "p.extend";
    public readonly over = "p.over";
    public readonly how_to_paste = "p.how_to_paste";
  }
  export const P = new PasteOptions();
}
