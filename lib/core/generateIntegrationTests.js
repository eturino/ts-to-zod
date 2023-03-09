"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIntegrationTests = void 0;
const tslib_1 = require("tslib");
const typescript_1 = (0, tslib_1.__importDefault)(require("typescript"));
const { factory: f } = typescript_1.default;
/**
 * Generate integration tests to validate if the generated zod schemas
 * are equals to the originals types.
 *
 * ```ts
 * expectType<${tsType}>({} as ${zodType})
 * expectType<${zodType}>({} as ${tsType})
 * ```
 */
function generateIntegrationTests(testCases) {
    return testCases
        .map((testCase) => [
        f.createCallExpression(f.createIdentifier("expectType"), [f.createTypeReferenceNode(testCase.tsType)], [
            f.createAsExpression(f.createObjectLiteralExpression(), f.createTypeReferenceNode(testCase.zodType)),
        ]),
        f.createCallExpression(f.createIdentifier("expectType"), [f.createTypeReferenceNode(testCase.zodType)], [
            f.createAsExpression(f.createObjectLiteralExpression(), f.createTypeReferenceNode(testCase.tsType)),
        ]),
    ])
        .reduce((mem, i) => [...mem, ...i], []);
}
exports.generateIntegrationTests = generateIntegrationTests;
//# sourceMappingURL=generateIntegrationTests.js.map