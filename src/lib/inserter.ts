import { Tr } from "src/langs/lang";
import { Hotkey, IInserter, IWorklog, Main } from "./interfaces";
import { tr } from "./translation";
import { genId, imgToDataURL } from "./utils";

type PasteHandler = (img: HTMLImageElement) => void;

interface PasteOption {
  id?: string;
  internalName: string;
  handle: PasteHandler;
}

interface PasteOptions {
  [index: string]: PasteOption;
}

export default class Inserter implements IInserter {
  private main: Main;
  private ctx: CanvasRenderingContext2D;
  private tmpImg?: HTMLImageElement;
  private worklog: IWorklog;
  public waitChoice: boolean = false;
  private pasteOptions: PasteOptions;
  private activeOption: PasteOptions;
  private selector: HTMLDivElement | null = null;
  private img: HTMLImageElement | null = null;
  private mimetype: string | null = null;
  private loading: boolean = false;
  private doLater: PasteHandler | null = null;

  constructor(main: Main) {
    this.main = main;
    this.ctx = main.ctx;
    this.worklog = main.worklog;
    const extendObj = {
      extend_top: {
        internalName: "extend_top",
        handle: (img: HTMLImageElement) => {
          this.tmpImg = img;
          const oldH = this.main.size.h;
          const oldW = this.main.size.w;
          const newH = oldH + img.naturalHeight;
          const newW = Math.max(oldW, img.naturalWidth);
          const tmpData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
          this.main.resize(newW, newH);
          this.main.clearBackground();
          this.ctx.putImageData(tmpData, 0, img.naturalHeight);
          this.main.adjustSizeFull();
          if (img.naturalWidth < oldW) {
            const offset = Math.round((oldW - img.naturalWidth) / 2);
            this.main.select.placeAt(offset, 0, offset, oldH, img);
          } else {
            this.main.select.placeAt(0, 0, 0, oldH, img);
          }
          this.worklog.captureState();
        },
      },
      extend_left: {
        internalName: "extend_left",
        handle: (img: HTMLImageElement) => {
          this.tmpImg = img;
          const oldH = this.main.size.h;
          const oldW = this.main.size.w;
          const newW = oldW + img.naturalWidth;
          const newH = Math.max(oldH, img.naturalHeight);
          const tmpData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
          this.main.resize(newW, newH);
          this.main.clearBackground();
          this.ctx.putImageData(tmpData, img.naturalWidth, 0);
          this.main.adjustSizeFull();
          if (img.naturalHeight < oldH) {
            const offset = Math.round((oldH - img.naturalHeight) / 2);
            this.main.select.placeAt(0, offset, oldW, offset, img);
          } else {
            this.main.select.placeAt(0, 0, oldW, 0, img);
          }
          this.worklog.captureState();
        },
      },
      extend_right: {
        internalName: "extend_right",
        handle: (img: HTMLImageElement) => {
          this.tmpImg = img;
          const oldH = this.main.size.h;
          const oldW = this.main.size.w;
          const newW = oldW + img.naturalWidth;
          const newH = Math.max(oldH, img.naturalHeight);
          const tmpData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
          this.main.resize(newW, newH);
          this.main.clearBackground();
          this.ctx.putImageData(tmpData, 0, 0);
          this.main.adjustSizeFull();
          if (img.naturalHeight < oldH) {
            const offset = Math.round((oldH - img.naturalHeight) / 2);
            this.main.select.placeAt(oldW, offset, 0, offset, img);
          } else {
            this.main.select.placeAt(oldW, 0, 0, 0, img);
          }
          this.worklog.captureState();
        },
      },
      extend_down: {
        internalName: Tr.P.extend_down,
        handle: (img: HTMLImageElement) => {
          this.tmpImg = img;
          const oldH = this.main.size.h;
          const oldW = this.main.size.w;
          const newH = oldH + img.naturalHeight;
          const newW = Math.max(oldW, img.naturalWidth);
          const tmpData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
          this.main.resize(newW, newH);
          this.main.clearBackground();
          this.ctx.putImageData(tmpData, 0, 0);
          this.main.adjustSizeFull();
          if (img.naturalWidth < oldW) {
            const offset = Math.round((oldW - img.naturalWidth) / 2);
            this.main.select.placeAt(offset, oldH, offset, 0, img);
          } else {
            this.main.select.placeAt(0, oldH, 0, 0, img);
          }
          this.worklog.captureState();
        },
      },
    };
    const fitObj = {
      replace_all: {
        internalName: "fit",
        handle: (img: HTMLImageElement) => {
          if (this.main.params.backplateImgUrl) {
            this.main.params.backplateImgUrl = undefined;
            this.main.tabelCell.style.background = "";
            this.main.canvas.style.backgroundColor = `${this.main.params.backgroundFillColor || "#ffffff"}ff`; // TODO default
            this.pasteOptions = Object.assign({}, fitObj, extendObj);
            this.activeOption = this.pasteOptions;
            this.main.wrapper.querySelector(".ptro-paster-select-wrapper")!.remove();
            this.main.wrapper.insertAdjacentHTML("beforeend", this.html());
            this.init(main);
          }
          this.main.fitImage(img, this.mimetype || "");
        },
      },
      paste_over: {
        internalName: "over",
        handle: (img: HTMLImageElement) => {
          this.tmpImg = img;
          const oldH = this.main.size.h;
          const oldW = this.main.size.w;
          if (img.naturalHeight <= oldH && img.naturalWidth <= oldW) {
            this.main.select.placeAt(0, 0, oldW - img.naturalWidth, oldH - img.naturalHeight, img);
          } else if (img.naturalWidth / img.naturalHeight > oldW / oldH) {
            const newH = oldW * (img.naturalHeight / img.naturalWidth);
            this.main.select.placeAt(0, 0, 0, oldH - newH, img);
          } else {
            const newW = oldH * (img.naturalWidth / img.naturalHeight);
            this.main.select.placeAt(0, 0, oldW - newW, 0, img);
          }
          this.worklog.captureState();
        },
      },
    };
    if (this.main.params.backplateImgUrl) {
      this.pasteOptions = Object.assign({}, fitObj);
      this.activeOption = this.pasteOptions;
      return;
    }
    this.pasteOptions = Object.assign({}, fitObj, extendObj);
    this.activeOption = this.pasteOptions;
  }

  init(main: Main) {
    // this.CLIP_DATA_MARKER = "painterro-image-data";
    this.ctx = main.ctx;
    this.main = main;
    this.worklog = main.worklog;
    this.selector = main.wrapper.querySelector(".ptro-paster-select-wrapper");
    this.cancelChoosing();
    this.img = null;
    this.mimetype = null; // mime of pending image
    this.getAvailableOptions().forEach((k) => {
      const o = this.pasteOptions[k];
      if (o) {
        this.main.getElemByIdSafe(o.id).onclick = () => {
          if (this.loading) {
            this.doLater = o.handle;
          } else if (this.img) {
            o.handle(this.img);
          }
          this.cancelChoosing();
        };
      }
    });
    this.loading = false;
    this.doLater = null;
  }

  insert(x: number, y: number, w: number, h: number): void {
    if (this.tmpImg) {
      this.main.ctx.drawImage(this.tmpImg, x, y, w, h);
      this.main.worklog.reCaptureState();
    }
  }

  cancelChoosing() {
    this.selector?.setAttribute("hidden", "");
    this.waitChoice = false;
  }

  loaded(img: HTMLImageElement, mimetype?: string) {
    this.img = img;
    this.mimetype = mimetype || "";
    this.loading = false;
    if (this.doLater) {
      this.doLater(img);
      this.doLater = null;
    }
  }

  getAvailableOptions(): string[] {
    const activeOption = this.activeOption;
    if (!activeOption) {
      return [];
    }
    const howToPasteActions = this.main.params.howToPasteActions;
    if (Array.isArray(howToPasteActions)) {
      // filter out only to selected
      return Object.keys(activeOption).filter((actionName) => howToPasteActions.includes(actionName));
    }
    return Object.keys(this.activeOption);
  }

  handleOpen(src: string, mimetype?: string) {
    this.startLoading();
    const handleIt = (source: string | ArrayBuffer | null) => {
      if (typeof source !== "string") {
        return;
      }
      const img = new Image();
      const empty = this.main.worklog.clean;
      const replaceAllImmediately = empty && this.main.params.replaceAllOnEmptyBackground;
      img.onload = () => {
        if (replaceAllImmediately) {
          this.main.fitImage(img, mimetype);
        } else {
          this.loaded(img, mimetype);
        }
        this.finishLoading();
      };
      img.onerror = () => {
        if (typeof this.main.params.onImageFailedOpen === "function") {
          this.main.params.onImageFailedOpen();
        }
      };
      // img.crossOrigin = '*'; TODO try to identify CORS issues earlier?
      img.src = source;
      if (!replaceAllImmediately) {
        const availableOptions = this.getAvailableOptions();
        if (availableOptions.length !== 1) {
          this.selector?.removeAttribute("hidden");
          this.waitChoice = true;
        } else if (this.activeOption && availableOptions.length > 0) {
          const key = availableOptions[0] || "";
          this.doLater = this.activeOption[key]?.handle || null;
        }
      }
    };

    if (src.indexOf("data") !== 0) {
      imgToDataURL(
        src,
        (dataUrl: string | ArrayBuffer | null) => {
          // if CORS will not allow,
          // better see error in console than have different canvas mode
          handleIt(dataUrl);
        },
        () => {
          if (typeof this.main.params.onImageFailedOpen === "function") {
            this.main.params.onImageFailedOpen();
          }
        }
      );
    } else {
      handleIt(src);
    }
  }

  handleKeyDown(evt: KeyboardEvent): boolean {
    if (this.waitChoice && evt.keyCode === Hotkey.esc) {
      this.cancelChoosing();
      return true;
    }
    if (this.waitChoice && evt.keyCode === Hotkey.enter) {
      return true; // mark as handled - user might expect doing save by enter
    }
    return false;
  }

  startLoading() {
    this.loading = true;
    const buttonId = this.main.tools.open.buttonId;
    if (buttonId) {
      const btn = this.main.getElemByIdSafe(buttonId);
      if (btn) {
        btn.setAttribute("disabled", "true");
      }
      const icon = this.main.doc.querySelector(`#${buttonId} > i`);
      if (icon) {
        icon.className = "ptro-icon ptro-icon-loading ptro-spinning";
      }
    }
  }

  finishLoading() {
    const buttonId = this.main.tools.open.buttonId;
    if (buttonId) {
      const btn = this.main.getElemByIdSafe(buttonId);
      if (btn) {
        btn.removeAttribute("disabled");
      }
      const icon = this.main.doc.querySelector(`#${buttonId} > i`) as HTMLButtonElement;
      if (icon) {
        icon.className = "ptro-icon ptro-icon-open";
      }
    }
    if (this.main.params.onImageLoaded) {
      this.main.params.onImageLoaded();
    }
  }

  static get(main: Main) {
    if (main.inserter) {
      return main.inserter;
    }
    main.inserter = new Inserter(main);
    return main.inserter;
  }

  static controlObjToString(o: PasteOption, btnClassName = "") {
    const tempObj = o;
    tempObj.id = genId(); // TODO tempObj intentions?
    return (
      `<button type="button" id="${o.id}" class="ptro-selector-btn ptro-color-control ${btnClassName}">` +
      `<div><i class="ptro-icon ptro-icon-paste_${o.internalName}"></i></div>` +
      `<div>${tr(`pasteOptions.${o.internalName}`)}</div>` +
      "</button>"
    );
  }

  html() {
    const bcklOptions = this.main.params.backplateImgUrl;
    let fitControls = "";
    let extendControls = "";
    this.getAvailableOptions().forEach((k) => {
      const pasteOption = this.pasteOptions[k];
      if (!pasteOption) {
        // do nothing
      } else if (k === "replace_all" || k === "paste_over") {
        fitControls += `<div class="ptro-paster-fit">
          ${Inserter.controlObjToString(pasteOption, "ptro-selector-fit")}
        <div class="ptro-paster-wrapper-label">
          ${tr(`pasteOptions.${pasteOption.internalName}`)}
        </div></div>`;
      } else {
        extendControls += Inserter.controlObjToString(pasteOption, "ptro-selector-extend");
      }
    });
    return (
      '<div class="ptro-paster-select-wrapper" hidden><div class="ptro-paster-select ptro-v-middle">' +
      '<div class="ptro-in ptro-v-middle-in">' +
      ` <div class="ptro-paster-wrappers-fits">
        ${fitControls}
        ${
          bcklOptions || !extendControls
            ? ""
            : `
          <div class="ptro-paster-select-wrapper-extends">
            <div class="ptro-paster-extends-items">
              ${extendControls}
            </div>
            <div class="ptro-paster-wrapper-label">${tr("pasteOptions.extend")}</div>
          </div>`
        }
        </div>
      </div></div></div>`
    );
  }
}
