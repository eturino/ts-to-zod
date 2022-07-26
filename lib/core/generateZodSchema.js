"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateZodSchemaVariableStatement = void 0;
const tslib_1 = require("tslib");
const case_1 = require("case");
const uniq_1 = (0, tslib_1.__importDefault)(require("lodash/uniq"));
const ts = (0, tslib_1.__importStar)(require("typescript"));
const config_1 = require("../config");
const findNode_1 = require("../utils/findNode");
const isNotNull_1 = require("../utils/isNotNull");
const jsDocTags_1 = require("./jsDocTags");
const { factory: f } = ts;
/**
 * Generate zod schema declaration
 *
 * ```ts
 * export const ${varName} = ${zodImportValue}.object(…)
 * ```
 */
function generateZodSchemaVariableStatement({ node, sourceFile, varName, maybeConfig = config_1.DefaultMaybeConfig, zodImportValue = "z", getDependencyName = (identifierName) => (0, case_1.camel)(`${identifierName}Schema`), skipParseJSDoc = false, }) {
    let schema;
    let dependencies = [];
    let requiresImport = false;
    if (ts.isInterfaceDeclaration(node)) {
        let schemaExtensionClauses;
        if (node.typeParameters) {
            throw new Error("Interface with generics are not supported!");
        }
        if (node.heritageClauses) {
            // Looping on heritageClauses browses the "extends" keywords
            schemaExtensionClauses = node.heritageClauses.reduce((deps, h) => {
                if (h.token !== ts.SyntaxKind.ExtendsKeyword || !h.types) {
                    return deps;
                }
                // Looping on types browses the comma-separated interfaces
                const heritages = h.types.map((expression) => {
                    return getDependencyName(expression.getText(sourceFile));
                });
                return deps.concat(heritages);
            }, []);
            dependencies = dependencies.concat(schemaExtensionClauses);
        }
        schema = buildZodObject({
            typeNode: node,
            sourceFile,
            z: zodImportValue,
            dependencies,
            getDependencyName,
            schemaExtensionClauses,
            skipParseJSDoc,
            maybeConfig,
        });
    }
    if (ts.isTypeAliasDeclaration(node)) {
        if (node.typeParameters) {
            throw new Error("Type with generics are not supported!");
        }
        const jsDocTags = skipParseJSDoc ? {} : (0, jsDocTags_1.getJSDocTags)(node, sourceFile);
        schema = buildZodPrimitive({
            z: zodImportValue,
            typeNode: node.type,
            isOptional: false,
            jsDocTags,
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        });
    }
    if (ts.isEnumDeclaration(node)) {
        schema = buildZodSchema(zodImportValue, "nativeEnum", [node.name]);
        requiresImport = true;
    }
    return {
        dependencies: (0, uniq_1.default)(dependencies),
        statement: f.createVariableStatement(node.modifiers, f.createVariableDeclarationList([
            f.createVariableDeclaration(f.createIdentifier(varName), undefined, undefined, schema),
        ], ts.NodeFlags.Const)),
        requiresImport,
    };
}
exports.generateZodSchemaVariableStatement = generateZodSchemaVariableStatement;
function buildZodProperties({ members, zodImportValue: z, sourceFile, dependencies, getDependencyName, skipParseJSDoc, maybeConfig, }) {
    const properties = new Map();
    members.forEach((member) => {
        if (!ts.isPropertySignature(member) ||
            !member.type ||
            !(ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) {
            return;
        }
        const isOptional = Boolean(member.questionToken);
        const jsDocTags = skipParseJSDoc ? {} : (0, jsDocTags_1.getJSDocTags)(member, sourceFile);
        properties.set(member.name, buildZodPrimitive({
            z,
            typeNode: member.type,
            isOptional,
            jsDocTags,
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        }));
    });
    return properties;
}
function buildZodPrimitive({ z, typeNode, isOptional, isNullable, isPartial, isRequired, jsDocTags, sourceFile, dependencies, getDependencyName, skipParseJSDoc, maybeConfig, }) {
    const zodProperties = (0, jsDocTags_1.jsDocTagToZodProperties)(jsDocTags, isOptional, Boolean(isPartial), Boolean(isRequired), Boolean(isNullable));
    if (ts.isParenthesizedTypeNode(typeNode)) {
        return buildZodPrimitive({
            z,
            typeNode: typeNode.type,
            isOptional,
            jsDocTags,
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        });
    }
    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
        const identifierName = typeNode.typeName.text;
        // Deal with `Maybe<>`
        if (maybeConfig.typeNames.has(identifierName) && typeNode.typeArguments) {
            const innerType = typeNode.typeArguments[0];
            return maybeCall(buildZodPrimitive({
                z,
                typeNode: innerType,
                isOptional: false,
                jsDocTags: {},
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            }), { isOptional });
        }
        // Deal with `Array<>` syntax
        if (identifierName === "Array" && typeNode.typeArguments) {
            return buildZodPrimitive({
                z,
                typeNode: f.createArrayTypeNode(typeNode.typeArguments[0]),
                isOptional,
                jsDocTags: {},
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            });
        }
        // Deal with `Partial<>` syntax
        if (identifierName === "Partial" && typeNode.typeArguments) {
            return buildZodPrimitive({
                z,
                typeNode: typeNode.typeArguments[0],
                isOptional,
                jsDocTags,
                sourceFile,
                isPartial: true,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            });
        }
        // Deal with `Required<>` syntax
        if (identifierName === "Required" && typeNode.typeArguments) {
            return buildZodPrimitive({
                z,
                typeNode: typeNode.typeArguments[0],
                isOptional,
                jsDocTags,
                sourceFile,
                isRequired: true,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            });
        }
        // Deal with `Readonly<>` syntax
        if (identifierName === "Readonly" && typeNode.typeArguments) {
            return buildZodPrimitive({
                z,
                typeNode: typeNode.typeArguments[0],
                isOptional,
                jsDocTags,
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            });
        }
        // Deal with `ReadonlyArray<>` syntax
        if (identifierName === "ReadonlyArray" && typeNode.typeArguments) {
            return buildZodSchema(z, "array", [
                buildZodPrimitive({
                    z,
                    typeNode: typeNode.typeArguments[0],
                    isOptional: false,
                    jsDocTags: {},
                    sourceFile,
                    dependencies,
                    getDependencyName,
                    skipParseJSDoc,
                    maybeConfig,
                }),
            ], zodProperties);
        }
        // Deal with `Record<>` syntax
        if (identifierName === "Record" && typeNode.typeArguments) {
            if (typeNode.typeArguments.length !== 2 ||
                typeNode.typeArguments[0].kind !== ts.SyntaxKind.StringKeyword) {
                throw new Error(`Record<${typeNode.typeArguments[0].getText(sourceFile)}, …> are not supported (https://github.com/colinhacks/zod/tree/v3#records)`);
            }
            return buildZodSchema(z, "record", [
                buildZodPrimitive({
                    z,
                    typeNode: typeNode.typeArguments[1],
                    isOptional: false,
                    jsDocTags,
                    sourceFile,
                    isPartial: false,
                    dependencies,
                    getDependencyName,
                    skipParseJSDoc,
                    maybeConfig,
                }),
            ], zodProperties);
        }
        // Deal with `Date`
        if (identifierName === "Date") {
            return buildZodSchema(z, "date", [], zodProperties);
        }
        // Deal with `Promise<>` syntax
        if (identifierName === "Promise" && typeNode.typeArguments) {
            return buildZodSchema(z, "promise", typeNode.typeArguments.map((i) => buildZodPrimitive({
                z,
                typeNode: i,
                isOptional: false,
                jsDocTags,
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            })), zodProperties);
        }
        // Deal with `Omit<>` & `Pick<>` syntax
        if (["Omit", "Pick"].includes(identifierName) && typeNode.typeArguments) {
            const [originalType, keys] = typeNode.typeArguments;
            let parameters;
            if (ts.isLiteralTypeNode(keys)) {
                parameters = f.createObjectLiteralExpression([
                    f.createPropertyAssignment(keys.literal.getText(sourceFile), f.createTrue()),
                ]);
            }
            if (ts.isUnionTypeNode(keys)) {
                parameters = f.createObjectLiteralExpression(keys.types.map((type) => {
                    if (!ts.isLiteralTypeNode(type)) {
                        throw new Error(`${identifierName}<T, K> unknown syntax: (${ts.SyntaxKind[type.kind]} as K union part not supported)`);
                    }
                    return f.createPropertyAssignment(type.literal.getText(sourceFile), f.createTrue());
                }));
            }
            if (!parameters) {
                throw new Error(`${identifierName}<T, K> unknown syntax: (${ts.SyntaxKind[keys.kind]} as K not supported)`);
            }
            return f.createCallExpression(f.createPropertyAccessExpression(buildZodPrimitive({
                z,
                typeNode: originalType,
                isOptional: false,
                jsDocTags: {},
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            }), f.createIdentifier((0, case_1.lower)(identifierName))), undefined, [parameters]);
        }
        const dependencyName = getDependencyName(identifierName);
        dependencies.push(dependencyName);
        const zodSchema = f.createIdentifier(dependencyName);
        return withZodProperties(zodSchema, zodProperties);
    }
    if (ts.isUnionTypeNode(typeNode)) {
        const hasNull = Boolean(typeNode.types.find((i) => ts.isLiteralTypeNode(i) &&
            i.literal.kind === ts.SyntaxKind.NullKeyword));
        const nodes = typeNode.types.filter(isNotNull_1.isNotNull);
        // type A = | 'b' is a valid typescript definition
        // Zod does not allow `z.union(['b']), so we have to return just the value
        if (nodes.length === 1) {
            return buildZodPrimitive({
                z,
                typeNode: nodes[0],
                isOptional,
                isNullable: hasNull,
                jsDocTags,
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            });
        }
        const values = nodes.map((i) => buildZodPrimitive({
            z,
            typeNode: i,
            isOptional: false,
            isNullable: false,
            jsDocTags: {},
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        }));
        // Handling null value outside of the union type
        if (hasNull) {
            zodProperties.push({
                identifier: "nullable",
            });
        }
        return buildZodSchema(z, "union", [f.createArrayLiteralExpression(values)], zodProperties);
    }
    if (ts.isTupleTypeNode(typeNode)) {
        const values = typeNode.elements.map((i) => buildZodPrimitive({
            z,
            typeNode: ts.isNamedTupleMember(i) ? i.type : i,
            isOptional: false,
            jsDocTags: {},
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        }));
        return buildZodSchema(z, "tuple", [f.createArrayLiteralExpression(values)], zodProperties);
    }
    if (ts.isLiteralTypeNode(typeNode)) {
        if (ts.isStringLiteral(typeNode.literal)) {
            return buildZodSchema(z, "literal", [f.createStringLiteral(typeNode.literal.text)], zodProperties);
        }
        if (ts.isNumericLiteral(typeNode.literal)) {
            return buildZodSchema(z, "literal", [f.createNumericLiteral(typeNode.literal.text)], zodProperties);
        }
        if (typeNode.literal.kind === ts.SyntaxKind.TrueKeyword) {
            return buildZodSchema(z, "literal", [f.createTrue()], zodProperties);
        }
        if (typeNode.literal.kind === ts.SyntaxKind.FalseKeyword) {
            return buildZodSchema(z, "literal", [f.createFalse()], zodProperties);
        }
    }
    // Deal with enums used as literals
    if (ts.isTypeReferenceNode(typeNode) &&
        ts.isQualifiedName(typeNode.typeName) &&
        ts.isIdentifier(typeNode.typeName.left)) {
        return buildZodSchema(z, "literal", [
            f.createPropertyAccessExpression(typeNode.typeName.left, typeNode.typeName.right),
        ], zodProperties);
    }
    if (ts.isArrayTypeNode(typeNode)) {
        return buildZodSchema(z, "array", [
            buildZodPrimitive({
                z,
                typeNode: typeNode.elementType,
                isOptional: false,
                jsDocTags: {},
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            }),
        ], zodProperties);
    }
    if (ts.isTypeLiteralNode(typeNode)) {
        return withZodProperties(buildZodObject({
            typeNode,
            z,
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        }), zodProperties);
    }
    if (ts.isIntersectionTypeNode(typeNode)) {
        const [base, ...rest] = typeNode.types;
        const basePrimitive = buildZodPrimitive({
            z,
            typeNode: base,
            isOptional: false,
            jsDocTags: {},
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        });
        return rest.reduce((intersectionSchema, node) => f.createCallExpression(f.createPropertyAccessExpression(intersectionSchema, f.createIdentifier("and")), undefined, [
            buildZodPrimitive({
                z,
                typeNode: node,
                isOptional: false,
                jsDocTags: {},
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            }),
        ]), basePrimitive);
    }
    if (ts.isLiteralTypeNode(typeNode)) {
        return buildZodSchema(z, typeNode.literal.getText(sourceFile), [], zodProperties);
    }
    if (ts.isFunctionTypeNode(typeNode)) {
        return buildZodSchema(z, "function", [], [
            {
                identifier: "args",
                expressions: typeNode.parameters.map((p) => buildZodPrimitive({
                    z,
                    typeNode: p.type || f.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    jsDocTags,
                    sourceFile,
                    dependencies,
                    getDependencyName,
                    isOptional: Boolean(p.questionToken),
                    skipParseJSDoc,
                    maybeConfig,
                })),
            },
            {
                identifier: "returns",
                expressions: [
                    buildZodPrimitive({
                        z,
                        typeNode: typeNode.type,
                        jsDocTags,
                        sourceFile,
                        dependencies,
                        getDependencyName,
                        isOptional: false,
                        skipParseJSDoc,
                        maybeConfig,
                    }),
                ],
            },
            ...zodProperties,
        ]);
    }
    if (ts.isIndexedAccessTypeNode(typeNode)) {
        return buildSchemaReference({
            node: typeNode,
            getDependencyName,
            sourceFile,
            dependencies,
            maybeConfig,
        });
    }
    switch (typeNode.kind) {
        case ts.SyntaxKind.StringKeyword:
            return buildZodSchema(z, "string", [], zodProperties);
        case ts.SyntaxKind.BooleanKeyword:
            return buildZodSchema(z, "boolean", [], zodProperties);
        case ts.SyntaxKind.UndefinedKeyword:
            return buildZodSchema(z, "undefined", [], zodProperties);
        case ts.SyntaxKind.NumberKeyword:
            return buildZodSchema(z, "number", [], zodProperties);
        case ts.SyntaxKind.AnyKeyword:
            return buildZodSchema(z, "any", [], zodProperties);
        case ts.SyntaxKind.BigIntKeyword:
            return buildZodSchema(z, "bigint", [], zodProperties);
        case ts.SyntaxKind.VoidKeyword:
            return buildZodSchema(z, "void", [], zodProperties);
        case ts.SyntaxKind.NeverKeyword:
            return buildZodSchema(z, "never", [], zodProperties);
        case ts.SyntaxKind.UnknownKeyword:
            return buildZodSchema(z, "unknown", [], zodProperties);
    }
    console.warn(` »   Warning: '${ts.SyntaxKind[typeNode.kind]}' is not supported, fallback into 'z.any()'`);
    return buildZodSchema(z, "any", [], zodProperties);
}
/**
 * Build a zod schema.
 *
 * @param z zod namespace
 * @param callName zod function
 * @param args Args to add to the main zod call, if any
 * @param properties An array of flags that should be added as extra property calls such as optional to add .optional()
 */
function buildZodSchema(z, callName, args, properties) {
    const zodCall = f.createCallExpression(f.createPropertyAccessExpression(f.createIdentifier(z), f.createIdentifier(callName)), undefined, args);
    return withZodProperties(zodCall, properties);
}
function maybeCall(arg, opts) {
    const zodCall = f.createCallExpression(f.createIdentifier("maybe"), undefined, [arg]);
    const properties = [];
    if (opts.isOptional) {
        properties.push((0, jsDocTags_1.zodPropertyIsOptional)());
    }
    return withZodProperties(zodCall, properties);
}
function buildZodExtendedSchema(schemaList, args, properties) {
    let zodCall = f.createIdentifier(schemaList[0]);
    for (let i = 1; i < schemaList.length; i++) {
        zodCall = f.createCallExpression(f.createPropertyAccessExpression(zodCall, f.createIdentifier("extend")), undefined, [
            f.createPropertyAccessExpression(f.createIdentifier(schemaList[i]), f.createIdentifier("shape")),
        ]);
    }
    zodCall = f.createCallExpression(f.createPropertyAccessExpression(zodCall, f.createIdentifier("extend")), undefined, args);
    return withZodProperties(zodCall, properties);
}
/**
 * Apply zod properties to an expression (as `.optional()`)
 *
 * @param expression
 * @param properties
 */
function withZodProperties(expression, properties = []) {
    return properties.reduce((expressionWithProperties, property) => f.createCallExpression(f.createPropertyAccessExpression(expressionWithProperties, f.createIdentifier(property.identifier)), undefined, property.expressions ? property.expressions : undefined), expression);
}
/**
 * Build z.object (with support of index signature)
 */
function buildZodObject({ typeNode, z, dependencies, sourceFile, getDependencyName, schemaExtensionClauses, skipParseJSDoc, maybeConfig, }) {
    const { properties, indexSignature } = typeNode.members.reduce((mem, member) => {
        if (ts.isIndexSignatureDeclaration(member)) {
            return Object.assign(Object.assign({}, mem), { indexSignature: member });
        }
        if (ts.isPropertySignature(member)) {
            return Object.assign(Object.assign({}, mem), { properties: [...mem.properties, member] });
        }
        return mem;
    }, { properties: [] });
    let objectSchema;
    if (properties.length > 0) {
        const parsedProperties = buildZodProperties({
            members: properties,
            zodImportValue: z,
            sourceFile,
            dependencies,
            getDependencyName,
            skipParseJSDoc,
            maybeConfig,
        });
        if (schemaExtensionClauses && schemaExtensionClauses.length > 0) {
            objectSchema = buildZodExtendedSchema(schemaExtensionClauses, [
                f.createObjectLiteralExpression(Array.from(parsedProperties.entries()).map(([key, tsCall]) => {
                    return f.createPropertyAssignment(key, tsCall);
                }), true),
            ]);
        }
        else {
            objectSchema = buildZodSchema(z, "object", [
                f.createObjectLiteralExpression(Array.from(parsedProperties.entries()).map(([key, tsCall]) => {
                    return f.createPropertyAssignment(key, tsCall);
                }), true),
            ]);
        }
    }
    if (indexSignature) {
        if (schemaExtensionClauses) {
            throw new Error("interface with `extends` and index signature are not supported!");
        }
        const indexSignatureSchema = buildZodSchema(z, "record", [
            // Index signature type can't be optional or have validators.
            buildZodPrimitive({
                z,
                typeNode: indexSignature.type,
                isOptional: false,
                jsDocTags: {},
                sourceFile,
                dependencies,
                getDependencyName,
                skipParseJSDoc,
                maybeConfig,
            }),
        ]);
        if (objectSchema) {
            return f.createCallExpression(f.createPropertyAccessExpression(indexSignatureSchema, f.createIdentifier("and")), undefined, [objectSchema]);
        }
        return indexSignatureSchema;
    }
    else if (objectSchema) {
        return objectSchema;
    }
    return buildZodSchema(z, "object", [f.createObjectLiteralExpression()]);
}
/**
 * Build a schema reference from an IndexedAccessTypeNode
 *
 * example: Superman["power"]["fly"] -> SupermanSchema.shape.power.shape.fly
 */
function buildSchemaReference({ node, dependencies, sourceFile, getDependencyName, maybeConfig, }, path = "") {
    const indexTypeText = node.indexType.getText(sourceFile);
    const { indexTypeName, type: indexTypeType } = /^"\w+"$/.exec(indexTypeText)
        ? { type: "string", indexTypeName: indexTypeText.slice(1, -1) }
        : { type: "number", indexTypeName: indexTypeText };
    if (indexTypeName === "-1") {
        // Get the original type declaration
        const declaration = (0, findNode_1.findNode)(sourceFile, (n) => {
            return ((ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) &&
                ts.isIndexedAccessTypeNode(node.objectType) &&
                n.name.getText(sourceFile) ===
                    node.objectType.objectType.getText(sourceFile).split("[")[0]);
        });
        if (declaration && ts.isIndexedAccessTypeNode(node.objectType)) {
            const key = node.objectType.indexType.getText(sourceFile).slice(1, -1); // remove quotes
            const members = ts.isTypeAliasDeclaration(declaration) &&
                ts.isTypeLiteralNode(declaration.type)
                ? declaration.type.members
                : ts.isInterfaceDeclaration(declaration)
                    ? declaration.members
                    : [];
            const member = members.find((m) => { var _a; return ((_a = m.name) === null || _a === void 0 ? void 0 : _a.getText(sourceFile)) === key; });
            if (member && ts.isPropertySignature(member) && member.type) {
                // Maybe<type>
                if (ts.isTypeReferenceNode(member.type) &&
                    maybeConfig.typeNames.has(member.type.typeName.getText(sourceFile))) {
                    return buildSchemaReference({
                        node: node.objectType,
                        dependencies,
                        sourceFile,
                        getDependencyName,
                        maybeConfig,
                    }, `element.${path}`);
                }
                // Array<type>
                if (ts.isTypeReferenceNode(member.type) &&
                    member.type.typeName.getText(sourceFile) === "Array") {
                    return buildSchemaReference({
                        node: node.objectType,
                        dependencies,
                        sourceFile,
                        getDependencyName,
                        maybeConfig,
                    }, `element.${path}`);
                }
                // type[]
                if (ts.isArrayTypeNode(member.type)) {
                    return buildSchemaReference({
                        node: node.objectType,
                        dependencies,
                        sourceFile,
                        getDependencyName,
                        maybeConfig,
                    }, `element.${path}`);
                }
                // Record<string, type>
                if (ts.isTypeReferenceNode(member.type) &&
                    member.type.typeName.getText(sourceFile) === "Record") {
                    return buildSchemaReference({
                        node: node.objectType,
                        dependencies,
                        sourceFile,
                        getDependencyName,
                        maybeConfig,
                    }, `valueSchema.${path}`);
                }
                console.warn(` »   Warning: indexAccessType can’t be resolved, fallback into 'any'`);
                return f.createIdentifier("any");
            }
        }
        return f.createIdentifier("any");
    }
    else if (indexTypeType === "number" &&
        ts.isIndexedAccessTypeNode(node.objectType)) {
        return buildSchemaReference({
            node: node.objectType,
            dependencies,
            sourceFile,
            getDependencyName,
            maybeConfig,
        }, `items[${indexTypeName}].${path}`);
    }
    if (ts.isIndexedAccessTypeNode(node.objectType)) {
        return buildSchemaReference({
            node: node.objectType,
            dependencies,
            sourceFile,
            getDependencyName,
            maybeConfig,
        }, `shape.${indexTypeName}.${path}`);
    }
    if (ts.isTypeReferenceNode(node.objectType)) {
        const dependencyName = getDependencyName(node.objectType.typeName.getText(sourceFile));
        dependencies.push(dependencyName);
        return f.createPropertyAccessExpression(f.createIdentifier(dependencyName), f.createIdentifier(`shape.${indexTypeName}.${path}`.slice(0, -1)));
    }
    throw new Error("Unknown IndexedAccessTypeNode.objectType type");
}
//# sourceMappingURL=generateZodSchema.js.map