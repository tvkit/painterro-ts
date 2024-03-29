import { ChangedCallback, IMain, IWorklog } from "./interfaces";

interface WorkState {
  prev: WorkState | null;
  prevCount: number;
  next: WorkState | null;
  sizew?: number;
  sizeh?: number;
  data?: ImageData;
}

export default class WorkLog implements IWorklog {
  private main: IMain;
  private first: WorkState | null = null;
  public current: WorkState | null = null;
  public empty: boolean;
  public clean: boolean;
  private ctx: CanvasRenderingContext2D;
  private changedHandler: ChangedCallback;
  public clearedCount: number = 0;

  constructor(main: IMain, changedHandler: ChangedCallback) {
    this.main = main;
    this.current = null;
    this.changedHandler = changedHandler;
    this.empty = true;
    this.clean = true;
    this.ctx = main.ctx;
  }

  // getWorklogAsString = (params: any) => {
  //   const saveState = Object.assign({}, this.current);
  //   let curCleared = this.clearedCount;

  //   if (params.limit !== undefined) {
  //     const limit = params.limit;
  //     curCleared = 0;
  //     let active = saveState;
  //     let i;
  //     for (i = 0; i < limit; i += 1) {
  //       active.prevCount = limit - i;
  //       if (i < limit - 1 && active.prev) {
  //         active = active.prev;
  //       }
  //     }
  //     active.prev = null;
  //   }
  //   return JSON.stringify({
  //     clearedCount: curCleared,
  //     current: saveState,
  //   });
  // }

  // loadWorklogFromString = (str: string) => {
  //   const obj = JSON.parse(str);
  //   if (obj) {
  //     this.clearedCount = obj.clearedCount;
  //     this.current = obj.current;
  //     this.applyState(this.current);
  //   }
  //   return this.main;
  // }

  changed = (initial: boolean) => {
    if (this.first && this.current && this.current.prevCount - this.clearedCount > (this.main.params.worklogLimit || 25)) {
      this.first = this.first.next;
      this.first!.prev = null;
      this.clearedCount += 1;
    }
    this.changedHandler({
      first: this.current?.prev === null,
      last: this.current?.next === null,
      initial,
    });
    this.empty = initial;
    this.clean = false;
  };

  captureState = (initial?: boolean) => {
    const state: WorkState = {
      prev: null,
      prevCount: 0,
      next: null,
      sizew: this.main.size.w,
      sizeh: this.main.size.h,
      data: this.ctx.getImageData(0, 0, this.main.size.w, this.main.size.h),
    };
    if (this.current === null) {
      state.prev = null;
      state.prevCount = 0;
      this.first = state;
      this.clearedCount = 0;
    } else {
      state.prev = this.current;
      state.prevCount = this.current.prevCount + 1;
      this.current.next = state;
    }
    state.next = null;
    this.current = state;
    this.changed(!!initial);
  };

  reCaptureState = () => {
    if (this.current?.prev !== null) {
      this.current = this.current!.prev;
    }
    this.captureState(false);
  };

  applyState = (state: WorkState | null) => {
    if (state) {
      this.main.resize(state.sizew!, state.sizeh!);
      this.main.ctx.putImageData(state.data!, 0, 0);
      this.main.adjustSizeFull();
      this.main.select.hide();
    }
  };

  undoState = () => {
    if (this.current?.prev !== null) {
      this.current = this.current?.prev || null;
      this.applyState(this.current);
      this.changed(false);
      if (this.main.params.onUndo) {
        this.main.params.onUndo(this.current);
      }
    }
  };

  redoState = () => {
    if (this.current?.next !== null) {
      this.current = this.current!.next;
      this.applyState(this.current);
      this.changed(false);
      if (this.main.params.onRedo) {
        this.main.params.onRedo(this.current);
      }
    }
  };
}
