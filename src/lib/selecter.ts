import { anyFunc, AnyFunc, Area, DocumentHelper, Hotkey, IMain, IPainterroSelecter, SelectionCallback } from "./interfaces";
import { clearSelection } from "./utils";

export default class PainterroSelecter implements IPainterroSelecter {
  private main: IMain;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wrapper: HTMLDivElement & DocumentHelper;
  public shown: boolean;
  private areaionCallback: SelectionCallback;
  public area: Area;
  public imagePlaced: boolean;
  public pixelizePixelSize: string = "";
  private pixelSize: number = 1;
  private pixelSizeX: number = 1;
  private pixelSizeY: number = 1;
  private placedData: string = "";
  private placedDataLow: string = "";
  private placedRatio: number = 1;
  private left: number = 0;
  private top: number = 0;
  private right: number = 0;
  private bottom: number = 0;

  constructor(main: IMain, selectionCallback: SelectionCallback) {
    this.main = main;
    this.canvas = main.canvas;
    this.wrapper = main.wrapper;
    this.ctx = main.ctx;
    this.areaionCallback = selectionCallback;
    this.shown = false;
    this.area = {
      el: main.toolContainer,
      rect: document.querySelector(`#${main.id} .ptro-crp-rect`)!,
      topl: [],
      bottoml: [],
      moving: false,
      resizingB: false,
      resizingL: false,
      resizingR: false,
      resizingT: false,
      xHandle: 0,
      yHandle: 0,
      activated: false,
      get tx(): number {
        return this.topl[0] || 0;
      },
      get ty(): number {
        return this.topl[1] || 0;
      },
      get bx(): number {
        return this.bottoml[0] || 0;
      },
      get by(): number {
        return this.bottoml[1] || 0;
      },
      get width(): number {
        return this.bx - this.tx;
      },
      get height(): number {
        return this.by - this.ty;
      },
    };
    this.imagePlaced = false;
    this.areaionCallback(false);
  }

  static code = () => {
    return (
      '<div class="ptro-crp-rect" hidden>' +
      '<div class="ptro-crp-l select-handler"></div><div class="ptro-crp-r select-handler"></div>' +
      '<div class="ptro-crp-t select-handler"></div><div class="ptro-crp-b select-handler"></div>' +
      '<div class="ptro-crp-tl select-handler"></div><div class="ptro-crp-tr select-handler"></div>' +
      '<div class="ptro-crp-bl select-handler"></div><div class="ptro-crp-br select-handler"></div>' +
      "</div>"
    );
  };

  activate = () => {
    this.area.activated = true;
    this.areaionCallback(false);
  };

  doCrop = () => {
    const imgData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
    this.main.resize(this.area.bx - this.area.tx, this.area.by - this.area.ty);
    this.main.ctx.putImageData(imgData, -this.area.tx, -this.area.ty);
    this.main.adjustSizeFull();
    this.main.worklog.captureState();
  };

  doPixelize = () => {
    const tx = this.area.tx;
    const ty = this.area.ty;
    const width = this.area.width;
    const height = this.area.height;
    this.pixelizePixelSize = this.main.params.pixelizePixelSize || "";

    if (this.pixelizePixelSize.slice(-1) === "%") {
      this.pixelSize = Math.min(width, height) / (100.0 / (parseInt(this.pixelizePixelSize.slice(0, -1)) || 100));
    } else if (this.pixelizePixelSize.slice(-2).toLowerCase() === "px") {
      this.pixelSize = parseInt(this.pixelizePixelSize.slice(0, -2)) || 1;
    } else {
      this.pixelSize = parseInt(this.pixelizePixelSize) || 1;
    }

    if (this.pixelSize < 2) {
      this.pixelSize = 2; // prevent errors
    }

    if (height < width) {
      this.pixelSizeY = this.pixelSize;
      const desiredHorPxs = Math.round(width / this.pixelSizeY);
      this.pixelSizeX = (width * 1.0) / desiredHorPxs;
    } else {
      this.pixelSizeX = this.pixelSize;
      const desiredVerPxs = Math.round(height / this.pixelSizeX);
      this.pixelSizeY = (height * 1.0) / desiredVerPxs;
    }
    const pxData = [];
    //const pxSize = [width / this.pixelSizeX, height / this.pixelSizeY];
    const psX = width / (this.pixelSizeX || 1); // TODO default
    const psY = height / (this.pixelSizeY || 1);
    for (let i = 0; i < psX; i += 1) {
      const row = [];
      for (let j = 0; j < psY; j += 1) {
        row.push([0, 0, 0, 0, 0]);
      }
      pxData.push(row);
    }
    const data = this.ctx.getImageData(tx, ty, width, height);
    for (let i = 0; i < width; i += 1) {
      for (let j = 0; j < height; j += 1) {
        const ii = Math.floor(i / this.pixelSizeX);
        const jj = Math.floor(j / this.pixelSizeY);
        const base = (j * width + i) * 4;
        const pix = pxData[ii]![jj]!;
        pix[0] += data.data[base]!;
        pix[1] += data.data[base + 1]!;
        pix[2] += data.data[base + 2]!;
        pix[3] += data.data[base + 3]!;
        pix[4] += 1;
      }
    }
    for (let i = 0; i < psX; i += 1) {
      for (let j = 0; j < psY; j += 1) {
        const pix = pxData[i]![j]!;
        const s = pix[4]!;
        const r = Math.round(pix[0]! / s);
        const g = Math.round(pix[1]! / s);
        const b = Math.round(pix[2]! / s);
        const a = Math.round(pix[3]! / s);
        this.ctx.fillStyle = `rgba(${r},  ${g}, ${b}, ${a})`;
        const baseX = tx + i * this.pixelSizeX;
        const baseY = ty + j * this.pixelSizeY;
        this.ctx.fillRect(baseX, baseY, this.pixelSizeX, this.pixelSizeY);
      }
    }
    this.main.worklog.captureState();
  };

  doClearArea = () => {
    this.ctx.beginPath();
    this.ctx.clearRect(this.area.tx, this.area.ty, this.area.bx - this.area.tx, this.area.by - this.area.ty);
    this.ctx.rect(this.area.tx, this.area.ty, this.area.bx - this.area.tx, this.area.by - this.area.ty);
    this.ctx.fillStyle = this.main.currentBackground;
    this.ctx.fill();
    this.main.worklog.captureState();
  };

  selectAll = () => {
    this.setLeft(0);
    this.setRight(0);
    this.setBottom(0);
    this.setTop(0);
    this.show();
    this.reCalcCropperCords();
    if (this.area.activated) {
      this.areaionCallback(!this.imagePlaced && !!this.area.rect && this.area.rect.clientWidth > 0 && this.area.rect.clientHeight > 0);
    }
  };

  getScale = () => {
    return this.canvas.clientWidth / (parseInt(this.canvas.getAttribute("width") || "") || this.canvas.clientWidth);
  };

  reCalcCropperCords = () => {
    const ratio = this.getScale();
    this.area.topl = [Math.round((this.rectLeft() - this.main.elLeft()) / ratio), Math.round((this.rectTop() - this.main.elTop()) / ratio)];

    this.area.bottoml = [
      Math.round(this.area.tx + (this.area.rect.clientWidth + 2) / ratio),
      Math.round(this.area.ty + (this.area.rect.clientHeight + 2) / ratio),
    ];
  };

  adjustPosition = () => {
    if (!this.shown) {
      return;
    }
    const ratio = this.getScale();
    this.setLeft(this.area.tx * ratio);
    this.setTop(this.area.ty * ratio);
    this.setRight(0);
    this.setRight(this.canvas.clientWidth - this.area.bx * ratio);
    this.setBottom(this.canvas.clientHeight - this.area.by * ratio);
  };

  placeAt = (l: number, t: number, r: number, b: number, img: HTMLImageElement) => {
    this.main.closeActiveTool(true);
    this.main.setActiveTool(this.main.tools.select);
    const scale = this.getScale();
    this.setLeft(l * scale);
    this.setTop(t * scale);
    this.setRight(r * scale);
    this.setBottom(b * scale);
    const tmpCan = document.createElement("canvas");
    tmpCan.width = img.naturalWidth;
    tmpCan.height = img.naturalHeight;
    const tmpCtx = tmpCan.getContext("2d")!;
    tmpCtx.drawImage(img, 0, 0);
    this.placedData = tmpCan.toDataURL("image/png");
    const lowScale = 1000 / Math.max(img.naturalWidth, img.naturalHeight);
    if (lowScale >= 1) {
      this.placedDataLow = this.placedData;
    } else {
      tmpCan.width = img.naturalWidth * lowScale;
      tmpCan.height = img.naturalHeight * lowScale;
      tmpCtx.scale(lowScale, lowScale);
      tmpCtx.drawImage(img, 0, 0);
      this.placedDataLow = tmpCan.toDataURL("image/png");
    }
    this.main.select.area.rect.style.backgroundImage = `url(${this.placedData})`;
    this.show();
    this.reCalcCropperCords();
    this.imagePlaced = true;
    this.placedRatio = img.naturalWidth / img.naturalHeight;
  };

  finishPlacing = () => {
    this.imagePlaced = false;
    this.main.select.area.rect.style.backgroundImage = "none";
    this.main.inserter.insert(this.area.tx, this.area.ty, this.area.bx - this.area.tx, this.area.by - this.area.ty);
  };

  cancelPlacing = () => {
    this.imagePlaced = false;
    this.main.select.area.rect.style.backgroundImage = "none";
    this.hide();
    this.main.worklog.undoState();
  };

  handleKeyDown = (evt: KeyboardEvent) => {
    if (this.main.inserter.handleKeyDown?.(evt)) {
      return true;
    }
    if (this.shown && this.imagePlaced) {
      if (evt.keyCode === Hotkey.enter) {
        this.finishPlacing();
        return true;
      } else if (evt.keyCode === Hotkey.esc) {
        this.cancelPlacing();
        return true;
      }
    } else if (this.shown && evt.keyCode === Hotkey.del) {
      this.doClearArea();
      return true;
    } else if (evt.keyCode === Hotkey.a && evt.ctrlKey) {
      this.selectAll();
      evt.preventDefault();
      return true;
    } else if (evt.keyCode === Hotkey.esc && this.shown) {
      this.hide();
      return true;
    }
    return false;
  };

  handleMouseDown = (evt: MouseEvent) => {
    const mainClass = (evt.target as HTMLElement)?.classList[0];
    const mousDownCallbacks: AnyFunc = {
      "ptro-crp-el": () => {
        if (this.area.activated) {
          if (this.imagePlaced) {
            this.finishPlacing();
          }
          const x = evt.clientX - this.main.elLeft() + this.main.scroller.scrollLeft;
          const y = evt.clientY - this.main.elTop() + this.main.scroller.scrollTop;

          this.setLeft(x);
          this.setTop(y);
          this.setRight(this.area.el.clientWidth - x);
          this.setBottom(this.area.el.clientHeight - y);

          this.reCalcCropperCords();
          this.area.resizingB = true;
          this.area.resizingR = true;
          this.hide();
        }
      },
      "ptro-crp-rect": () => {
        this.area.moving = true;
        this.area.xHandle = evt.clientX - this.rectLeft() + this.main.scroller.scrollLeft;
        this.area.yHandle = evt.clientY - this.rectTop() + this.main.scroller.scrollTop;
      },
      "ptro-crp-tr": () => {
        this.area.resizingT = true;
        this.area.resizingR = true;
      },
      "ptro-crp-br": () => {
        this.area.resizingB = true;
        this.area.resizingR = true;
      },
      "ptro-crp-bl": () => {
        this.area.resizingB = true;
        this.area.resizingL = true;
      },
      "ptro-crp-tl": () => {
        this.area.resizingT = true;
        this.area.resizingL = true;
      },
      "ptro-crp-t": () => {
        this.area.resizingT = true;
      },
      "ptro-crp-r": () => {
        this.area.resizingR = true;
      },
      "ptro-crp-b": () => {
        this.area.resizingB = true;
      },
      "ptro-crp-l": () => {
        this.area.resizingL = true;
      },
    };
    if (mainClass && mainClass in mousDownCallbacks) {
      anyFunc(mousDownCallbacks)[mainClass]?.();
      if (this.imagePlaced) {
        this.main.select.area.rect.style.backgroundImage = `url(${this.placedDataLow})`;
      }
    }
  };

  setLeft = (v: number) => {
    this.left = v;
    this.area.rect.style.left = `${v}px`;
  };

  setRight = (v: number) => {
    this.right = v;
    this.area.rect.style.right = `${v}px`;
  };

  setTop = (v: number) => {
    this.top = v;
    this.area.rect.style.top = `${v}px`;
  };

  setBottom = (v: number) => {
    this.bottom = v;
    this.area.rect.style.bottom = `${v}px`;
  };

  handleMouseMove = (evt: MouseEvent) => {
    if (!this.area.activated) {
      return;
    }
    if (this.area.moving) {
      let newLeft = evt.clientX - this.main.elLeft() - this.area.xHandle + this.main.scroller.scrollLeft;
      if (newLeft < 0) {
        newLeft = 0;
      } else if (newLeft + this.area.rect.clientWidth > this.area.el.clientWidth - 2) {
        newLeft = this.area.el.clientWidth - this.area.rect.clientWidth - 2;
      }
      const hDelta = newLeft - this.left;
      this.setLeft(newLeft);
      this.setRight(this.right - hDelta);

      let newTop = evt.clientY - this.main.elTop() - this.area.yHandle + this.main.scroller.scrollTop;
      if (newTop < 0) {
        newTop = 0;
      } else if (newTop + this.area.rect.clientHeight > this.area.el.clientHeight - 2) {
        newTop = this.area.el.clientHeight - this.area.rect.clientHeight - 2;
      }
      const vDelta = newTop - this.top;
      this.setTop(newTop);
      this.setBottom(this.bottom - vDelta);
      this.reCalcCropperCords();
    } else {
      let resizing = false;
      if (this.area.resizingL) {
        resizing = true;
        const absLeft = this.fixCropperLeft(evt.clientX + this.main.scroller.scrollLeft);
        this.setLeft(absLeft - this.main.elLeft());
        this.reCalcCropperCords();
      }
      if (this.area.resizingR) {
        resizing = true;
        const absRight = this.fixCropperRight(evt.clientX + this.main.scroller.scrollLeft);
        this.setRight(this.area.el.clientWidth + this.main.elLeft() - absRight);
        this.reCalcCropperCords();
      }
      if (this.area.resizingT) {
        resizing = true;
        const absTop = this.fixCropperTop(evt.clientY + this.main.scroller.scrollTop);
        this.setTop(absTop - this.main.elTop());
        this.reCalcCropperCords();
      }
      if (this.area.resizingB) {
        resizing = true;
        const absBottom = this.fixCropperBottom(evt.clientY + this.main.scroller.scrollTop);
        this.setBottom(this.area.el.clientHeight + this.main.elTop() - absBottom);
        this.reCalcCropperCords();
      }
      if (this.imagePlaced && !(evt.ctrlKey || evt.shiftKey)) {
        if (this.area.resizingT) {
          if (this.area.resizingL) {
            this.leftKeepRatio();
          } else {
            this.rightKeepRatio();
          }
          this.topKeepRatio();
          this.reCalcCropperCords();
        }
        if (this.area.resizingB) {
          if (this.area.resizingL) {
            this.leftKeepRatio();
          } else {
            this.rightKeepRatio();
          }
          this.bottomKeepRatio();
          this.reCalcCropperCords();
        }
        if (this.area.resizingL) {
          if (this.area.resizingT) {
            this.topKeepRatio();
          } else {
            this.bottomKeepRatio();
          }
          this.leftKeepRatio();
          this.reCalcCropperCords();
        }
        if (this.area.resizingR) {
          if (this.area.resizingT) {
            this.topKeepRatio();
          } else {
            this.bottomKeepRatio();
          }
          this.rightKeepRatio();
          this.reCalcCropperCords();
        }
      }
      if (resizing && !this.shown) {
        this.show();
      }
      if (resizing) {
        clearSelection();
      }
    }
  };

  leftKeepRatio = () => {
    const newW = this.area.rect.clientHeight * this.placedRatio;
    const suggLeft = this.main.elLeft() + (this.area.el.clientWidth - this.right - newW - 2);
    const absLeft = this.fixCropperLeft(suggLeft);
    this.setLeft(absLeft - this.main.elLeft());
  };

  topKeepRatio = () => {
    const newH = this.area.rect.clientWidth / this.placedRatio;
    const absTop = this.fixCropperTop(this.main.elTop() + (this.area.el.clientHeight - this.bottom - newH - 2));
    this.setTop(absTop - this.main.elTop());
  };

  bottomKeepRatio = () => {
    const newH = this.area.rect.clientWidth / this.placedRatio;
    const absBottom = this.fixCropperBottom(this.main.elTop() + this.top + newH + 2);
    this.setBottom(this.area.el.clientHeight + this.main.elTop() - absBottom);
  };

  rightKeepRatio = () => {
    const newW = this.area.rect.clientHeight * this.placedRatio;
    const absRight = this.fixCropperRight(this.main.elLeft() + this.left + newW + 2);
    this.setRight(this.area.el.clientWidth + this.main.elLeft() - absRight);
  };

  show = () => {
    this.shown = true;
    this.area.rect.removeAttribute("hidden");
  };

  handleMouseUp = () => {
    if (this.area.activated) {
      this.areaionCallback(!this.imagePlaced && this.area.rect.clientWidth > 0 && this.area.rect.clientHeight > 0);
    }
    this.area.moving = false;
    this.area.resizingT = false;
    this.area.resizingR = false;
    this.area.resizingB = false;
    this.area.resizingL = false;
    if (this.imagePlaced) {
      this.main.select.area.rect.style.backgroundImage = `url(${this.placedData})`;
    }
  };

  close = () => {
    if (this.imagePlaced) {
      this.finishPlacing();
    }
    this.area.activated = false;
    this.hide();
  };

  hide = () => {
    this.area.rect.setAttribute("hidden", "true");
    this.shown = false;
    this.areaionCallback(false);
  };

  draw = () => {
    if (this.area.topl) {
      const ratio = this.canvas.clientWidth / parseInt(this.canvas.getAttribute("width") || "") || this.canvas.clientWidth || 100;
      this.setLeft(this.area.tx * ratio);
      this.setTop(this.area.ty * ratio);
      this.setRight(this.area.el.clientWidth - (this.area.bx - this.area.tx) * ratio);
      this.setBottom(this.area.el.clientHeight - (this.area.by - this.area.ty) * ratio);
    }
  };

  rectLeft = () => {
    return this.area.rect.documentOffsetLeft + this.main.scroller.scrollLeft;
  };

  rectTop = () => {
    return this.area.rect.documentOffsetTop + this.main.scroller.scrollTop;
  };

  /* fixers */
  fixCropperLeft = (left: number) => {
    let newLeft = left;
    const absLeftMiddle = this.rectLeft() + this.area.rect.clientWidth;
    if (newLeft < this.main.elLeft()) {
      return this.main.elLeft();
    } else if (newLeft > absLeftMiddle) {
      newLeft = absLeftMiddle;
      if (this.area.resizingL) {
        this.area.resizingL = false;
        this.area.resizingR = true;
      }
    }
    return newLeft;
  };

  fixCropperRight = (right: number) => {
    let newRight = right;
    const absRightLimit = this.main.elLeft() + this.area.el.clientWidth;
    if (newRight > absRightLimit) {
      return absRightLimit;
    } else if (newRight < this.rectLeft()) {
      newRight = this.rectLeft() + this.area.rect.clientWidth;
      if (this.area.resizingR) {
        this.area.resizingR = false;
        this.area.resizingL = true;
      }
    }
    return newRight;
  };

  fixCropperTop = (top: number) => {
    let newTop = top;
    const absTopMiddle = this.rectTop() + this.area.rect.clientHeight;
    if (newTop < this.main.elTop()) {
      return this.main.elTop();
    } else if (newTop > absTopMiddle) {
      newTop = absTopMiddle;
      if (this.area.resizingT) {
        this.area.resizingT = false;
        this.area.resizingB = true;
      }
    }
    return newTop;
  };

  fixCropperBottom = (bottom: number) => {
    let newBottom = bottom;
    const absBottomLimit = this.main.elTop() + this.area.el.clientHeight;
    if (newBottom > absBottomLimit) {
      return absBottomLimit;
    } else if (newBottom < this.rectTop()) {
      newBottom = this.rectTop() + this.area.rect.clientHeight;
      if (this.area.resizingB) {
        this.area.resizingB = false;
        this.area.resizingT = true;
      }
    }
    return newBottom;
  };
}
