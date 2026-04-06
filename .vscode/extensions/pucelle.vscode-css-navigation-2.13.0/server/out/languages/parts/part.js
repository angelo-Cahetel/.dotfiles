"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Part = exports.PartType = void 0;
/** Part types. */
var PartType;
(function (PartType) {
    //// Common
    /**
     * `<link href=...>`
     * `<script src=...>`
     * `@import ...`
     * Import 'file.css'
     * Import name from 'file.css'
     * Contains only path.
     */
    PartType[PartType["CSSImportPath"] = 0] = "CSSImportPath";
    //// From HTML / JS / TS.
    /** Excludes tags starts with A~Z like React or Lupos Component. */
    PartType[PartType["Tag"] = 1] = "Tag";
    /** Like React or Lupos Component. */
    PartType[PartType["ComponentTag"] = 2] = "ComponentTag";
    /** It doesn't include identifier `#`. */
    PartType[PartType["Id"] = 3] = "Id";
    /** It doesn't include identifier `.`. */
    PartType[PartType["Class"] = 4] = "Class";
    /** To do completion like `class="|"`. */
    PartType[PartType["ClassPotential"] = 5] = "ClassPotential";
    /**
     * `querySelector('div')`
     * `$('div')`
     */
    PartType[PartType["CSSSelectorQueryTag"] = 6] = "CSSSelectorQueryTag";
    /**
     * `querySelector('#id')`
     * `$('#id')`
     */
    PartType[PartType["CSSSelectorQueryId"] = 7] = "CSSSelectorQueryId";
    /**
     * `querySelector('.class-name')`
     * `$('.class-name')`
     */
    PartType[PartType["CSSSelectorQueryClass"] = 8] = "CSSSelectorQueryClass";
    /** `style.setProperty('--variable-name', ...)` */
    PartType[PartType["CSSVariableAssignment"] = 9] = "CSSVariableAssignment";
    /** Like `@keyframes`. */
    PartType[PartType["CSSCommand"] = 10] = "CSSCommand";
    /**
     * `import style from 'xxx.css'`
     * `class={style.className}`
     * `class={style['class-name']}`
    */
    PartType[PartType["ReactImportedCSSModuleName"] = 11] = "ReactImportedCSSModuleName";
    PartType[PartType["ReactImportedCSSModuleProperty"] = 12] = "ReactImportedCSSModuleProperty";
    /**
     * `import 'xxx.css'`
     * `styleName="class-name"`
    */
    PartType[PartType["ReactDefaultImportedCSSModuleClass"] = 13] = "ReactDefaultImportedCSSModuleClass";
    //// From CSS.
    /** Wrapper all other selector parts. */
    PartType[PartType["CSSSelectorWrapper"] = 14] = "CSSSelectorWrapper";
    /** div{...} */
    PartType[PartType["CSSSelectorTag"] = 15] = "CSSSelectorTag";
    /** It includes identifier `#`. */
    PartType[PartType["CSSSelectorId"] = 16] = "CSSSelectorId";
    /** It includes identifier `.`. */
    PartType[PartType["CSSSelectorClass"] = 17] = "CSSSelectorClass";
    /** `--variable-name: ...;` */
    PartType[PartType["CSSVariableDefinition"] = 18] = "CSSVariableDefinition";
    /** `-`, `--`, or `--property`, no value specified yet. */
    PartType[PartType["CSSVariableDefinitionNotComplete"] = 19] = "CSSVariableDefinitionNotComplete";
    /** `property: var(--variable-name);` */
    PartType[PartType["CSSVariableReference"] = 20] = "CSSVariableReference";
    /** `property: --variable-name`, only for completion. */
    PartType[PartType["CSSVariableReferenceNoVar"] = 21] = "CSSVariableReferenceNoVar";
})(PartType || (exports.PartType = PartType = {}));
/**
 * Part is normally a tag, class, id attribute, or tag/class/id selector, or a css variable.
 * Trees will be destroyed, and parts will be cached, so ensure part cost few memories.
 */
class Part {
    /** Part type. */
    type;
    /**
     * Text label, it may or may not include identifiers like `.`, `#` from raw text.
     * For `<div class="|name|">`, it doesn't include identifier
     * For `|.class|{}`, it includes identifier.
     */
    rawText;
    /** Text label after escaped. */
    escapedText;
    /** Start offset. */
    start;
    /** End of Definition. */
    defEnd;
    constructor(type, text, start, declarationEnd = -1) {
        this.type = type;
        this.rawText = text;
        this.start = start;
        this.defEnd = declarationEnd;
        this.escapedText = this.escapeText(text);
    }
    /** Overwrite to escape text. */
    escapeText(text) {
        return text;
    }
    /** End offset. */
    get end() {
        return this.start + this.rawText.length;
    }
    /** HTML class and id attribute. */
    isHTMLType() {
        return this.type < PartType.CSSSelectorWrapper
            && this.type >= PartType.Tag;
    }
    /** CSS selector and variables. */
    isCSSType() {
        return this.type >= PartType.CSSSelectorWrapper;
    }
    isCSSVariableType() {
        return this.type === PartType.CSSVariableAssignment
            || this.type === PartType.CSSVariableDefinition
            || this.type === PartType.CSSVariableDefinitionNotComplete
            || this.type === PartType.CSSVariableReference
            || this.type === PartType.CSSVariableReferenceNoVar;
    }
    isCSSVariableDefinitionType() {
        return this.type === PartType.CSSVariableDefinition;
    }
    isDefinitionType() {
        return this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass
            || this.type === PartType.CSSVariableDefinition;
    }
    isReferenceType() {
        return this.type === PartType.Tag
            || this.type === PartType.Id
            || this.type === PartType.Class
            || this.type === PartType.CSSSelectorQueryTag
            || this.type === PartType.CSSSelectorQueryId
            || this.type === PartType.CSSSelectorQueryClass
            || this.type === PartType.CSSVariableAssignment
            || this.type === PartType.CSSVariableReference
            || this.type === PartType.ReactDefaultImportedCSSModuleClass
            || this.type === PartType.ReactImportedCSSModuleProperty;
    }
    /** HTML tag and selector tag. */
    isTagType() {
        return this.type === PartType.Tag
            || this.type === PartType.CSSSelectorTag;
    }
    isSelectorWrapperType() {
        return this.type === PartType.CSSSelectorWrapper;
    }
    isSelectorType() {
        return this.type === PartType.Tag
            || this.type === PartType.Id
            || this.type === PartType.Class
            || this.type === PartType.CSSSelectorQueryTag
            || this.type === PartType.CSSSelectorQueryId
            || this.type === PartType.CSSSelectorQueryClass
            || this.type === PartType.CSSSelectorWrapper
            || this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass
            || this.type === PartType.ReactDefaultImportedCSSModuleClass
            || this.type === PartType.ReactImportedCSSModuleProperty;
    }
    isSelectorDetailedType() {
        return this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass;
    }
    /** Only definition part has formatted list. */
    hasFormattedList() {
        return this.type === PartType.CSSSelectorWrapper
            || this.type === PartType.CSSSelectorTag
            || this.type === PartType.CSSSelectorId
            || this.type === PartType.CSSSelectorClass;
    }
    /** Remove start and end quotes. */
    unquote() {
        let text = this.escapedText;
        let start = this.start;
        if (/^['"]/.test(text)) {
            text = text.slice(1);
            start += 1;
        }
        if (/['"]$/.test(text)) {
            text = text.slice(0, -1);
        }
        if (text !== this.escapedText) {
            return new Part(this.type, text, start, this.defEnd);
        }
        else {
            return this;
        }
    }
    /** Trim text. */
    trim() {
        let text = this.escapedText;
        let start = this.start;
        if (/^\s+/.test(text)) {
            text = text.trimStart();
            start += this.escapedText.length - text.length;
            return new Part(this.type, text, start, this.defEnd);
        }
        if (/\s+$/.test(text)) {
            text = text.trimEnd();
        }
        if (text !== this.escapedText) {
            return new Part(this.type, text, start, this.defEnd);
        }
        else {
            return this;
        }
    }
}
exports.Part = Part;
//# sourceMappingURL=part.js.map