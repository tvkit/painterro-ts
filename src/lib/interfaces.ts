import { ITranslation } from "src/langs/lang";

export const def = <T>(v: T | undefined, d: T): T => (v !== undefined ? v : d);

export interface AnyFunc {
  [index: string]: (...args: unknown[]) => unknown;
}

export const anyFunc = (obj: unknown): AnyFunc => {
  return obj as AnyFunc;
};

export interface AnyType<T> {
  [index: string]: T;
}

export const anyType = <T>(obj: unknown): AnyType<T> => obj as AnyType<T>;

export interface ColorScheme {
  main?: string;
  control?: string;
  controlShadow?: string;
  controlContent?: string;
  hoverControl?: string;
  hoverControlContent?: string;
  toolControlNameColor?: string;

  activeControl?: string;
  activeControlContent?: string;
  inputBorderColor?: string;
  inputBackground?: string;
  inputShadow?: string;

  inputText?: string;
  backgroundColor?: string;
  dragOverBarColor?: string;
}

export interface TranslationParam {
  name: string;
  strings: string[];
}

export interface Parameters {
  id?: string;
  activeColor?: string;
  activeColorAlpha?: number;
  activeAlphaColor?: string;
  activeFillColor?: string;
  activeFillColorAlpha?: number;
  activeFillAlphaColor?: string;
  availableFontSizes?: string[];
  initText?: string | null; // TODO maybe undefined
  initTextColor?: string;
  initTextStyle?: string;
  defaultLineWidth?: number;
  defaultPrimitiveShadowOn?: boolean;
  defaultArrowLength?: number;
  defaultEraserWidth?: number;
  defaultFontSize?: number;
  defaultFontBold?: boolean;
  defaultFontItalic?: boolean;
  defaultTool?: string;
  replaceAllOnEmptyBackground?: boolean;
  backgroundFillColor?: string;
  backgroundFillColorAlpha?: number;
  backgroundFillAlphaColor?: string;
  backplateImgUrl?: string;
  textStrokeColor?: string;
  textStrokeColorAlpha?: number;
  textStrokeAlphaColor?: string;
  shadowScale?: number;
  defaultTextStrokeAndShadow?: boolean;
  worklogLimit?: number;
  hiddenTools?: string[];
  pixelizePixelSize?: string;
  colorScheme?: ColorScheme;

  defaultSize?: string;
  defaultPixelSize?: number;

  extraFonts?: string[];

  toolbarHeightPx?: number;
  buttonSizePx?: number;
  saveByEnter?: boolean;
  hideByEsc?: boolean;
  howToPasteActions?: string[];
  toolbarPosition?: string;
  fixMobilePageReloader?: boolean;
  language?: string;
  translation?: ITranslation;
  styles?: string;
  availableArrowLengths?: string[];
  availableLineWidths?: string[];
  availableEraserWidths?: string[];
  pixelizeHideUserInput?: boolean;

  onImageLoaded?: () => void;
  onImageFailedOpen?: () => void;
  onUndo?: (state: unknown) => void;
  onRedo?: (state: unknown) => void;
  onBeforeClose?: (hasUnsaved: boolean, doClose: () => void) => void;
  onChange?: (info: unknown) => void; // TODO type info
  saveHandler?: (saver: ImageSaver, shouldHide: (hide: boolean) => void) => void;
  onClose?: () => void;
  userUndo?: () => void;
  userRedo?: () => void;
  onHide?: () => void;
}

export interface ImageSaver {
  asDataURL(type?: string, quality?: number): string;
  asBlob(type?: string, quality?: string | number): Blob;
  getOriginalMimeType(): string;
  hasAlphaChannel(): boolean;
  suggestedFileName(type: string): string;
  getWidth(): number;
  getHeight(): number;
}

export interface DocumentHelper {
  documentOffsetLeft: number;
  documentOffsetTop: number;
  documentClientWidth: number;
  documentClientHeight: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
  ratio: number;
}

export interface Font {
  value: string;
  name: string;
  extraStyle: string;
  title: string;
}

export interface Item {
  alphaColor: string;
  lightPosition: number;
  alpha: number;
  palleteColor: string;
  target: string;
}

export interface IZoomHelper {
  hideZoomHelper(): void;
}

export interface ChangedState {
  first: boolean;
  last: boolean;
  initial: boolean;
}

export type ChangedCallback = (state: ChangedState) => void;
export interface IWorklog {
  clean: boolean;
  captureState(initial?: boolean): void;
  undoState(): void;
  reCaptureState(): void;
}

export type AddCallback = (item: Item) => void;
export type ColorPickerCallback = (item: Item) => void;
export interface IColorPicker {
  choosing: boolean;
  open(state: ColorWidget, addCallback?: AddCallback): void;
}

export interface Area {
  el: HTMLDivElement;
  rect: HTMLDivElement & DocumentHelper;
  activated: boolean;
  topl: number[];
  bottoml: number[];
  moving: boolean;
  xHandle: number;
  yHandle: number;
  resizingT: boolean;
  resizingR: boolean;
  resizingB: boolean;
  resizingL: boolean;
  get tx(): number;
  get ty(): number;
  get bx(): number;
  get by(): number;
  get width(): number;
  get height(): number;
}

export type SelectionCallback = (select: boolean) => void;
export interface IPainterroSelecter {
  area: Area;
  pixelizePixelSize: string;
  placeAt(l: number, t: number, r: number, b: number, img: HTMLImageElement): void;
  hide(): void;
}

export interface IEventDelegate {
  //[index: string]: ((evt: MouseEvent) => void) | ((evt: KeyboardEvent) => boolean);
  handleMouseUp?: (evt: MouseEvent) => void;
  handleMouseDown?: (evt: MouseEvent) => void;
  handleKeyDown?: (evt: KeyboardEvent) => boolean;
}

export interface IInserter extends IEventDelegate {
  insert(x: number, y: number, w: number, h: number): void;
}

export interface ITextTool extends IEventDelegate {
  font: string;
  fontSize: number;
  setFontSize(size: number): void;
}

export interface IPrimitiveTool extends IEventDelegate {
  shadowOn: boolean;
  arrowLength: number;
  lineWidth: number;
  eraserWidth: number;
  setShadowOn(state: boolean): void;
  setArrowLength(len: number): void;
  setLineWidth(width: number): void;
  setEraserWidth(width: number): void;
}

export interface IResizer extends IEventDelegate {
  main: IMain;
}

export type ControlValue = string | number | boolean;
export type ControlValues = string[] | Font[]; // unknown[];
export interface Control {
  id?: string;
  type: string;
  title: string;
  target: string;
  titleFull: string;
  hint?: string;
  icon?: string;
  name?: string;
  min?: number;
  max?: number;
  action: () => void;
  getValue?: () => ControlValue;
  getAvailableValues?: () => ControlValues;
}

export enum Hotkey {
  none = 0,
  y = 89,
  z = 90,
  s = 83,
  c = 67,
  x = 88,
  a = 65,
  l = 76,
  p = 80,
  r = 82,
  o = 79,
  b = 66,
  e = 69,
  t = 84,
  enter = 13,
  esc = 27,
  del = 46,
}

export interface ITool {
  //name: string;
  hotkey: Hotkey;
  buttonId: string;
  right: boolean;
  activate: (item?: string) => void;
  close?: () => void;
  eventDelegate?: () => IEventDelegate;
  controls: Control[];
}

export interface ITools {
  select: ITool;
  crop: ITool;
  pixelize: ITool;
  line: ITool;
  arrow: ITool;
  rect: ITool;
  ellipse: ITool;
  brush: ITool;
  eraser: ITool;
  text: ITool;
  rotate: ITool;
  resize: ITool;
  undo: ITool;
  redo: ITool;
  settings: ITool;
  zoomout: ITool;
  zoomin: ITool;
  save: ITool;
  open: ITool;
  close: ITool;
}

export interface ColorWidget {
  target: string;
  palleteColor?: string;
  alpha?: number;
  alphaColor?: string;
}

export interface ColorWidgetState {
  line: ColorWidget;
  fill: ColorWidget;
  bg: ColorWidget;
}

export interface IMain {
  id: string;
  doc: Document;
  isMobile: boolean;
  params: Parameters;
  colorPicker: IColorPicker;
  zoomHelper: IZoomHelper;
  inserter: IInserter;
  tools: ITools;
  wrapper: HTMLDivElement & DocumentHelper;
  baseEl: HTMLElement;
  scroller: HTMLElement;
  bar: HTMLElement;
  tabelCell: HTMLDivElement;
  size: Size;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  toolContainer: HTMLDivElement;
  primitiveTool: IPrimitiveTool;
  textTool: ITextTool;
  activeTool?: ITool;
  worklog: IWorklog;
  select: IPainterroSelecter;
  currentBackground: string;
  colorWidgetState: ColorWidgetState;
  currentBackgroundAlpha: number;

  getScale(): number;
  elLeft(): number;
  elTop(): number;
  closeActiveTool(opt?: boolean): void;
  resize(width: number, height: number): void;
  adjustSizeFull(): void;
  clearBackground(): void;
  fitImage(img: HTMLImageElement, mimetype?: string): void;
  setActiveTool(b: ITool): void;
  getElemByIdSafe(id: string | undefined): HTMLInputElement;
}
