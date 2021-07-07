import { ITranslation } from "./lang";

const translation: ITranslation = {
  name: "",
  strings: {
    lineColor: "L",
    lineColorFull: "Lijnkleur",
    fillColor: "V",
    fillColorFull: "Vulkleur",
    alpha: "A",
    alphaFull: "Alpha",
    lineWidth: "D",
    lineWidthFull: "Lijndikte",
    arrowLength: "L",
    arrowLengthFull: "Pijllengte",
    eraserWidth: "G",
    eraserWidthFull: "Gumdikte",
    textColor: "K",
    textColorFull: "Tekstkleur",
    fontSize: "G",
    fontSizeFull: "Tekstgrootte",
    fontStrokeSize: "St",
    fontStrokeSizeFull: "Streepdikte",
    fontIsBold: "<b>V</b>",
    fontIsBoldFull: "Vetgedrukt",
    fontIsItalic: "<i>C</i>",
    fontIsItalicFull: "Cursief",
    shadowOn: "S",
    shadowOnFull: "Schaduw",
    fontStrokeAndShadow: "D&S",
    fontStrokeAndShadowFull: "Streep & Schaduw",

    fontName: "F",
    fontNameFull: "Naam lettertype",
    textStrokeColor: "SK",
    textStrokeColorFull: "Streepkleur",
    apply: "Toepassen",
    cancel: "Annuleren",
    close: "Sluiten",
    clear: "Opnieuw",
    width: "Breedte",
    height: "Hoogte",
    keepRatio: "Behoud breedte-/hoogteverhouding",
    fillPageWith: "Vul pagina met de huidige achtergrondkleur",
    pixelSize: "P",
    pixelSizeFull: "Pixelgrootte",
    resizeScale: "Schalen",
    resizeResize: "Grootte aanpassen",
    backgroundColor: "Achtergrondkleur pagina",
    pixelizePixelSize: "Pixelgrootte pixel",
    language: "Taal",
    wrongPixelSizeValue:
      "Foute pixelgrootte. Je kunt b.v. '20%' invullen, wat een pixelgrootte van " +
      "1/5 van de geselecteerde gebiedszijde betekent, of '4' voor een pixelgrootte van 4 px",
  },
  tools: {
    crop: "Afbeelding bijsnijden naar geselecteerde gebied",
    pixelize: "Geselecteerde gebied pixelen",
    rect: "Teken rechthoek",
    ellipse: "Teken ovaal",
    line: "Teken lijn",
    arrow: "Teken pijl",
    rotate: "Afbeelding draaien",
    save: "Afbeelding opslaan",
    load: "Afbeelding laden",
    text: "Text schrijven",
    brush: "Penseel",
    resize: "Grootte aanpassen",
    open: "Afbeelding openen",
    select: "Gebied selecteren",
    close: "Painterro sluiten",
    eraser: "Gum",
    settings: "Instellingen",
    zoomin: "Inzoomen",
    zoomout: "Uitzoomen",
    undo: "Ongedaan maken",
    redo: "Opnieuw doen",
  },
  paste: {
    fit: "Vervang alles",
    extend_down: "Onder uitbreiden",
    extend_right: "Rechts uitbreiden",
    extend_left: "Links uitbreiden",
    extend_top: "Boven uitbreiden",
    extend: "Uitbreiden",
    over: "Overheen plakken",
    how_to_paste: "Hoe te plakken?",
  },
};

export default translation;