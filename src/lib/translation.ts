import {
  IPasteOptionsTranslation,
  IStringsTranslation,
  IToolsTranslation,
  ITranslation,
} from "src/langs/lang";
import ca from "../langs/ca.lang";
import de from "../langs/de.lang";
import en from "../langs/en.lang";
import es from "../langs/es.lang";
import fr from "../langs/fr.lang";
import ja from "../langs/ja.lang";
import nl from "../langs/nl.lang";
import pl from "../langs/pl.lang";
import ptBRl from "../langs/pt-BR.lang";
import ptPTl from "../langs/pt-PT.lang";
import ru from "../langs/ru.lang";

let instance: Translation | null = null;

interface Dictionary {
  [index: string]: string;
}

const dict = (t: IStringsTranslation | IToolsTranslation | IPasteOptionsTranslation) =>
  t as unknown as Dictionary;

export default class Translation {
  private translations: { [index: string]: ITranslation };
  private defaultTranslator: ITranslation;
  private translator: ITranslation;
  private name: string;
  constructor() {
    this.translations = {
      de,
      en,
      es,
      ca,
      fr,
      pl,
      "pt-PT": ptPTl,
      "pt-BR": ptBRl,
      ru,
      ja,
      nl,
    };
    this.translator = this.defaultTranslator = en;
    this.name = this.translator.name;
  }

  static get(): Translation {
    if (instance) {
      return instance;
    }
    instance = new Translation();
    return instance;
  }

  addTranslation(name: string, trans: ITranslation): void {
    this.translations[name] = trans;
  }

  activate(name: string): ITranslation {
    const translator = this.translations[name];
    if (translator) {
      this.name = name;
      this.translator = translator;
    } else {
      this.translator = this.defaultTranslator;
    }
    return this.translator;
  }

  tr(n: string): string {
    const levels = n.split(".");
    if (levels.length === 1) {
      levels.unshift("s");
    }
    const trans = this.translator;
    const def = this.defaultTranslator;
    const section = levels[0];
    const term = levels[1] || "";
    switch (section) {
      case "s":
        return dict(trans.strings)[term] || dict(def.strings)[term] || "?";
      case "t":
        return dict(trans.tools)[term] || dict(def.tools)[term] || "?";
      case "p":
        return dict(trans.paste)[term] || dict(def.paste)[term] || "?";
      default:
        return "?";
    }
  }
}

export function activate(name: string): ITranslation {
  return Translation.get().activate(name);
}
export function tr(n: string): string {
  return Translation.get().tr(n);
}
