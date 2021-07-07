import { ITranslation } from "./lang";

const translation: ITranslation = {
  name: "",
  strings: {
    lineColor: "L",
    lineColorFull: "Line color",
    fillColor: "F",
    fillColorFull: "Fill color",
    alpha: "A",
    alphaFull: "Alpha",
    lineWidth: "W",
    lineWidthFull: "Line width",
    arrowLength: "L",
    arrowLengthFull: "Arrow length",
    eraserWidth: "E",
    eraserWidthFull: "Eraser width",
    textColor: "C",
    textColorFull: "Text color",
    fontSize: "S",
    fontSizeFull: "Font size",
    fontStrokeSize: "St",
    fontStrokeSizeFull: "Stroke width",
    fontIsBold: "<b>B</b>",
    fontIsBoldFull: "Bold",
    fontIsItalic: "<i>I</i>",
    fontIsItalicFull: "Italic",
    shadowOn: "SH",
    shadowOnFull: "Shadow",
    fontStrokeAndShadow: "S&S",
    fontStrokeAndShadowFull: "Stroke & Shadow",
    fontStyle: "FS",
    fontStyleFull: "Font style",
    fontName: "F",
    fontNameFull: "Font name",
    textStrokeColor: "SC",
    textStrokeColorFull: "Stroke color",
    apply: "Apply",
    cancel: "Cancel",
    close: "Close",
    clear: "Clear",
    width: "Width",
    height: "Height",
    keepRatio: "Keep width/height ratio",
    fillPageWith: "Fill page with current background color",
    pixelSize: "P",
    pixelSizeFull: "Pixel size",
    resizeScale: "Scale",
    resizeResize: "Resize",
    backgroundColor: "Page background color",
    pixelizePixelSize: "Pixelize pixel size",
    language: "Language",
    wrongPixelSizeValue:
      "Wrong pixel size. You can enter e.g. '20%' which mean pixel size will be 1/5 of " +
      "the selected area side, or '4' means 4 px",
  },
  tools: {
    crop: "Crop image to selected area",
    pixelize: "Pixelize selected area",
    rect: "Draw rectangle",
    ellipse: "Draw ellipse",
    line: "Draw line",
    arrow: "Draw arrow",
    rotate: "Rotate image",
    save: "Save image",
    load: "Load image",
    text: "Put text",
    brush: "Brush",
    resize: "Resize or scale",
    open: "Open image",
    select: "Select area",
    close: "Close Painterro",
    eraser: "Eraser",
    settings: "Settings",
    zoomin: "Zoom In",
    zoomout: "Zoom Out",
    undo: "Undo",
    redo: "Redo",
  },
  paste: {
    fit: "Replace all",
    extend_down: "Extend down",
    extend_right: "Extend right",
    extend_left: "Extend left",
    extend_top: "Extend top",
    extend: "Add",
    over: "Paste over",
    how_to_paste: "How to paste?",
  },
};

export default translation;
