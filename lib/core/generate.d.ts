import { JSDocTagFilter, MaybeConfig, NameFilter } from "../config";
export interface GenerateProps {
    /**
     * Content of the typescript source file.
     */
    sourceText: string;
    /**
     * Max iteration number to resolve the declaration order.
     */
    maxRun?: number;
    /**
     * Filter on type/interface name.
     */
    nameFilter?: NameFilter;
    /**
     * Filter on JSDocTag.
     */
    jsDocTagFilter?: JSDocTagFilter;
    /**
     * Schema name generator.
     */
    getSchemaName?: (identifier: string) => string;
    /**
     * Keep parameters comments.
     * @default false
     */
    keepComments?: boolean;
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
 * Generate zod schemas and integration tests from a typescript file.
 *
 * This function take care of the sorting of the `const` declarations and solved potential circular references
 */
export declare function generate({ sourceText, maybeConfig, maxRun, nameFilter, jsDocTagFilter, getSchemaName, keepComments, skipParseJSDoc, }: GenerateProps): {
    /**
     * Source text with pre-process applied.
     */
    transformedSourceText: string;
    /**
     * Get the content of the zod schemas file.
     *
     * @param typesImportPath Relative path of the source file
     */
    getZodSchemasFile: (typesImportPath: string) => string;
    /**
     * Get the content of the integration tests file.
     *
     * @param typesImportPath Relative path of the source file
     * @param zodSchemasImportPath Relative path of the zod schemas file
     */
    getIntegrationTestFile: (typesImportPath: string, zodSchemasImportPath: string) => string;
    /**
     * List of generation errors.
     */
    errors: string[];
    /**
     * `true` if zodSchemaFile have some resolvable circular dependencies
     */
    hasCircularDependencies: boolean;
};