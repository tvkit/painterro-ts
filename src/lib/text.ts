import html2canvas from "html2canvas";
import { Tr } from "src/langs/lang";
import { anyType, DocumentHelper, Font, Hotkey, ITextTool, Main } from "./interfaces";
import { tr } from "./translation";

export default class TextTool implements ITextTool {
  private ctx: CanvasRenderingContext2D;
  private el: HTMLDivElement;
  private main: Main;
  private wrapper: HTMLDivElement;
  private input: HTMLInputElement & DocumentHelper;
  private inputWrapper: HTMLDivElement;
  private color: string = "";
  public isBold?: boolean;
  public isItalic?: boolean;
  public strokeOn?: boolean;
  private strokeColor?: string;
  public font: string = ""; // {value: "", extraStyle: "", name: "", title: ""};
  public fontSize: number = 10;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  private active: boolean = false;
  private crd: number[] = [];
  private pendingClear: boolean = false;
  private scaledCord: number[] = [];

  constructor(main: Main) {
    this.ctx = main.ctx;
    this.el = main.toolContainer;
    this.main = main;
    this.wrapper = main.wrapper;
    this.input = this.el.querySelector(".ptro-text-tool-input") as HTMLInputElement & DocumentHelper;
    this.inputWrapper = this.el.querySelector(".ptro-text-tool-input-wrapper") as HTMLDivElement;
    this.inputWrapper.style.display = "none";
    this.isBold = main.params.defaultFontBold;
    this.isItalic = main.params.defaultFontItalic;
    this.strokeOn = main.params.defaultTextStrokeAndShadow;

    this.strokeColor = main.params.textStrokeAlphaColor;
    this.setFontSize(main.params.defaultFontSize || 10);
    this.setFont(this.getFonts()[0]?.value || ""); // TODO
    this.setFontIsBold(this.isBold || false);
    this.setFontIsItalic(this.isItalic || false);
    (this.el.querySelector(".ptro-text-tool-apply") as HTMLButtonElement).onclick = () => {
      void this.apply();
    };
    (this.el.querySelector(".ptro-text-tool-cancel") as HTMLButtonElement).onclick = () => {
      this.close();
    };
  }

  getFont(): string {
    return this.font;
  }

  getFonts(): Font[] {
    const fonts = [
      "Arial, Helvetica, sans-serif",
      '"Arial Black", Gadget, sans-serif',
      '"Comic Sans MS", cursive, sans-serif',
      "Impact, Charcoal, sans-serif",
      '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
      "Tahoma, Geneva, sans-serif",
      '"Trebuchet MS", Helvetica, sans-serif',
      "Verdana, Geneva, sans-serif",
      '"Courier New", Courier, monospace',
      '"Lucida Console", Monaco, monospace',
      ...(this.main.params.extraFonts || []),
    ];

    const res: Font[] = [];
    fonts.forEach((f) => {
      const fontName = f.split(",")[0]?.replace(/"/g, "");
      if (fontName) {
        res.push({
          value: f,
          name: fontName,
          extraStyle: `font-family:${f}`,
          title: fontName,
        });
      }
    });
    return res;
  }

  setFont(font: string) {
    this.font = font;
    anyType(this.input.style)["font-family"] = font;
    if (this.active) {
      this.input.focus();
    }
    if (this.active) {
      this.reLimit();
    }
  }

  setStrokeOn(state: boolean) {
    this.strokeOn = state;
    this.setStrokeParams();
  }

  setFontIsBold(state: boolean) {
    this.isBold = state;
    if (state) {
      anyType(this.input.style)["font-weight"] = "bold";
    } else {
      anyType(this.input.style)["font-weight"] = "normal";
    }
    if (this.active) {
      this.input.focus();
      this.reLimit();
    }
    this.setStrokeParams();
  }

  setFontIsItalic(state: boolean) {
    this.isItalic = state;
    if (state) {
      anyType(this.input.style)["font-style"] = "italic";
    } else {
      anyType(this.input.style)["font-style"] = "normal";
    }
    if (this.active) {
      this.input.focus();
      this.reLimit();
    }
  }

  setFontSize(size: number) {
    this.fontSize = size;
    anyType(this.input.style)["font-size"] = `${size}px`;
    this.setStrokeParams();
    if (this.active) {
      this.reLimit();
    }
  }

  setStrokeParams() {
    if (this.strokeOn && this.strokeColor) {
      const st = 1;
      anyType(this.input.style)["text-shadow"] = `
      -${st}px -${st}px 1px ${this.strokeColor},${st}px -${st}px 1px ${this.strokeColor},
      -${st}px  ${st}px 1px ${this.strokeColor},${st}px  ${st}px 1px ${this.strokeColor},
      ${st}px ${st}px ${Math.log(this.fontSize) * (this.main.params.shadowScale || 1)}px black`;
    } else {
      anyType(this.input.style)["text-shadow"] = "none";
    }
  }

  setFontColor(color: string) {
    this.color = color;
    this.input.style.color = color;
    anyType(this.input.style)["outline-color"] = color;
  }

  inputLeft() {
    return this.input.documentOffsetLeft + this.main.scroller.scrollLeft;
  }

  inputTop() {
    return this.input.documentOffsetTop + this.main.scroller.scrollTop;
  }

  reLimit() {
    this.inputWrapper.style.right = "auto";
    if (this.inputLeft() + this.input.clientWidth > this.main.elLeft() + this.el.clientWidth) {
      this.inputWrapper.style.right = "0";
    } else {
      this.inputWrapper.style.right = "auto";
    }

    this.inputWrapper.style.bottom = "auto";
    if (this.inputTop() + this.input.clientHeight > this.main.elTop() + this.el.clientHeight) {
      this.inputWrapper.style.bottom = "0";
    } else {
      this.inputWrapper.style.bottom = "auto";
    }
  }

  handleMouseDown(event: MouseEvent) {
    const mainClass = (event.target as HTMLElement)?.classList[0];
    if (mainClass === "ptro-crp-el") {
      if (!this.active) {
        this.input.innerHTML = "<br>";
        this.pendingClear = true;
      }
      this.active = true;
      this.crd = [event.clientX - this.main.elLeft() + this.main.scroller.scrollLeft, event.clientY - this.main.elTop() + this.main.scroller.scrollTop];
      const scale = this.main.getScale();
      const crdX = this.crd[0] || 1;
      const crdY = this.crd[1] || 1;
      this.scaledCord = [crdX * scale, crdY * scale];
      this.inputWrapper.style.left = `${crdX}px`;
      this.inputWrapper.style.top = `${crdY}px`;
      this.inputWrapper.style.display = "inline";
      this.input.focus();
      this.reLimit();
      this.input.onkeydown = (e) => {
        if (e.ctrlKey && e.keyCode === Hotkey.enter) {
          void this.apply();
          e.preventDefault();
        }
        if (e.keyCode === Hotkey.esc) {
          this.close();
          this.main.closeActiveTool();
          e.preventDefault();
        }
        this.reLimit();
        if (this.pendingClear) {
          this.input.innerText = this.input.innerText.slice(1);
          this.pendingClear = false;
        }
        e.stopPropagation();
      };
      if (!this.main.isMobile) {
        event.preventDefault();
      }
    }
  }

  hiddenInputClone() {
    const clone = this.input.cloneNode(true) as HTMLDivElement;
    const style = clone.style;
    style.position = "fixed";
    style.top = `${window.innerHeight}px`;
    style.left = "0";
    document.body.appendChild(clone);
    return clone;
  }

  async apply(): Promise<void> {
    const origBorder = this.input.style.border;
    const scale = this.main.getScale();
    this.input.style.border = "none";
    const can = await html2canvas(this.hiddenInputClone(), {
      backgroundColor: null,
      logging: false,
      scale,
      scrollX: 0,
      scrollY: 0,
    }); //.then((can: HTMLImageElement) => {

    this.ctx.drawImage(can, this.scaledCord[0] || 0, this.scaledCord[1] || 0);
    this.input.style.border = origBorder;
    this.close();
    this.main.worklog.captureState();
    this.main.closeActiveTool();
  }

  close() {
    this.active = false;
    this.inputWrapper.style.display = "none";
  }

  static code() {
    return (
      '<span class="ptro-text-tool-input-wrapper">' +
      '<div contenteditable="true" class="ptro-text-tool-input"></div>' +
      '<span class="ptro-text-tool-buttons">' +
      `<button type="button" class="ptro-text-tool-apply ptro-icon-btn ptro-color-control" title="${tr(Tr.S.apply)}" 
                   style="margin: 2px">` +
      '<i class="ptro-icon ptro-icon-apply"></i>' +
      "</button>" +
      `<button type="button" class="ptro-text-tool-cancel ptro-icon-btn ptro-color-control" title="${tr(Tr.S.cancel)}"
                   style="margin: 2px">` +
      '<i class="ptro-icon ptro-icon-close"></i>' +
      "</button>" +
      "</span>" +
      "</span>"
    );
  }
}
