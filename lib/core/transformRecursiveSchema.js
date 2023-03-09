"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformRecursiveSchema = void 0;
const tslib_1 = require("tslib");
const typescript_1 = (0, tslib_1.__importDefault)(require("typescript"));
const { factory: f } = typescript_1.default;
/**
 * Type hint zod to deal with recursive types.
 *
 * https://github.com/colinhacks/zod/tree/v3#recursive-types
 */
function transformRecursiveSchema(zodImportValue, zodStatement, typeName) {
    const declaration = zodStatement.declarationList.declarations[0];
    if (!declaration.initializer) {
        throw new Error("Unvalid zod statement");
    }
    return f.createVariableStatement(zodStatement.modifiers, f.createVariableDeclarationList([
        f.createVariableDeclaration(declaration.name, undefined, f.createTypeReferenceNode(`${zodImportValue}.ZodSchema`, [
            f.createTypeReferenceNode(typeName),
        ]), f.createCallExpression(f.createPropertyAccessExpression(f.createIdentifier(zodImportValue), f.createIdentifier("lazy")), undefined, [
            f.createArrowFunction(undefined, undefined, [], undefined, undefined, declaration.initializer),
        ])),
    ], typescript_1.default.NodeFlags.Const));
}
exports.transformRecursiveSchema = transformRecursiveSchema;
//# sourceMappingURL=transformRecursiveSchema.js.map