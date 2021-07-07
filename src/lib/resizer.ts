import { Hotkey, IResizer, Main } from "#interfaces";
import { tr } from "./translation";

export default class Resizer implements IResizer {
  public main: Main;
  private wrapper: HTMLDivElement;
  private inputW: HTMLInputElement;
  private inputH: HTMLInputElement;
  private inputWLimit: number;
  private inputHLimit: number;
  private linkButton: HTMLButtonElement;
  private linkButtonIcon: HTMLElement;
  private closeButton: HTMLButtonElement;
  private scaleButton: HTMLButtonElement;
  private resizeButton: HTMLButtonElement;
  private linked: boolean;
  private opened: boolean = false;
  private newH: number = 200; // TODO default
  private newW: number = 200;

  constructor(main: Main) {
    this.main = main;

    this.wrapper = main.wrapper.querySelector(".ptro-resize-widget-wrapper") as HTMLDivElement;
    this.inputW = main.wrapper.querySelector(".ptro-resize-widget-wrapper .ptro-resize-width-input") as HTMLInputElement;
    this.inputH = main.wrapper.querySelector(".ptro-resize-widget-wrapper .ptro-resize-heigth-input") as HTMLInputElement;

    this.inputWLimit = 10000;
    this.inputHLimit = 13000;

    this.linkButton = main.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-link") as HTMLButtonElement;
    this.linkButtonIcon = main.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-link i") as HTMLElement;
    this.closeButton = main.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-close") as HTMLButtonElement;
    this.scaleButton = main.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-scale") as HTMLButtonElement;
    this.resizeButton = main.wrapper.querySelector(".ptro-resize-widget-wrapper button.ptro-resize") as HTMLButtonElement;
    this.linked = true;
    this.closeButton.onclick = () => {
      this.startClose();
    };

    this.scaleButton.onclick = () => {
      if (!Resizer.validationZeroValue(this.newH, this.newW)) return;
      const origW = this.main.size.w;
      const origH = this.main.size.h;

      const tmpData = this.main.canvas.toDataURL();

      this.main.resize(this.newW, this.newH);

      this.main.ctx.save();
      // this.ctx.translate(h / 2, w / 2);
      this.main.ctx.scale(this.newW / origW, this.newH / origH);
      const img = new Image();
      img.onload = () => {
        this.main.ctx.drawImage(img, 0, 0);
        this.main.adjustSizeFull();
        this.main.ctx.restore();
        this.main.worklog.captureState();
        this.startClose();
      };
      img.src = tmpData;
    };

    this.resizeButton.onclick = () => {
      if (!Resizer.validationZeroValue(this.newH, this.newW)) return;
      const tmpData = this.main.canvas.toDataURL();
      this.main.resize(this.newW, this.newH);
      this.main.clearBackground();
      const img = new Image();
      img.onload = () => {
        this.main.ctx.drawImage(img, 0, 0);
        this.main.adjustSizeFull();
        this.main.worklog.captureState();
        this.startClose();
      };
      img.src = tmpData;
    };

    this.linkButton.onclick = () => {
      this.linked = !this.linked;
      if (this.linked) {
        this.linkButtonIcon.className = "ptro-icon ptro-icon-linked";
      } else {
        this.linkButtonIcon.className = "ptro-icon ptro-icon-unlinked";
      }
    };

    this.inputW.oninput = () => {
      const widthVal = Number(this.inputW.value);
      this.validationWidth(widthVal);
      if (this.linked) {
        const ratio = this.main.size.ratio;
        this.newH = Math.round(this.newW / ratio);
        this.validationHeight(this.newH);
        this.inputH.value = this.newH.toString();
      }
    };
    this.inputH.oninput = () => {
      const heightVal = Number(this.inputH.value);
      this.validationHeight(heightVal);
      if (this.linked) {
        const ratio = this.main.size.ratio;
        this.newW = Math.round(this.newH * ratio);
        this.validationWidth(this.newW);
        this.inputW.value = this.newW.toString();
      }
    };
  }

  validationWidthValue(value: number) {
    return value <= this.inputWLimit;
  }

  validationHeightValue(value: number) {
    return value <= this.inputHLimit;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validationEmptyValue(value: any) {
    return value !== "" || value !== "0"; // TODO always true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validationZeroValue(...args: any[]) {
    let isValid = true;
    args.forEach((v) => {
      isValid = !(v === 0) && isValid;
    });
    return isValid;
  }

  validationHeight(value: number) {
    if (this.validationHeightValue(value)) {
      this.newH = value;
    } else {
      this.inputH.value = String(this.inputHLimit);
      this.newH = this.inputHLimit;
      return;
    }

    if (Resizer.validationEmptyValue(value)) {
      this.newH = value;
    } else {
      this.inputH.value = "0";
      this.newH = 0;
    }
  }

  validationWidth(value: number) {
    if (this.validationWidthValue(value)) {
      this.newW = value;
    } else {
      this.inputW.value = String(this.inputWLimit);
      this.newW = this.inputWLimit;
      return;
    }

    if (Resizer.validationEmptyValue(value)) {
      this.newW = value;
    } else {
      this.inputW.value = "0";
      this.newW = 0;
    }
  }

  open() {
    this.wrapper.removeAttribute("hidden");
    this.opened = true;
    this.newW = this.main.size.w;
    this.newH = this.main.size.h;
    this.inputW.value = String(this.newW);
    this.inputH.value = String(this.newH);
  }

  close() {
    this.wrapper.setAttribute("hidden", "true");
    this.opened = false;
  }

  startClose() {
    this.main.closeActiveTool();
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.keyCode === Hotkey.enter) {
      return true; // mark as handled - user might expect doing save by enter
    }
    if (event.keyCode === Hotkey.esc) {
      this.startClose();
      return true;
    }
    return false;
  }

  static html() {
    return (
      "" +
      '<div class="ptro-resize-widget-wrapper ptro-common-widget-wrapper ptro-v-middle" hidden>' +
      '<div class="ptro-resize-widget ptro-color-main ptro-v-middle-in">' +
      '<div style="display: inline-block">' +
      "<table>" +
      "<tr>" +
      `<td class="ptro-label ptro-resize-table-left">${tr("width")}</td>` +
      "<td>" +
      '<input class="ptro-input ptro-resize-width-input" type="number" min="0" max="3000" step="1"/>' +
      "</td>" +
      "</tr>" +
      "<tr>" +
      `<td class="ptro-label ptro-resize-table-left">${tr("height")}</td>` +
      "<td>" +
      '<input class="ptro-input ptro-resize-heigth-input" type="number" min="0" max="3000" step="1"/>' +
      "</td>" +
      "</tr>" +
      "</table>" +
      "</div>" +
      '<div class="ptro-resize-link-wrapper">' +
      `<button type="button" class="ptro-icon-btn ptro-link ptro-color-control" title="${tr("keepRatio")}">` +
      '<i class="ptro-icon ptro-icon-linked" style="font-size: 18px;"></i>' +
      "</button>" +
      "</div>" +
      "<div></div>" +
      '<div style="margin-top: 40px;">' +
      '<button type="button" class="ptro-named-btn ptro-resize ptro-color-control">' +
      `${tr("resizeResize")}</button>` +
      '<button type="button" class="ptro-named-btn ptro-scale ptro-color-control">' +
      `${tr("resizeScale")}</button>` +
      '<button type="button" class="ptro-named-btn ptro-close ptro-color-control">' +
      `${tr("cancel")}</button>` +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }
}
