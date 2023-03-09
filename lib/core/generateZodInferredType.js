"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateZodInferredType = void 0;
const tslib_1 = require("tslib");
const ts = (0, tslib_1.__importStar)(require("typescript"));
const { factory: f } = ts;
/**
 * Generate zod inferred type.
 *
 * ```ts
 *  export type ${aliasName} = ${zodImportValue}.infer<typeof ${zodConstName}>
 * ```
 */
function generateZodInferredType({ aliasName, zodImportValue, zodConstName, }) {
    return f.createTypeAliasDeclaration(undefined, [f.createModifier(ts.SyntaxKind.ExportKeyword)], f.createIdentifier(aliasName), undefined, f.createTypeReferenceNode(f.createQualifiedName(f.createIdentifier(zodImportValue), f.createIdentifier("infer")), [f.createTypeQueryNode(f.createIdentifier(zodConstName))]));
}
exports.generateZodInferredType = generateZodInferredType;
//# sourceMappingURL=generateZodInferredType.js.map