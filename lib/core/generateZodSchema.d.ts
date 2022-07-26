import * as ts from "typescript";
import { MaybeConfig } from "../config";
export interface GenerateZodSchemaProps {
    /**
     * Name of the exported variable
     */
    varName: string;
    /**
     * Interface or type node
     */
    node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration;
    /**
     * Zod import value.
     *
     * @default "z"
     */
    zodImportValue?: string;
    /**
     * Source file
     */
    sourceFile: ts.SourceFile;
    /**
     * Getter for schema dependencies (Type reference inside type)
     *
     * @default (identifierName) => camel(`${identifierName}Schema`)
     */
    getDependencyName?: (identifierName: string) => string;
    /**
     * Skip the creation of zod validators from JSDoc annotations
     *
     * @default false
     */
    skipParseJSDoc?: boolean;
    /**
     * If present, it will be used to support the `Maybe<T>` special case.
     *
     * e.g.
     * ```ts
     * // with maybe config: { typeNames: ["Maybe"], optional: true, nullable: true }
     *
     * export type X = { a: string; b: Maybe<string> };
     *
     * // output:
     * const maybe = <T extends z.ZodTypeAny>(schema: T) => {
     *   return schema.optional().nullable();
     * };
     *
     * export const xSchema = zod.object({
     *   a: zod.string(),
     *   b: maybe(zod.string())
     * })
     * ```
     */
    maybeConfig?: MaybeConfig;
}
/**
 * Generate zod schema declaration
 *
 * ```ts
 * export const ${varName} = ${zodImportValue}.object(…)
 * ```
 */
export declare function generateZodSchemaVariableStatement({ node, sourceFile, varName, maybeConfig, zodImportValue, getDependencyName, skipParseJSDoc, }: GenerateZodSchemaProps): {
    dependencies: string[];
    statement: ts.VariableStatement;
    requiresImport: boolean;
};
