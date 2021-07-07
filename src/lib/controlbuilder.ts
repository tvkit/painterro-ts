import { Control, ControlValue, ControlValues, Main } from "./interfaces";
import { setParam } from "./params";

export default class ControlBuilder {
  private main: Main;
  constructor(main: Main) {
    this.main = main;
  }

  buildFontSizeControl(controlIndex: number) {
    const action = () => {
      const el = this.main.getElemByIdSafe(this.main.activeTool?.controls[controlIndex]?.id);
      const fontSize = parseInt(el.value) || 10; // TODO default
      this.main.textTool.setFontSize(fontSize);
      setParam("defaultFontSize", fontSize);
    };
    const getValue = () => this.main.textTool.fontSize;

    if (this.main.params.availableFontSizes) {
      return ControlBuilder.buildDropDownControl("fontSize", action, getValue, this.main.params.availableFontSizes);
    }
    return ControlBuilder.buildInputControl("fontSize", action, getValue, 1, 200);
  }

  buildEraserWidthControl(controlIndex: number) {
    const action = () => {
      const width = this.main.getElemByIdSafe(this.main.activeTool?.controls[controlIndex]?.id).value;
      this.main.primitiveTool.setEraserWidth(parseInt(width) || 5); // TODO default
      setParam("defaultEraserWidth", width);
    };
    const getValue = () => this.main.primitiveTool.eraserWidth;

    if (this.main.params.availableEraserWidths) {
      return ControlBuilder.buildDropDownControl("eraserWidth", action, getValue, this.main.params.availableEraserWidths);
    }
    return ControlBuilder.buildInputControl("eraserWidth", action, getValue, 1, 99);
  }

  buildLineWidthControl(controlIndex: number): Control {
    const action = () => {
      const width = this.main.getElemByIdSafe(this.main.activeTool?.controls[controlIndex]?.id).value;
      this.main.primitiveTool.setLineWidth(parseInt(width) || 2);
      setParam("defaultLineWidth", width);
    };
    const getValue = () => this.main.primitiveTool.lineWidth;

    if (this.main.params.availableLineWidths) {
      return ControlBuilder.buildDropDownControl("lineWidth", action, getValue, this.main.params.availableLineWidths);
    }
    return ControlBuilder.buildInputControl("lineWidth", action, getValue, 0, 99);
  }

  buildShadowOnControl(controlIndex: number) {
    return {
      type: "bool",
      title: "shadowOn",
      titleFull: "shadowOnFull",
      target: "shadowOn",
      action: () => {
        const btn = this.main.getElemByIdSafe(this.main.activeTool?.controls[controlIndex]?.id);
        const state = !(btn.getAttribute("data-value") === "true");
        this.main.primitiveTool.setShadowOn(state);
        btn.setAttribute("data-value", state ? "true" : "false");
        setParam("defaultPrimitiveShadowOn", state);
      },
      getValue: () => this.main.primitiveTool.shadowOn,
    };
  }

  buildArrowLengthControl(controlIndex: number) {
    const action = () => {
      const width = this.main.getElemByIdSafe(this.main.activeTool?.controls[controlIndex]?.id).value;
      this.main.primitiveTool.setArrowLength(parseInt(width) || 10); // TODO default
      setParam("defaultArrowLength", width);
    };
    const getValue = () => this.main.primitiveTool.arrowLength;

    if (this.main.params.availableArrowLengths) {
      return ControlBuilder.buildDropDownControl("arrowLength", action, getValue, this.main.params.availableArrowLengths);
    }
    return ControlBuilder.buildInputControl("arrowLength", action, getValue, 1, 99);
  }

  static buildInputControl(name: string, action: () => void, getValue: () => ControlValue, minVal: number, maxVal: number): Control {
    return {
      type: "int",
      title: name,
      titleFull: `${name}Full`,
      target: name,
      min: minVal,
      max: maxVal,
      action,
      getValue,
    };
  }

  static buildDropDownControl(name: string, action: () => void, getValue: () => ControlValue, availableValues: ControlValues): Control {
    return {
      type: "dropdown",
      title: name,
      titleFull: `${name}Full`,
      target: name,
      action,
      getValue,
      getAvailableValues: () => availableValues,
    };
  }
}
