import { anyFunc, anyType, Point } from "./interfaces";

export function genId(): string {
  let text = "ptro";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 20; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function addDocumentObjectHelpers(): void {
  if (!("documentOffsetTop" in Element.prototype)) {
    Object.defineProperty(Element.prototype, "documentOffsetTop", {
      get() {
        return (this as Element).getBoundingClientRect().top;
      },
    });
  }
  if (!("documentOffsetLeft" in Element.prototype)) {
    Object.defineProperty(Element.prototype, "documentOffsetLeft", {
      get() {
        return (this as Element).getBoundingClientRect().left;
      },
    });
  }

  if (!("documentClientWidth" in Element.prototype)) {
    Object.defineProperty(Element.prototype, "documentClientWidth", {
      get() {
        const rect = (this as Element).getBoundingClientRect();
        if (rect.width) {
          // `width` is available for IE9+
          return rect.width;
        }
        // Calculate width for IE8 and below
        return rect.right - rect.left;
      },
    });
  }

  if (!("documentClientHeight" in Element.prototype)) {
    Object.defineProperty(Element.prototype, "documentClientHeight", {
      get() {
        const rect = (this as Element).getBoundingClientRect();
        if (rect.height) {
          return rect.height;
        }
        return rect.bottom - rect.top;
      },
    });
  }
}

export function clearSelection(): void {
  let selection: unknown;
  if (window.getSelection) {
    selection = window.getSelection();
  } else if (anyType(document).selection) {
    selection = anyType(document).selection;
  }
  if (selection) {
    anyFunc(selection).empty?.();
    anyFunc(selection).removeAllRanges?.();
  }
}

export function distance(p1: Point, p2: Point): number {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;
  return Math.sqrt(a * a + b * b);
}

export function trim(s: string): string {
  return String(s).replace(/^\s+|\s+$/g, "");
}

// Copies a string to the clipboard. Must be called from within an
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+,
// Firefox 42+, Safari 10+, Edge and IE 10+.
// IE: The clipboard feature may be disabled by an administrator. By
// default a prompt is shown the first time the clipboard is
// used (per session).
export function copyToClipboard(text: string): void {
  const clipboardData = anyType(window).clipboarData as DataTransfer;
  if (clipboardData) {
    // IE specific code path to prevent textarea being shown while dialog is visible.
    clipboardData.setData("Text", text);
  } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    const textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy"); // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn("Copy to clipboard failed.", ex);
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function getScrollbarWidth(): number {
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";
  anyType(outer.style).msOverflowStyle = "scrollbar"; // needed for WinJS apps
  document.body.appendChild(outer);
  const widthNoScroll = outer.offsetWidth;
  outer.style.overflow = "scroll";
  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);
  const widthWithScroll = inner.offsetWidth;
  outer.parentNode?.removeChild(outer);
  return widthNoScroll - widthWithScroll;
}

export function imgToDataURL(url: string, callback: (dataUrl: string | ArrayBuffer | null) => void, failedCb: () => void): void {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.onerror = () => {
    if (typeof failedCb === "function") {
      failedCb();
    }
  };
  xhr.open("GET", url);
  xhr.responseType = "blob";
  xhr.send();
}

export function logError(error: string): void {
  console.warn(`[Painterro] ${error}`);
}

export function checkIn(what: unknown, where: unknown[]): boolean {
  return where.indexOf(what) !== -1;
}
