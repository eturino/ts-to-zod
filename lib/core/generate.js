"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const tslib_1 = require("tslib");
const case_1 = require("case");
const tsutils_1 = require("tsutils");
const typescript_1 = (0, tslib_1.__importDefault)(require("typescript"));
const config_1 = require("../config");
const getSimplifiedJsDocTags_1 = require("../utils/getSimplifiedJsDocTags");
const resolveModules_1 = require("../utils/resolveModules");
const generateIntegrationTests_1 = require("./generateIntegrationTests");
const generateZodInferredType_1 = require("./generateZodInferredType");
const generateZodSchema_1 = require("./generateZodSchema");
const transformRecursiveSchema_1 = require("./transformRecursiveSchema");
/**
 * Generate zod schemas and integration tests from a typescript file.
 *
 * This function take care of the sorting of the `const` declarations and solved potential circular references
 */
function generate({ sourceText, maybeConfig = config_1.DefaultMaybeConfig, maxRun = 10, nameFilter = () => true, jsDocTagFilter = () => true, getSchemaName = (id) => (0, case_1.camel)(id) + "Schema", keepComments = false, skipParseJSDoc = false, }) {
    // Create a source file and deal with modules
    const sourceFile = (0, resolveModules_1.resolveModules)(sourceText);
    const isMaybe = (node) => maybeConfig.typeNames.has(node.name.text);
    // Extract the nodes (interface declarations, type aliases, and enums)
    const nodes = [];
    const visitor = (node) => {
        if (typescript_1.default.isInterfaceDeclaration(node) ||
            typescript_1.default.isTypeAliasDeclaration(node) ||
            typescript_1.default.isEnumDeclaration(node)) {
            const jsDoc = (0, tsutils_1.getJsDoc)(node, sourceFile);
            const tags = (0, getSimplifiedJsDocTags_1.getSimplifiedJsDocTags)(jsDoc);
            if (!jsDocTagFilter(tags))
                return;
            if (!nameFilter(node.name.text))
                return;
            if (isMaybe(node))
                return;
            nodes.push(node);
        }
    };
    typescript_1.default.forEachChild(sourceFile, visitor);
    // Generate zod schemas
    const zodSchemas = nodes.map((node) => {
        const typeName = node.name.text;
        const varName = getSchemaName(typeName);
        const zodSchema = (0, generateZodSchema_1.generateZodSchemaVariableStatement)({
            zodImportValue: "z",
            node,
            sourceFile,
            varName,
            getDependencyName: getSchemaName,
            skipParseJSDoc,
            maybeConfig,
        });
        return Object.assign({ typeName, varName }, zodSchema);
    });
    // Resolves statements order
    // A schema can't be declared if all the referenced schemas used inside this one are not previously declared.
    const statements = new Map();
    const typeImports = new Set();
    let n = 0;
    while (statements.size !== zodSchemas.length && n < maxRun) {
        zodSchemas
            .filter(({ varName }) => !statements.has(varName))
            .forEach(({ varName, dependencies, statement, typeName, requiresImport }) => {
            const isCircular = dependencies.includes(varName);
            const missingDependencies = dependencies
                .filter((dep) => dep !== varName)
                .filter((dep) => !statements.has(dep));
            if (missingDependencies.length === 0) {
                if (isCircular) {
                    typeImports.add(typeName);
                    statements.set(varName, {
                        value: (0, transformRecursiveSchema_1.transformRecursiveSchema)("z", statement, typeName),
                        typeName,
                    });
                }
                else {
                    if (requiresImport) {
                        typeImports.add(typeName);
                    }
                    statements.set(varName, { value: statement, typeName });
                }
            }
        });
        n++; // Just a safety net to avoid infinity loops
    }
    // Warn the user of possible not resolvable loops
    const missingStatements = zodSchemas.filter(({ varName }) => !statements.has(varName));
    const errors = [];
    if (missingStatements.length) {
        errors.push(`Some schemas can't be generated due to circular dependencies:
${missingStatements.map(({ varName }) => `${varName}`).join("\n")}`);
    }
    // Create output files (zod schemas & integration tests)
    const printer = typescript_1.default.createPrinter({
        newLine: typescript_1.default.NewLineKind.LineFeed,
        removeComments: !keepComments,
    });
    const printerWithComments = typescript_1.default.createPrinter({
        newLine: typescript_1.default.NewLineKind.LineFeed,
    });
    const print = (node) => printer.printNode(typescript_1.default.EmitHint.Unspecified, node, sourceFile);
    const transformedSourceText = printerWithComments.printFile(sourceFile);
    const imports = Array.from(typeImports.values());
    const getZodSchemasFile = (typesImportPath) => `// Generated by ts-to-zod
import { z } from "zod";
${imports.length
        ? `import { ${imports.join(", ")} } from "${typesImportPath}";\n`
        : ""}${makeMaybePrinted(maybeConfig)}
${Array.from(statements.values())
        .map((statement) => print(statement.value))
        .join("\n\n")}
`;
    const testCases = (0, generateIntegrationTests_1.generateIntegrationTests)(Array.from(statements.values())
        .filter(isExported)
        .map((i) => ({
        zodType: `${getSchemaName(i.typeName)}InferredType`,
        tsType: `spec.${i.typeName}`,
    })));
    const getIntegrationTestFile = (typesImportPath, zodSchemasImportPath) => `// Generated by ts-to-zod
import { z } from "zod";

import * as spec from "${typesImportPath}";
import * as generated from "${zodSchemasImportPath}";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function expectType<T>(_: T) {
  /* noop */
}

${Array.from(statements.values())
        .filter(isExported)
        .map((statement) => {
        // Generate z.infer<>
        const zodInferredSchema = (0, generateZodInferredType_1.generateZodInferredType)({
            aliasName: `${getSchemaName(statement.typeName)}InferredType`,
            zodConstName: `generated.${getSchemaName(statement.typeName)}`,
            zodImportValue: "z",
        });
        return print(zodInferredSchema);
    })
        .join("\n\n")}
${testCases.map(print).join("\n")}
`;
    return {
        /**
         * Source text with pre-process applied.
         */
        transformedSourceText,
        /**
         * Get the content of the zod schemas file.
         *
         * @param typesImportPath Relative path of the source file
         */
        getZodSchemasFile,
        /**
         * Get the content of the integration tests file.
         *
         * @param typesImportPath Relative path of the source file
         * @param zodSchemasImportPath Relative path of the zod schemas file
         */
        getIntegrationTestFile,
        /**
         * List of generation errors.
         */
        errors,
        /**
         * `true` if zodSchemaFile have some resolvable circular dependencies
         */
        hasCircularDependencies: imports.length > 0,
    };
}
exports.generate = generate;
/**
 * Helper to filter exported const declaration
 * @param i
 * @returns
 */
const isExported = (i) => { var _a; return (_a = i.value.modifiers) === null || _a === void 0 ? void 0 : _a.find((mod) => mod.kind === typescript_1.default.SyntaxKind.ExportKeyword); };
const makeMaybePrinted = (maybeConfig) => {
    if (!maybeConfig.typeNames.size)
        return "";
    let chained = "";
    if (maybeConfig.nullable) {
        chained += ".nullable()";
    }
    if (maybeConfig.optional) {
        chained += ".optional()";
    }
    return `
export const maybe = <T extends z.ZodTypeAny>(schema: T) => {
  return schema${chained};
};
`;
};
//# sourceMappingURL=generate.js.map