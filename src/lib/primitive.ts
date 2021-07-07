import { IMain, IPrimitiveTool, Point } from "./interfaces";

interface State {
  cornerMarked?: boolean;
}

export default class PrimitiveTool implements IPrimitiveTool {
  private helperCanvas: HTMLCanvasElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private el: HTMLDivElement;
  private main: IMain;
  private type: string = "";
  public lineWidth: number = 2; // TODO default
  public shadowOn: boolean = true; // TODO default
  public arrowLength: number = 20; // TODO default
  public eraserWidth: number = 5; // TODO default
  private tmpData?: ImageData;
  private state: State = {};
  private points: Point[] = [];
  private centerCord: number[] = [];
  private curCord: number[] = [];
  private pixelSize: number = 1;

  constructor(main: IMain) {
    this.ctx = main.ctx;
    this.el = main.toolContainer;
    this.main = main;
    this.helperCanvas = document.createElement("canvas");
    this.canvas = main.canvas;
  }

  activate = (type: string) => {
    this.type = type;
    this.state = {};
    if (type === "line" || type === "brush" || type === "eraser" || type === "arrow") {
      this.ctx.lineJoin = "round";
    } else {
      this.ctx.lineJoin = "miter";
    }
  };

  setLineWidth = (width: number) => {
    const w = Math.round(width);
    //if (`${width}`.match(/^\d+$/)) {
    if (w > 0) {
      this.lineWidth = w;
    } else {
      throw Error(`WARN: STR "${width}" is not an int`);
    }
  };

  setShadowOn = (state: boolean): void => {
    this.shadowOn = state;
  };

  setArrowLength = (length: number) => {
    this.arrowLength = length;
  };

  setEraserWidth = (width: number) => {
    this.eraserWidth = width;
  };

  handleMouseDown = (event: MouseEvent) => {
    this.activate(this.type);
    const mainClass = (event.target as HTMLElement).classList[0];

    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.main.colorWidgetState.line.alphaColor || ""; // TODO default
    this.ctx.fillStyle = this.main.colorWidgetState.fill.alphaColor || ""; // TODO default
    const scale = this.main.getScale();
    this.ctx.lineCap = "round";
    if (mainClass === "ptro-crp-el" || mainClass === "ptro-zoomer") {
      this.tmpData = this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h);
      if (this.type === "brush" || this.type === "eraser") {
        this.state.cornerMarked = true;
        const cord = [event.clientX - this.main.elLeft() + this.main.scroller.scrollLeft, event.clientY - this.main.elTop() + this.main.scroller.scrollTop];
        const cur = {
          x: cord[0]! * scale,
          y: cord[1]! * scale,
        };

        this.points = [cur];
        this.drawBrushPath();
      } else {
        this.state.cornerMarked = true;
        this.centerCord = [
          event.clientX - this.main.elLeft() + this.main.scroller.scrollLeft,
          event.clientY - this.main.elTop() + this.main.scroller.scrollTop,
        ];
        this.centerCord = [(this.centerCord[0] || 0) * scale, (this.centerCord[1] || 0) * scale];
      }
    }
  };

  drawBrushPath = () => {
    const points = this.points;
    const point0 = this.points[0];
    if (!point0) {
      return;
    }
    let lineFill;
    const origComposition = this.ctx.globalCompositeOperation;
    const isEraser = this.type === "eraser";
    lineFill = this.main.colorWidgetState.line.alphaColor || ""; // TODO default
    const bgIsTransparent = this.main.currentBackgroundAlpha !== 1.0;
    for (let i = 1; i <= (isEraser && bgIsTransparent ? 2 : 1); i += 1) {
      if (isEraser) {
        this.ctx.globalCompositeOperation = i === 1 && bgIsTransparent ? "destination-out" : origComposition;
        lineFill = i === 1 && bgIsTransparent ? "rgba(0,0,0,1)" : this.main.currentBackground;
      }
      if (points.length === 1) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 0;
        this.ctx.fillStyle = lineFill;
        this.ctx.arc(point0.x, point0.y, this.lineWidth / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();
      } else {
        this.ctx.beginPath();
        if (this.type === "eraser") {
          this.ctx.lineWidth = this.eraserWidth;
        } else {
          this.ctx.lineWidth = this.lineWidth;
        }
        this.ctx.strokeStyle = lineFill;
        this.ctx.fillStyle = this.main.colorWidgetState.fill.alphaColor || ""; // TODO default

        this.ctx.moveTo(point0.x, point0.y);
        points.slice(1).forEach((p) => {
          this.ctx.lineTo(p.x, p.y);
        });
        const last = points.slice(-1)[0];
        if (last) {
          this.ctx.moveTo(last.x, last.y);
        }
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
    this.ctx.globalCompositeOperation = origComposition;
  };

  handleMouseMove = (event: MouseEvent) => {
    const ctx = this.ctx;
    if (this.state.cornerMarked && this.tmpData) {
      this.ctx.putImageData(this.tmpData, 0, 0);

      const scale = this.main.getScale();
      let curX = (event.clientX - this.main.elLeft() + this.main.scroller.scrollLeft) * scale;
      let curY = (event.clientY - this.main.elTop() + this.main.scroller.scrollTop) * scale;

      const centX = this.centerCord[0] || 0;
      const centY = this.centerCord[1] || 0;

      if (this.type === "brush" || this.type === "eraser") {
        // const prevLast = this.points.slice(-1)[0];
        const cur = {
          x: curX,
          y: curY,
        };
        this.points.push(cur);
        this.drawBrushPath();
      } else if (this.type === "line") {
        if (event.ctrlKey || event.shiftKey) {
          const deg = (curX === centX ? Math.PI / 2 : Math.atan(-(curY - centY) / (curX - centX)) * 180) / Math.PI;
          if (Math.abs(deg) < 45.0 / 2) {
            curY = centY;
          } else if (Math.abs(deg) > 45.0 + 45.0 / 2) {
            curX = centX;
          } else {
            const base = (Math.abs(curX - centX) - Math.abs(centY - curY)) / 2;

            curX -= base * (centX < curX ? 1 : -1);
            curY -= base * (centY > curY ? 1 : -1);
          }
        }
        ctx.beginPath();
        ctx.moveTo(centX, centY);
        ctx.lineTo(curX, curY);
        ctx.closePath();
        const origShadowColor = ctx.shadowColor;
        if (this.shadowOn) {
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = this.lineWidth;
          ctx.shadowOffsetX = this.lineWidth / 2.0;
          ctx.shadowOffsetY = this.lineWidth / 2.0;
        }
        ctx.stroke();
        ctx.shadowColor = origShadowColor;
      } else if (this.type === "arrow") {
        let deg = (curX === centX ? Math.PI / 2 : Math.atan(-(curY - centY) / (curX - centX)) * 180) / Math.PI;
        if (event.ctrlKey || event.shiftKey) {
          if (Math.abs(deg) < 45.0 / 2) {
            curY = centY;
          } else if (Math.abs(deg) > 45.0 + 45.0 / 2) {
            curX = centX;
          } else {
            const base = (Math.abs(curX - centX) - Math.abs(centY - curY)) / 2;

            curX -= base * (centX < curX ? 1 : -1);
            curY -= base * (centY > curY ? 1 : -1);
          }
        }
        if (curX < centX) {
          deg = 180 + deg;
        }
        this.ctx.beginPath();
        const origCap = this.ctx.lineCap;
        const origFill = this.ctx.fillStyle;
        this.ctx.fillStyle = this.main.colorWidgetState.line.alphaColor || ""; // TODO default
        this.ctx.lineCap = "square";

        const r = Math.min(this.arrowLength, 0.9 * Math.sqrt((centX - curX) ** 2 + (centY - curY) ** 2));

        const fromx = centX;
        const fromy = centY;
        const tox = curX;
        const toy = curY;
        const xCenter = curX;
        const yCenter = curY;
        let angle;
        let x;
        let y;
        angle = Math.atan2(toy - fromy, tox - fromx);

        x = r * Math.cos(angle) + xCenter;
        y = r * Math.sin(angle) + yCenter;

        this.ctx.moveTo(x, y);

        angle += (1.0 / 3) * (2 * Math.PI);
        x = r * Math.cos(angle) + xCenter;
        y = r * Math.sin(angle) + yCenter;
        this.ctx.lineTo(x, y);

        const xTail1 = xCenter + (x - xCenter) / 3.0;
        const yTail1 = yCenter + (y - yCenter) / 3.0;
        ctx.lineTo(xTail1, yTail1);

        ctx.lineTo(centX, centY);

        angle += (1.0 / 3) * (2 * Math.PI);
        x = r * Math.cos(angle) + xCenter;
        y = r * Math.sin(angle) + yCenter;
        const xTail2 = xCenter + (x - xCenter) / 3.0;
        const yTail2 = yCenter + (y - yCenter) / 3.0;
        ctx.lineTo(xTail2, yTail2);

        ctx.lineTo(x, y);
        ctx.closePath();
        const origShadowColor = ctx.shadowColor;
        if (this.shadowOn) {
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = Math.log(r) * (this.main.params.shadowScale || 1);
          ctx.shadowOffsetX = Math.log10(r);
          ctx.shadowOffsetY = Math.log10(r);
        }
        ctx.fill();
        ctx.lineCap = origCap;
        ctx.fillStyle = origFill;
        ctx.shadowColor = origShadowColor;
      } else if (this.type === "rect") {
        ctx.beginPath();

        //const tl = [centX, centY];
        let tlX = centX;
        let tlY = centY;

        let w = curX - centX;
        let h = curY - centY;
        if (event.ctrlKey || event.shiftKey) {
          const min = Math.min(Math.abs(w), Math.abs(h));
          w = min * Math.sign(w);
          h = min * Math.sign(h);
        }
        const halfLW = this.lineWidth / 2.0;
        // normalize fix half compensation
        if (w < 0) {
          tlX += w;
          w = -w;
        }
        if (h < 0) {
          tlY += h;
          h = -h;
        }
        this.ctx.rect(tlX + halfLW, tlY + halfLW, w - this.lineWidth, h - this.lineWidth);
        this.ctx.fill();

        const origShadowColor = ctx.shadowColor;
        if (this.shadowOn) {
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = this.lineWidth;
          ctx.shadowOffsetX = this.lineWidth / 2.0;
          ctx.shadowOffsetY = this.lineWidth / 2.0;
        }
        if (this.lineWidth) {
          // TODO: no shadow on unstroked, do we need it?
          this.ctx.strokeRect(tlX, tlY, w, h);
        }
        ctx.shadowColor = origShadowColor;

        this.ctx.closePath();
      } else if (this.type === "ellipse") {
        this.ctx.beginPath();
        const x1 = centX;
        const y1 = centY;
        let w = curX - x1;
        let h = curY - y1;

        if (event.ctrlKey || event.shiftKey) {
          const min = Math.min(Math.abs(w), Math.abs(h));
          w = min * Math.sign(w);
          h = min * Math.sign(h);
        }

        const rX = Math.abs(w);
        const rY = Math.abs(h);

        const tlX = Math.min(x1, x1 + w);
        const tlY = Math.min(y1, y1 + h);

        this.ctx.save();
        let xScale = 1;
        let yScale = 1;
        let radius;
        const hR = rX / 2;
        const vR = rY / 2;
        if (rX > rY) {
          yScale = rX / rY;
          radius = hR;
        } else {
          xScale = rY / rX;
          radius = vR;
        }
        this.ctx.scale(1 / xScale, 1 / yScale);
        this.ctx.arc((tlX + hR) * xScale, (tlY + vR) * yScale, radius, 0, 2 * Math.PI);
        this.ctx.restore();
        this.ctx.fill();
        const origShadowColor = ctx.shadowColor;
        if (this.shadowOn) {
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = this.lineWidth;
          ctx.shadowOffsetX = this.lineWidth / 2.0;
          ctx.shadowOffsetY = this.lineWidth / 2.0;
        }
        ctx.stroke();
        ctx.shadowColor = origShadowColor;
        this.ctx.beginPath();
      }

      this.curCord = [curX, curY];
    }
  };

  handleMouseUp = () => {
    if (this.state.cornerMarked) {
      this.state.cornerMarked = false;
      this.main.worklog.captureState();
    }
  };

  setPixelSize = (size: number) => {
    this.pixelSize = size;
  };
}
