import "../css/bar-styles.css";
import "../css/icons/ptroiconfont.css";
import "../css/styles.css";
import isMobile from "ismobilejs";
import ColorPicker, { HexToRGB, rgbToHex } from "./colorPicker";
import ControlBuilder from "./controlbuilder";
import Inserter from "./inserter";
import { anyFunc, anyType, ColorWidgetState, Control, def, DocumentHelper, Hotkey, ImageSaver, IMain, ITool, ITools, Parameters, Size } from "./interfaces";
import { setDefaults, setParam } from "./params";
import PrimitiveTool from "./primitive";
import Resizer from "./resizer";
import PainterroSelecter from "./selecter";
import Settings from "./settings";
import TextTool from "./text";
import { tr } from "./translation";
import { addDocumentObjectHelpers, distance, genId, getScrollbarWidth, logError, trim } from "./utils";
import WorkLog from "./worklog";
import ZoomHelper from "./zoomHelper";

interface ZoomInfo {
  wheelDelta: number;
  clientX: number;
  clientY: number;
}

interface EventHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: (...args: any[]) => void;
}

interface Painterro {
  show(openImage?: string, originalMime?: string): void;
}

class Main implements IMain, Painterro {
  public params: Parameters;
  private settings: Settings;
  public doc: Document;
  public id: string;
  public holderId: string = "";

  public isMobile: boolean = false;
  public colorPicker: ColorPicker;
  public zoomHelper: ZoomHelper;
  public baseEl: HTMLElement;
  public holderEl?: HTMLDivElement;
  public scroller: HTMLElement;
  public bar: HTMLElement;
  public size: Size = { w: 0, h: 0, ratio: 1 };

  // private tools: Tool[];
  public primitiveTool: PrimitiveTool;
  private initText: HTMLDivElement | null = null;
  public colorWidgetState: ColorWidgetState;
  public currentBackground: string;
  public currentBackgroundAlpha: number;
  public wrapper: HTMLDivElement & DocumentHelper;
  public inserter: Inserter;
  private controlBuilder: ControlBuilder;
  private toolControls: HTMLDivElement;
  public toolContainer: HTMLDivElement & DocumentHelper;
  public canvas: HTMLCanvasElement & DocumentHelper;
  public ctx: CanvasRenderingContext2D;
  public tabelCell: HTMLDivElement;
  public select: PainterroSelecter;
  private defaultTool: ITool;
  public activeTool?: ITool;
  private windowHandlers: EventHandler = {};
  private shown: boolean = false;
  public tools: ITools;
  public worklog: WorkLog;
  private body: HTMLElement;
  public textTool: TextTool;
  private zoom: boolean = false;
  private zoomFactor: number = 1;
  private zoomButtonActive: boolean = false;
  private saving: boolean = false;
  private resizer: Resizer;
  private curCord: number[] = [];
  private fileInputId: string;
  private hasUnsaved: boolean = false;
  private ratioRelation?: number | boolean;
  public loadedName: string;
  private saveBtn?: HTMLButtonElement;
  private info: HTMLElement;
  private substrate: HTMLElement;
  private imageSaver: ImageSaver;
  private loadedImageType?: string;
  private documentHandlers: EventHandler = {};
  private lastFingerDist: number = 0;
  private listenersInstalled: boolean = false;
  private scrollWidth: number = 0;
  private origOverflowY: string = "";
  private originalMime: string = "";

  get curCordX(): number {
    return this.curCord[0] || 0;
  }

  get curCordY(): number {
    return this.curCord[1] || 0;
  }

  constructor(params: Parameters) {
    this.doc = document;
    addDocumentObjectHelpers();
    this.params = setDefaults(params);
    this.controlBuilder = new ControlBuilder(this);
    // this.getElemByIdSafe = (id) => {
    //   if (!id) {
    //     throw new Error(`Can't get element with id=${id}, please create an issue here, we will easily fx it: https://github.com/devforth/painterro/issues/`);
    //   }
    //   return document.getElementById(id);
    // };

    this.colorWidgetState = {
      line: {
        target: "line",
        palleteColor: this.params.activeColor,
        alpha: this.params.activeColorAlpha,
        alphaColor: this.params.activeAlphaColor,
      },
      fill: {
        target: "fill",
        palleteColor: this.params.activeFillColor,
        alpha: this.params.activeFillColorAlpha,
        alphaColor: this.params.activeFillAlphaColor,
      },
      bg: {
        target: "bg",
        palleteColor: this.params.backgroundFillColor,
        alpha: this.params.backgroundFillColorAlpha,
        alphaColor: this.params.backgroundFillAlphaColor,
      },
      // stroke: {
      //   target: 'stroke',
      //   palleteColor: this.params.textStrokeColor,
      //   alpha: this.params.textStrokeColorAlpha,
      //   alphaColor: this.params.textStrokeAlphaColor,
      // },
    };
    this.currentBackground = this.colorWidgetState.bg.alphaColor || "";
    this.currentBackgroundAlpha = this.colorWidgetState.bg.alpha !== undefined ? this.colorWidgetState.bg.alpha : 1;

    const tools: ITools = {
      select: {
        hotkey: Hotkey.s,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.toolContainer.style.cursor = "crosshair";
          this.select.activate();
          this.select.draw();
        },
        close: () => {
          this.select.close();
          this.toolContainer.style.cursor = "auto";
        },
        eventDelegate: () => this.select,
      },
      crop: {
        hotkey: Hotkey.c,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.select.doCrop();
          this.closeActiveTool();
        },
      },
      pixelize: {
        // name: "pixelize",
        hotkey: Hotkey.p,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.select.doPixelize();
          this.closeActiveTool();
        },
      },
      line: {
        // name: "line",
        hotkey: Hotkey.l,
        buttonId: "",
        right: false,
        controls: [
          {
            type: "color",
            title: "lineColor",
            target: "line",
            titleFull: "lineColorFull",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.line);
            },
          },
          this.controlBuilder.buildLineWidthControl(1),
          this.controlBuilder.buildShadowOnControl(2),
        ],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.toolContainer.style.cursor = "crosshair";
          this.primitiveTool.activate("line");
        },
        eventDelegate: () => this.primitiveTool,
      },
      arrow: {
        // name: "arrow",
        hotkey: Hotkey.a,
        buttonId: "",
        right: false,
        controls: [
          {
            type: "color",
            title: "lineColor",
            target: "line",
            titleFull: "lineColorFull",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.line);
            },
          },
          this.controlBuilder.buildArrowLengthControl(1),
          this.controlBuilder.buildShadowOnControl(2),
        ],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.toolContainer.style.cursor = "crosshair";
          this.primitiveTool.activate("arrow");
        },
        eventDelegate: () => this.primitiveTool,
      },
      rect: {
        // name: "rect",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [
          {
            type: "color",
            title: "lineColor",
            titleFull: "lineColorFull",
            target: "line",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.line);
            },
          },
          {
            type: "color",
            title: "fillColor",
            titleFull: "fillColorFull",
            target: "fill",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.fill);
            },
          },
          this.controlBuilder.buildLineWidthControl(2),
          this.controlBuilder.buildShadowOnControl(3),
        ],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.toolContainer.style.cursor = "crosshair";
          this.primitiveTool.activate("rect");
        },
        eventDelegate: () => this.primitiveTool,
      },
      ellipse: {
        // name: "ellipse",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [
          {
            type: "color",
            title: "lineColor",
            titleFull: "lineColorFull",
            target: "line",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.line);
            },
          },
          {
            type: "color",
            title: "fillColor",
            titleFull: "fillColorFull",
            target: "fill",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.fill);
            },
          },
          this.controlBuilder.buildLineWidthControl(2),
          this.controlBuilder.buildShadowOnControl(3),
        ],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.toolContainer.style.cursor = "crosshair";
          this.primitiveTool.activate("ellipse");
        },
        eventDelegate: () => this.primitiveTool,
      },
      brush: {
        // name: "brush",
        hotkey: Hotkey.b,
        buttonId: "",
        right: false,
        controls: [
          {
            type: "color",
            title: "lineColor",
            target: "line",
            titleFull: "lineColorFull",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.line);
            },
          },
          this.controlBuilder.buildLineWidthControl(1),
        ],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.toolContainer.style.cursor = "crosshair";
          this.primitiveTool.activate("brush");
        },
        eventDelegate: () => this.primitiveTool,
      },
      eraser: {
        // name: "eraser",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [this.controlBuilder.buildEraserWidthControl(0)],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.toolContainer.style.cursor = "crosshair";
          this.primitiveTool.activate("eraser");
        },
        eventDelegate: () => this.primitiveTool,
      },
      text: {
        // name: "text",
        hotkey: Hotkey.t,
        buttonId: "",
        right: false,
        controls: [
          {
            type: "color",
            title: "textColor",
            titleFull: "textColorFull",
            target: "line",
            action: () => {
              this.colorPicker.open(this.colorWidgetState.line, (c) => {
                this.textTool.setFontColor(c.alphaColor);
              });
            },
          },
          this.controlBuilder.buildFontSizeControl(1),
          {
            type: "dropdown",
            title: "fontName",
            titleFull: "fontNameFull",
            target: "fontName",
            action: () => {
              const dropdown = this.getElemByIdSafe(this.activeTool?.controls[2]?.id);
              const font = dropdown.value;
              this.textTool.setFont(font);
            },
            getValue: () => this.textTool.getFont(),
            getAvailableValues: () => this.textTool.getFonts(),
          },
          {
            type: "bool",
            title: "fontIsBold",
            titleFull: "fontIsBoldFull",
            target: "fontIsBold",
            action: () => {
              const btn = this.getElemByIdSafe(this.activeTool?.controls[3]?.id);
              const state = !(btn.getAttribute("data-value") === "true");
              this.textTool.setFontIsBold(state);
              setParam("defaultFontBold", state);
              btn.setAttribute("data-value", state ? "true" : "false"); // invert
            },
            getValue: () => !!this.textTool.isBold,
          },
          {
            type: "bool",
            title: "fontIsItalic",
            titleFull: "fontIsItalicFull",
            target: "fontIsItalic",
            action: () => {
              const btn = this.getElemByIdSafe(this.activeTool?.controls[4]?.id);
              const state = !(btn.getAttribute("data-value") === "true"); // invert
              this.textTool.setFontIsItalic(state);
              setParam("defaultFontItalic", state);
              btn.setAttribute("data-value", state ? "true" : "false");
            },
            getValue: () => !!this.textTool.isItalic,
          },
          {
            type: "bool",
            title: "fontStrokeAndShadow",
            titleFull: "fontStrokeAndShadowFull",
            target: "fontStrokeAndShadow",
            action: () => {
              const btn = this.getElemByIdSafe(this.activeTool?.controls[5]?.id);
              const nextState = !(btn.getAttribute("data-value") === "true");
              this.textTool.setStrokeOn(nextState);
              setParam("defaultTextStrokeAndShadow", nextState);
              btn.setAttribute("data-value", nextState ? "true" : "false");
            },
            getValue: () => !!this.textTool.strokeOn,
          },
        ],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.textTool.setFontColor(this.colorWidgetState.line.alphaColor || ""); // TODO default colo
          // this.textTool.setStrokeColor(this.colorWidgetState.stroke.alphaColor);
          this.toolContainer.style.cursor = "crosshair";
        },
        close: () => {
          this.textTool.close();
        },
        eventDelegate: () => this.textTool,
      },
      rotate: {
        // name: "rotate",
        hotkey: Hotkey.r,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) {
            this.wrapper.click();
          }
          const w = this.size.w;
          const h = this.size.h;
          const tmpData = this.ctx.getImageData(0, 0, this.size.w, this.size.h);
          const tmpCan = this.doc.createElement("canvas");
          tmpCan.width = w;
          tmpCan.height = h;
          tmpCan.getContext("2d")!.putImageData(tmpData, 0, 0);
          this.resize(h, w);
          this.ctx.save();
          this.ctx.translate(h / 2, w / 2);
          this.ctx.rotate((90 * Math.PI) / 180);
          this.ctx.drawImage(tmpCan, -w / 2, -h / 2);
          this.adjustSizeFull();
          this.ctx.restore();
          this.worklog.captureState();
          this.closeActiveTool();
        },
      },
      resize: {
        // name: "resize",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.resizer.open();
        },
        close: () => {
          this.resizer.close();
        },
        eventDelegate: () => this.resizer,
      },
      undo: {
        // name: "undo",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.worklog.undoState();
          this.closeActiveTool();
        },
        eventDelegate: () => this.resizer,
      },
      redo: {
        // name: "redo",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.worklog.redoState();
          this.closeActiveTool();
        },
        eventDelegate: () => this.resizer,
      },
      settings: {
        // name: "settings",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.settings.open();
        },
        close: () => {
          this.settings.close();
        },
        eventDelegate: () => this.settings,
      },
      zoomout: {
        // name: "zoomout",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.zoomButtonActive = true;
          const canvas = this.canvas;
          const gbr = canvas.getBoundingClientRect();
          const evt: ZoomInfo = {
            wheelDelta: -120,
            clientX: gbr.right / 2,
            clientY: gbr.bottom / 2,
          };

          this.curCord = [evt.clientX - this.elLeft() + this.scroller.scrollLeft, evt.clientY - this.elTop() + this.scroller.scrollTop];

          const scale = this.getScale();
          this.curCord = [this.curCordX * scale, this.curCordY * scale];

          this.zoomImage(evt);
        },
      },
      zoomin: {
        // name: "zoomin",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.zoomButtonActive = true;
          const canvas = this.canvas;
          const gbr = canvas.getBoundingClientRect();
          const evt: ZoomInfo = {
            wheelDelta: 120,
            clientX: gbr.right / 2,
            clientY: gbr.bottom / 2,
          };

          this.curCord = [evt.clientX - this.elLeft() + this.scroller.scrollLeft, evt.clientY - this.elTop() + this.scroller.scrollTop];

          const scale = this.getScale();
          this.curCord = [this.curCordX * scale, this.curCordY * scale];

          this.zoomImage(evt);
        },
      },
      save: {
        // name: "save",
        hotkey: this.params.saveByEnter ? Hotkey.enter : Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.save();
          this.closeActiveTool();
        },
      },
      open: {
        // name: "open",
        hotkey: Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          this.closeActiveTool();
          const input = this.getElemByIdSafe(this.fileInputId);
          input.onchange = (event: Event) => {
            const files = (event.target as HTMLInputElement)?.files || anyType<DataTransfer>(event).dataTransfer?.files;
            if (files?.[0]) {
              this.openFile(files[0]);
              input.value = ""; // to allow reopen
            }
          };
          input.click();
        },
      },
      close: {
        // name: "close",
        hotkey: this.params.hideByEsc ? Hotkey.esc : Hotkey.none,
        buttonId: "",
        right: false,
        controls: [],
        activate: () => {
          if (this.initText) this.wrapper.click();
          const doClose = () => {
            this.closeActiveTool();
            this.close();
            this.hide();
          };

          if (this.params.onBeforeClose) {
            this.params.onBeforeClose(this.hasUnsaved, doClose);
          } else {
            doClose();
          }
        },
      },
    };
    tools.close.activate;
    this.tools = tools;
    this.isMobile = isMobile().any;
    this.activeTool = undefined;
    this.zoom = false;
    this.ratioRelation = undefined;
    // this.id = this.params.id;
    this.saving = false;

    if (params.id) {
      this.id = params.id;
    } else {
      this.id = genId();
      this.holderId = genId();
      const holderEl = document.createElement("div");
      holderEl.id = genId();
      holderEl.className = "ptro-holder-wrapper";
      document.body.appendChild(holderEl);
      holderEl.innerHTML = `<div id='${this.id}' class="ptro-holder"></div>`;
    }
    this.baseEl = this.getElemByIdSafe(this.id);

    let bar = "";
    let rightBar = "";
    const hiddenTools = this.params.hiddenTools || [];
    Object.entries(tools).forEach(([key, value]) => {
      if (!hiddenTools.includes(key)) {
        const tool = value as ITool;
        const id = genId();
        tool.buttonId = id;
        const keyname = Hotkey[tool.hotkey];
        const hotkey = keyname ? ` [${keyname.toUpperCase()}]` : "";
        const btn =
          `<button type="button" class="ptro-icon-btn ptro-color-control" title="${tr(`tools.${key}`)}${hotkey}" ` +
          `id="${id}" >` +
          `<i class="ptro-icon ptro-icon-${key}"></i></button>`;
        if (tool.right) {
          rightBar += btn;
        } else {
          bar += btn;
        }
      }
    });

    this.inserter = Inserter.get(this) as Inserter;

    const cropper = '<div class="ptro-crp-el">' + `${PainterroSelecter.code()}${TextTool.code()}</div>`;

    this.loadedName = "";
    // this.doc = document; TODO moved to top
    this.wrapper = this.doc.createElement("div") as HTMLDivElement & DocumentHelper;
    this.wrapper.id = `${this.id}-wrapper`;
    this.wrapper.className = "ptro-wrapper";
    this.wrapper.innerHTML =
      '<div class="ptro-scroller">' +
      '<div class="ptro-center-table">' +
      '<div class="ptro-center-tablecell">' +
      `<canvas id="${this.id}-canvas"></canvas>` +
      `<div class="ptro-substrate"></div>${cropper}` +
      "</div>" +
      "</div>" +
      `</div>${ColorPicker.html() + ZoomHelper.html() + Resizer.html() + Settings.html(this) + this.inserter.html()}`;
    this.baseEl.appendChild(this.wrapper);
    this.scroller = this.doc.querySelector(`#${this.id}-wrapper .ptro-scroller`)!;
    this.bar = this.doc.createElement("div");
    this.bar.id = `${this.id}-bar`;
    this.bar.className = "ptro-bar ptro-color-main";
    this.fileInputId = genId();
    this.bar.innerHTML =
      `<div>${bar}` +
      '<span class="ptro-tool-controls"></span>' +
      '<span class="ptro-info"></span>' +
      `<span class="ptro-bar-right">${rightBar}</span>` +
      `<input id="${this.fileInputId}" type="file" style="display: none" value="none" accept="image/x-png,image/png,image/gif,image/jpeg" /></div>`;
    if (this.isMobile) {
      anyType(this.bar.style)["overflow-x"] = "auto";
    }

    this.baseEl.appendChild(this.bar);
    const style = this.doc.createElement("style");
    style.type = "text/css";
    style.innerHTML = this.params.styles || "";
    this.baseEl.appendChild(style);

    // this.baseEl.innerHTML = '<iframe class="ptro-iframe"></iframe>';
    // this.iframe = this.baseEl.getElementsByTagName('iframe')[0];
    // this.doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
    // this.doc.body.innerHTML = html;
    const buttonId = this.tools.save.buttonId;
    const saveBtn = (buttonId && (this.baseEl.querySelector(`#${buttonId}`) as HTMLButtonElement)) || undefined;
    if (saveBtn) {
      this.saveBtn = saveBtn;
      this.saveBtn.setAttribute("disabled", "true");
    }
    this.body = this.doc.body;
    this.info = this.doc.querySelector(`#${this.id}-bar .ptro-info`)!;
    this.canvas = this.doc.querySelector(`#${this.id}-canvas`)!;
    this.tabelCell = this.canvas.parentElement as HTMLDivElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.toolControls = this.doc.querySelector(`#${this.id}-bar .ptro-tool-controls`)!;
    this.toolContainer = this.doc.querySelector(`#${this.id}-wrapper .ptro-crp-el`)!;
    this.substrate = this.doc.querySelector(`#${this.id}-wrapper .ptro-substrate`)!;
    this.zoomHelper = new ZoomHelper(this);
    this.zoomButtonActive = false;
    this.select = new PainterroSelecter(this, (notEmpty) => {
      [this.tools.crop, this.tools.pixelize].forEach((c) => {
        this.setToolEnabled(c, notEmpty);
      });
    });
    if (this.params.backplateImgUrl) {
      this.tabelCell = this.canvas.parentElement as HTMLDivElement;
      this.tabelCell.style.backgroundImage = `url(${this.params.backplateImgUrl})`;
      this.tabelCell.style.backgroundRepeat = "no-repeat";
      this.tabelCell.style.backgroundPosition = "center center";
      const img = new Image();
      img.onload = () => {
        this.resize(img.naturalWidth, img.naturalHeight);
        this.adjustSizeFull();
        this.worklog.captureState();
        this.tabelCell.style.backgroundSize = `${window.getComputedStyle(this.substrate).width} ${window.getComputedStyle(this.substrate).height}`;
      };
      img.src = this.params.backplateImgUrl;
    }
    this.resizer = new Resizer(this);
    this.settings = new Settings(this);
    this.primitiveTool = new PrimitiveTool(this);
    this.primitiveTool.setShadowOn(def(this.params.defaultPrimitiveShadowOn, true));
    this.primitiveTool.setLineWidth(def(this.params.defaultLineWidth, 3));
    this.primitiveTool.setArrowLength(def(this.params.defaultArrowLength, 20));
    this.primitiveTool.setEraserWidth(def(this.params.defaultEraserWidth, 5));
    this.primitiveTool.setPixelSize(def(this.params.defaultPixelSize, 20));
    this.hasUnsaved = false;
    this.worklog = new WorkLog(this, (state) => {
      if (this.saveBtn && !state.initial) {
        this.saveBtn.removeAttribute("disabled");
        this.hasUnsaved = true;
      }
      this.setToolEnabled(this.tools.undo, !state.first);
      this.setToolEnabled(this.tools.redo, !state.last);
      if (this.params.onChange) {
        this.params.onChange.call(this, {
          image: this.imageSaver,
          operationsDone: this.worklog.current?.prevCount,
          realesedMemoryOperations: this.worklog.clearedCount,
        });
      }
    });
    this.inserter.init(this);
    this.textTool = new TextTool(this);
    this.colorPicker = new ColorPicker(this, (widgetState) => {
      anyType(this.colorWidgetState)[widgetState.target] = widgetState;
      const target = this.doc.querySelector(`#${this.id} .ptro-color-btn[data-id='${widgetState.target}']`) as HTMLElement;
      if (target) {
        anyType(target.style)["background-color"] = widgetState.alphaColor;
      }
      const palletRGB = HexToRGB(widgetState.palleteColor);
      if (palletRGB !== undefined) {
        widgetState.palleteColor = rgbToHex(palletRGB.r, palletRGB.g, palletRGB.b);
        if (widgetState.target === "line") {
          setParam("activeColor", widgetState.palleteColor);
          setParam("activeColorAlpha", widgetState.alpha);
        } else if (widgetState.target === "fill") {
          setParam("activeFillColor", widgetState.palleteColor);
          setParam("activeFillColorAlpha", widgetState.alpha);
        } else if (widgetState.target === "bg") {
          setParam("backgroundFillColor", widgetState.palleteColor);
          setParam("backgroundFillColorAlpha", widgetState.alpha);
        } else if (widgetState.target === "stroke") {
          setParam("textStrokeColor", widgetState.palleteColor);
          setParam("textStrokeColorAlpha", widgetState.alpha);
        }
      }
    });

    this.defaultTool = tools.select;
    Object.entries(anyType<ITool>(tools)).forEach(([key, tool]) => {
      if (!hiddenTools.includes(key)) {
        const el = this.getBtnEl(tool);
        el.onclick = () => {
          if (tool === this.defaultTool && this.activeTool === tool) {
            return;
          }
          const currentActive = this.activeTool;
          this.closeActiveTool(true);
          if (currentActive !== tool) {
            this.setActiveTool(tool);
          } else {
            this.setActiveTool(this.defaultTool);
          }
        };
        anyType(this.getBtnEl(tool)).ontouch = el.onclick;
        if (this.params.defaultTool === key) {
          this.defaultTool = tool;
        }
      }
    });

    this.getBtnEl(this.defaultTool).click();

    this.imageSaver = {
      /**
       * Returns image as base64 data url.
       *
       * @param {string} type     - type of data url, default image/png.
       * @param {string} quality  - number from 0 to 1, works for `image/jpeg` or `image/webp`
       */
      asDataURL: (type: string, quality: number): string => {
        let realType = type;
        if (realType === undefined) {
          if (this.loadedImageType) {
            realType = this.loadedImageType;
          } else {
            realType = "image/png";
          }
        }
        return this.getAsUri(realType, quality);
      },
      asBlob: (type: string, quality: number) => {
        let realType = type;
        if (realType === undefined) {
          if (this.loadedImageType) {
            realType = this.loadedImageType;
          } else {
            realType = "image/png";
          }
        }
        const uri = this.getAsUri(realType, quality);
        const byteString = atob(uri.split(",")[1] || "");
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i += 1) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {
          type: realType,
        });
      },
      getOriginalMimeType: () => this.loadedImageType || "",
      hasAlphaChannel: () => {
        const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        for (let i = 3, n = data.length; i < n; i += 4) {
          const value = data[i];
          if (value !== undefined && value < 255) {
            return true;
          }
        }
        return false;
      },
      suggestedFileName: (type: string) => {
        let realType = type;
        if (realType === undefined) {
          realType = "png";
        }
        return `${this.loadedName || `image-${genId()}`}.${realType}`;
      },
      getWidth: () => this.size.w,
      getHeight: () => this.size.h,
    };

    this.initEventHandlers();
    this.hide();
    this.zoomFactor = 1;
  }

  // getElemByIdSafe(_id: string): HTMLElement | null {
  //   throw new Error('Method not implemented.');
  // }

  getElemByIdSafe = (id?: string): HTMLInputElement => {
    const el = id && (document.getElementById(id) as HTMLInputElement); // observed requests for INPUT
    if (!el) {
      throw new Error(
        `Can't get element with id=${id || "null"}, please create an issue here, we will easily fx it: https://github.com/devforth/painterro/issues/`
      );
    }
    return el;
  };

  setToolEnabled = (tool: ITool, state?: boolean) => {
    if (tool.buttonId) {
      const btn = this.getElemByIdSafe(tool.buttonId);
      if (state) {
        btn.removeAttribute("disabled");
      } else {
        btn.setAttribute("disabled", "true");
      }
    }
  };

  getAsUri = (type: string, quality?: number) => {
    let realQuality = quality;
    if (realQuality === undefined) {
      realQuality = 0.92;
    }
    return this.canvas.toDataURL(type, realQuality);
  };

  getBtnEl = (tool: ITool): HTMLButtonElement => {
    return this.getElemByIdSafe(tool.buttonId) as HTMLButtonElement;
  };

  save = () => {
    if (this.saving) {
      return this;
    }
    this.saving = true;
    const btn = this.baseEl.querySelector(`#${this.tools.save.buttonId}`);
    const icon = this.baseEl.querySelector(`#${this.tools.save.buttonId} > i`);
    if (this.tools.save.buttonId && btn) {
      btn.setAttribute("disabled", "true");
    }
    this.hasUnsaved = false;

    if (icon) {
      icon.className = "ptro-icon ptro-icon-loading ptro-spinning";
    }

    if (this.params.saveHandler !== undefined) {
      this.params.saveHandler(this.imageSaver, (hide: boolean) => {
        if (hide === true) {
          this.hide();
        }
        if (icon) {
          icon.className = "ptro-icon ptro-icon-save";
        }
        this.saving = false;
      });
    } else {
      logError("No saveHandler defined, please check documentation");
      if (icon) {
        icon.className = "ptro-icon ptro-icon-save";
      }
      this.saving = false;
    }
    return this;
  };

  close = () => {
    if (this.params.onClose !== undefined) {
      this.params.onClose();
    }
  };

  closeActiveTool = (doNotSelect?: boolean) => {
    if (this.activeTool !== undefined) {
      if (this.activeTool.close !== undefined) {
        this.activeTool.close();
      }
      this.toolControls.innerHTML = "";
      const btnEl = this.getBtnEl(this.activeTool);
      if (btnEl) {
        btnEl.className = this.getBtnEl(this.activeTool).className.replace(" ptro-color-active-control", "");
      }
      this.activeTool = undefined;
    }
    if (doNotSelect !== true) {
      this.setActiveTool(this.defaultTool);
    }
  };

  handleToolEvent = (eventHandler: string, event: Event) => {
    if (this.activeTool?.eventDelegate) {
      const delegate = this.activeTool.eventDelegate();
      const handler = anyFunc(delegate)[eventHandler];
      if (handler) {
        return handler(event);
      }
    }
    return false;
  };

  clipCopyBlob = async (canvas: HTMLCanvasElement, format: string): Promise<void> => {
    const data = new Promise((resolve: (blob: Blob) => void) => canvas.toBlob(resolve as BlobCallback, format, 1.0)); // as ClipboardItemData;
    const record = { [format]: data } as Record<string, ClipboardItemData>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const item = new ClipboardItem(record);
    await navigator.clipboard.write([item]);
  };

  handleClipCopyEvent = (evt: KeyboardEvent) => {
    let handled = false;
    const clipFormat = "image/png";
    if (evt.keyCode === Hotkey.c && (evt.ctrlKey || evt.metaKey)) {
      if (!this.inserter.waitChoice && !this.select.imagePlaced && this.select.shown) {
        const a = this.select.area;
        const w = a.bx - a.tx;
        const h = a.by - a.ty;
        const tmpCan = this.doc.createElement("canvas");
        tmpCan.width = w;
        tmpCan.height = h;
        const tmpCtx = tmpCan.getContext("2d")!;
        tmpCtx.drawImage(this.canvas, -a.tx, -a.ty);
        void this.clipCopyBlob(tmpCan, clipFormat);
        handled = true;
      } else {
        void this.clipCopyBlob(this.canvas, clipFormat);
        handled = true;
      }
    }
    return handled;
  };

  zoomImage = (zoom: ZoomInfo, forceWheenDelta?: boolean) => {
    const { wheelDelta, clientX, clientY } = zoom;
    let whD = wheelDelta;
    if (forceWheenDelta !== undefined) {
      whD = 1;
    }
    let minFactor = 1;
    if (this.size.w > this.wrapper.documentClientWidth) {
      minFactor = Math.min(minFactor, this.wrapper.documentClientWidth / this.size.w);
    }
    if (this.size.h > this.wrapper.documentClientHeight) {
      minFactor = Math.min(minFactor, this.wrapper.documentClientHeight / this.size.h);
    }
    if (!this.zoom && this.zoomFactor > minFactor) {
      this.zoomFactor = minFactor;
    }
    this.zoomFactor += Math.sign(whD) * 0.2;
    if (this.zoomFactor < minFactor) {
      this.zoom = false;
      this.zoomFactor = minFactor;
    } else {
      this.zoom = true;
    }
    this.adjustSizeFull();
    this.select.adjustPosition();
    if (this.zoom) {
      this.scroller.scrollLeft = this.curCordX / this.getScale() - (clientX - this.wrapper.documentOffsetLeft);
      this.scroller.scrollTop = this.curCordY / this.getScale() - (clientY - this.wrapper.documentOffsetTop);
    }
  };

  initEventHandlers = () => {
    const mousedown = (evt: MouseEvent): void => {
      if (this.shown) {
        const target = evt.target as HTMLElement;
        if (
          this.worklog.empty &&
          (target.className.indexOf("ptro-crp-el") !== -1 || target.className.indexOf("ptro-icon") !== -1 || target.className.indexOf("ptro-named-btn") !== -1)
        ) {
          this.clearBackground(); // clear initText
        }
        if (this.colorPicker.handleMouseDown(evt) !== true) {
          this.handleToolEvent("handleMouseDown", evt);
        }
      }
    };

    const touchToMouse = (evt: TouchEvent): MouseEvent => {
      const touches = evt.changedTouches;
      const clientX = touches[0]?.clientX || 0;
      const clientY = touches[0]?.clientY || 0;
      const mouseEvent = Object.assign(new MouseEvent("simulated"), { clientX, clientY });
      return mouseEvent;
    };

    const touchToWheel = (evt: TouchEvent): WheelEvent => {
      const touches = evt.changedTouches;
      const clientX = touches[0]?.clientX || 0;
      const clientY = touches[0]?.clientY || 0;
      const mouseEvent = Object.assign(new WheelEvent("simulated"), { clientX, clientY });
      return mouseEvent;
    };

    const touchToDistance = (evt: TouchEvent): number => {
      const touches = evt.changedTouches;
      if (touches[0] && touches[1]) {
        return distance(
          {
            x: touches[0].clientX,
            y: touches[0].clientY,
          },
          {
            x: touches[1].clientX,
            y: touches[1].clientY,
          }
        );
      }
      return 0;
    };

    const touchstart = (evt: TouchEvent) => {
      const touches = evt.changedTouches;
      if (touches[0] && !touches[1]) {
        mousedown(touchToMouse(evt));
      } else if (touches[0] && touches[1]) {
        this.lastFingerDist = touchToDistance(evt);
      }
    };
    const touchend = (evt: TouchEvent) => {
      mouseup(touchToMouse(evt));
    };

    const touchmove = (evt: TouchEvent) => {
      const touches = evt.changedTouches;
      if (touches[0] && !touches[1]) {
        mousemove(touchToMouse(evt));
      } else if (touches[0] && touches[1]) {
        const fingersDist = touchToDistance(evt);
        const wheel = touchToWheel(evt);
        if (fingersDist > this.lastFingerDist) {
          mousewheel(wheel, true, true);
        } else if (fingersDist < this.lastFingerDist) {
          mousewheel(wheel, true, true);
        }
        this.lastFingerDist = fingersDist;
        evt.stopPropagation();
        if (!this.zoomButtonActive) evt.preventDefault();
      }
    };

    const mousemove = (evt: MouseEvent) => {
      if (this.shown) {
        this.handleToolEvent("handleMouseMove", evt);
        this.colorPicker.handleMouseMove(evt);
        this.zoomHelper.handleMouseMove(evt);
        this.curCord = [evt.clientX - this.elLeft() + this.scroller.scrollLeft, evt.clientY - this.elTop() + this.scroller.scrollTop];
        const scale = this.getScale();
        this.curCord = [this.curCordX * scale, this.curCordY * scale];
        const target = evt.target as HTMLElement;
        if (
          target.tagName.toLowerCase() !== "input" &&
          target.tagName.toLowerCase() !== "button" &&
          target.tagName.toLowerCase() !== "i" &&
          target.tagName.toLowerCase() !== "select"
        ) {
          if (!this.zoomButtonActive) evt.preventDefault();
        }
      }
    };
    const mouseup = (evt: Event) => {
      if (this.shown) {
        this.handleToolEvent("handleMouseUp", evt);
        this.colorPicker.handleMouseUp(evt);
      }
    };
    const mousewheel = (evt: WheelEvent, forceWheelDelta?: boolean, forceCtrlKey?: boolean) => {
      if (this.shown) {
        if (forceCtrlKey !== undefined ? forceCtrlKey : evt.ctrlKey) {
          const zoom: ZoomInfo = {
            clientX: evt.clientX,
            clientY: evt.clientY,
            wheelDelta: -evt.deltaY,
          };
          this.zoomImage(zoom, forceWheelDelta);
          evt.preventDefault();
        }
      }
    };
    const keydown = (evt: KeyboardEvent) => {
      if (evt.target !== document.body) {
        return; // ignore all focused inputs on page
      }
      if (this.shown) {
        if (this.colorPicker.handleKeyDown(evt)) {
          return;
        }
        if (this.handleClipCopyEvent(evt)) {
          return;
        }
        if (window.event instanceof KeyboardEvent) {
          evt = window.event; // TODO is this necessary
        }
        if (this.handleToolEvent("handleKeyDown", evt)) {
          return;
        }
        if ((evt.keyCode === Hotkey.y && evt.ctrlKey) || (evt.keyCode === Hotkey.z && evt.ctrlKey && evt.shiftKey)) {
          this.worklog.redoState();
          evt.preventDefault();
          if (this.params.userRedo) {
            this.params.userRedo.call(this);
          }
        } else if (evt.keyCode === Hotkey.z && evt.ctrlKey) {
          this.worklog.undoState();
          evt.preventDefault();
          if (this.params.userUndo) {
            this.params.userUndo.call(this);
          }
        }
        const tool = Object.values(anyType<ITool>(this.tools)).find((tool) => (tool.hotkey === evt.keyCode ? tool : undefined));
        if (tool) {
          this.getBtnEl(tool).click();
          evt.stopPropagation();
          evt.preventDefault();
        }
        if (this.saveBtn) {
          if (evt.keyCode === Hotkey.s && evt.ctrlKey) {
            if (this.initText) this.wrapper.click();
            this.save();
            evt.preventDefault();
          }
        }
      }
    };
    const paste = (evt: ClipboardEvent) => {
      if (this.initText) this.wrapper.click();
      if (this.shown && evt.clipboardData) {
        const items = evt.clipboardData.items; // TODO verify dropped "originalEvent.clipboardData" alt

        Object.values(items).forEach((item) => {
          if (item.kind === "file" && item.type.split("/")[0] === "image") {
            const file = item.getAsFile();
            if (file) {
              this.openFile(file);
              evt.preventDefault();
              evt.stopPropagation();
            }
          }
        });
      }
    };
    const dragover = (evt: DragEvent) => {
      if (this.shown && evt.target instanceof HTMLElement) {
        const mainClass = evt.target.classList[0];
        if (mainClass === "ptro-crp-el" || mainClass === "ptro-bar") {
          this.bar.className = "ptro-bar ptro-color-main ptro-bar-dragover";
        }
        evt.preventDefault();
      }
    };
    const dragleave = () => {
      if (this.shown) {
        this.bar.className = "ptro-bar ptro-color-main";
      }
    };
    const drop = (evt: DragEvent) => {
      if (this.shown && evt.dataTransfer) {
        this.bar.className = "ptro-bar ptro-color-main";
        evt.preventDefault();
        const file = evt.dataTransfer.files[0];
        if (file) {
          this.openFile(file);
        } else {
          const text = evt.dataTransfer.getData("text/html");
          const srcRe = /src.*?=['"](.+?)['"]/;
          const srcMatch = srcRe.exec(text);
          if (srcMatch && srcMatch[1]) {
            this.inserter.handleOpen(srcMatch[1]);
          }
        }
      }
    };

    this.documentHandlers = {
      touchstart,
      touchmove,
      touchend,
      mouseup,
      mousedown,
      mousemove,
      mousewheel,
      keydown,
      paste,
      dragover,
      dragleave,
      drop,
    };

    this.windowHandlers = {
      resize: () => {
        if (this.shown) {
          this.adjustSizeFull();
          this.syncToolElement();
        }
      },
    };
    this.listenersInstalled = false;
  };

  attachEventHandlers = () => {
    if (this.listenersInstalled) {
      return;
    }
    // passive: false fixes Unable to preventDefault inside passive event
    // listener due to target being treated as passive
    Object.entries(this.documentHandlers).forEach(([key, value]) => {
      this.doc.addEventListener(key, value, { passive: false });
    });

    Object.entries(this.windowHandlers).forEach(([key, value]) => {
      window.addEventListener(key, value, { passive: false });
    });
    this.listenersInstalled = true;
  };

  removeEventHandlers = () => {
    if (!this.listenersInstalled) {
      return;
    }
    Object.entries(this.documentHandlers).forEach(([key, value]) => {
      this.doc.removeEventListener(key, value);
    });
    Object.entries(this.windowHandlers).forEach(([key, value]) => {
      window.removeEventListener(key, value);
    });

    this.listenersInstalled = false;
  };

  elLeft = () => {
    return this.toolContainer.documentOffsetLeft + this.scroller.scrollLeft;
  };

  elTop = () => {
    return this.toolContainer.documentOffsetTop + this.scroller.scrollTop;
  };

  fitImage = (img: HTMLImageElement, mimetype: string) => {
    this.loadedImageType = mimetype;
    this.resize(img.naturalWidth, img.naturalHeight);
    this.ctx.drawImage(img, 0, 0);
    this.zoomFactor = this.wrapper.documentClientHeight / this.size.h - 0.2;
    this.adjustSizeFull();
    this.worklog.captureState();
  };

  loadImage = (source: string, mimetype: string) => {
    this.inserter.handleOpen(source, mimetype);
  };

  show = (openImage: string, originalMime: string) => {
    this.shown = true;
    this.scrollWidth = getScrollbarWidth();
    if (this.isMobile) {
      this.origOverflowY = anyType<string>(this.body.style)["overflow-y"] || "";
      if (this.params.fixMobilePageReloader) {
        anyType(this.body.style)["overflow-y"] = "hidden";
      }
    }
    this.baseEl.removeAttribute("hidden");
    if (this.holderEl) {
      this.holderEl.removeAttribute("hidden");
    }
    if (typeof openImage === "string") {
      this.loadedName = trim((openImage.substring(openImage.lastIndexOf("/") + 1) || "").replace(/\..+$/, ""));

      this.loadImage(openImage, originalMime);
    } else if (openImage !== false) {
      this.clear();
    }
    this.attachEventHandlers();
    return this;
  };

  hide = () => {
    if (this.isMobile) {
      anyType(this.body.style)["overflow-y"] = this.origOverflowY;
    }
    this.shown = false;
    this.baseEl.setAttribute("hidden", "");
    if (this.holderEl) {
      this.holderEl.setAttribute("hidden", "");
    }
    this.removeEventHandlers();
    if (this.params.onHide !== undefined) {
      this.params.onHide();
    }
    return this;
  };

  openFile = (f: File) => {
    if (!f) {
      return;
    }
    this.loadedName = trim((f.name || "").replace(/\..+$/, ""));
    const dataUrl = (window.URL ? window.URL : window.webkitURL).createObjectURL(f);
    this.loadImage(dataUrl, f.type);
  };

  getScale = () => {
    return parseInt(this.canvas.getAttribute("width") || "") / this.canvas.offsetWidth || 1;
  };

  adjustSizeFull = () => {
    const ratio = this.wrapper.documentClientWidth / this.wrapper.documentClientHeight;
    if (this.zoom === false) {
      if (this.size.w > this.wrapper.documentClientWidth || this.size.h > this.wrapper.documentClientHeight) {
        const newRelation = ratio < this.size.ratio;
        this.ratioRelation = newRelation;
        if (newRelation) {
          this.canvas.style.width = `${this.wrapper.clientWidth}px`;
          this.canvas.style.height = "auto";
        } else {
          this.canvas.style.width = "auto";
          this.canvas.style.height = `${this.wrapper.clientHeight}px`;
        }
        this.scroller.style.overflow = "hidden";
      } else {
        this.scroller.style.overflow = "hidden";
        this.canvas.style.width = "auto";
        this.canvas.style.height = "auto";
        this.ratioRelation = 0;
      }
    } else {
      this.scroller.style.overflow = "scroll";
      this.canvas.style.width = `${this.size.w * this.zoomFactor}px`;
      this.canvas.style.height = `${this.size.h * this.zoomFactor}px`;
      this.ratioRelation = 0;
    }
    this.syncToolElement();
    this.select.draw();
  };

  resize = (x: number, y: number) => {
    this.info.innerHTML = `${x}<span>x</span>${y}<br>${(this.originalMime || "png").replace("image/", "")}`;
    this.size = {
      w: x,
      h: y,
      ratio: x / y,
    };
    this.canvas.setAttribute("width", this.size.w.toString());
    this.canvas.setAttribute("height", this.size.h.toString());
  };

  syncToolElement = () => {
    const w = Math.round(this.canvas.documentClientWidth);
    const l = this.canvas.offsetLeft;
    const h = Math.round(this.canvas.documentClientHeight);
    const t = this.canvas.offsetTop;
    this.toolContainer.style.left = `${l}px`;
    this.toolContainer.style.width = `${w}px`;
    this.toolContainer.style.top = `${t}px`;
    this.toolContainer.style.height = `${h}px`;
    this.substrate.style.left = `${l}px`;
    this.substrate.style.width = `${w}px`;
    this.substrate.style.top = `${t}px`;
    this.substrate.style.height = `${h}px`;
  };

  clear = () => {
    let w = this.wrapper.clientWidth;
    let h = this.wrapper.clientHeight;
    const defaultSize = (typeof this.params.defaultSize === "string" && this.params.defaultSize.split(/^ *\d+ *[xX] *\d+ *$/)?.slice(1)) || undefined;
    if (defaultSize && defaultSize[0] && defaultSize[1]) {
      w = parseInt(defaultSize[0]);
      h = parseInt(defaultSize[1]);
    }
    this.resize(w, h);
    this.clearBackground();
    this.worklog.captureState(true);
    this.worklog.clean = true;
    this.syncToolElement();
    this.adjustSizeFull();

    if (this.params.initText && this.worklog.empty) {
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = "#fff";
      const initTexts = this.wrapper.querySelectorAll(".init-text");
      if (initTexts.length > 0) {
        initTexts.forEach((text) => {
          text.remove();
        });
      }
      this.initText = document.createElement("div");
      this.initText.classList.add("init-text");
      this.wrapper.append(this.initText);
      this.initText.innerHTML =
        '<div style="pointer-events: none;position:absolute;top:50%;width:100%;left: 50%; transform: translate(-50%, -50%)">' + `${this.params.initText}</div>`;
      this.initText.style.left = "0";
      this.initText.style.top = "0";
      this.initText.style.right = "0";
      this.initText.style.bottom = "0";
      this.initText.style.pointerEvents = "none";
      this.initText.style.textAlign = "center";
      this.initText.style.position = "absolute";
      this.initText.style.color = this.params.initTextColor || "";
      const font = (this.params.initTextStyle && this.params.initTextStyle.split(/ (.+)/)) || [];
      if (font[0] && font[1]) {
        this.initText.style.fontFamily = font[1];
        this.initText.style.fontSize = font[0];
      }

      this.wrapper.addEventListener(
        "click",
        () => {
          if (this.initText) {
            this.initText.remove();
            this.initText = null;
          }
        },
        { once: true }
      );
    }
  };

  clearBackground = () => {
    this.ctx.beginPath();
    this.ctx.clearRect(0, 0, this.size.w, this.size.h);
    this.ctx.rect(0, 0, this.size.w, this.size.h);
    this.ctx.fillStyle = this.currentBackground;
    this.ctx.fill();
  };

  setActiveTool = (b: ITool): void => {
    this.activeTool = b;
    this.zoomButtonActive = false;
    const btnEl = this.activeTool && this.getBtnEl(this.activeTool);
    if (btnEl) {
      btnEl.className += " ptro-color-active-control";
    }
    let ctrls = "";
    (b.controls || []).forEach((ctl: Control) => {
      ctl.id = genId();
      if (ctl.title) {
        ctrls += `<span class="ptro-tool-ctl-name" title="${tr(ctl.titleFull)}">${tr(ctl.title)}</span>`;
      }
      if (ctl.type === "btn") {
        ctrls +=
          `<button type="button" ${ctl.hint ? `title="${tr(ctl.hint)}"` : ""} class="ptro-color-control ${ctl.icon ? "ptro-icon-btn" : "ptro-named-btn"}" ` +
          `id=${ctl.id}>${ctl.icon ? `<i class="ptro-icon ptro-icon-${ctl.icon}"></i>` : ""}` +
          `<p>${ctl.name || ""}</p></button>`;
      } else if (ctl.type === "color") {
        const state = anyType(this.colorWidgetState)[ctl.target];
        const alphaColor = anyType<string>(state).alphaColor || "";
        ctrls +=
          `<button type="button" id=${ctl.id} data-id='${ctl.target}' ` +
          `style="background-color: ${alphaColor}" ` +
          'class="color-diwget-btn ptro-color-btn ptro-bordered-btn ptro-color-control"></button>' +
          '<span class="ptro-btn-color-checkers-bar"></span>';
      } else if (ctl.type === "int") {
        ctrls +=
          `<input id=${ctl.id} class="ptro-input" type="number" ${(ctl.min && `min="${ctl.min}"`) || ""} ${(ctl.max && `max="${ctl.max}"`) || ""} ` +
          `data-id='${ctl.target}'/>`;
      } else if (ctl.type === "bool") {
        ctrls += `<button id=${ctl.id} class="ptro-input ptro-check" data-value="false" type="button" ` + `data-id='${ctl.target}'></button>`;
      } else if (ctl.type === "dropdown") {
        let options = "";
        ctl.getAvailableValues?.().forEach((o) => {
          if (typeof o !== "string") {
            options +=
              `<option ${o.extraStyle ? `style='${o.extraStyle}'` : ""}` + ` value='${o.value}' ${o.title ? `title='${o.title}'` : ""}>${o.name}</option>`;
          }
        });
        ctrls += `<select id=${ctl.id} class="ptro-input" ` + `data-id='${ctl.target}'>${options}</select>`;
      }
    });
    this.toolControls.innerHTML = ctrls;
    (b.controls || []).forEach((ctl: Control) => {
      const el = this.getElemByIdSafe(ctl.id);
      if (ctl.type === "int") {
        el.value = String(ctl.getValue?.());
        el.oninput = ctl.action;
      } else if (ctl.type === "bool") {
        el.setAttribute("data-value", ctl.getValue?.() ? "true" : "false");
        el.onclick = ctl.action;
      } else if (ctl.type === "dropdown") {
        el.onchange = ctl.action;
        el.value = String(ctl.getValue?.());
      } else {
        el.onclick = ctl.action;
      }
    });
    b.activate();
  };
}

const factory = (params: Parameters) => new Main(params);
export default factory;
export { Painterro };
// export default params => new PainterroProc(params);
