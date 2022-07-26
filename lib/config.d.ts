export interface SimplifiedJSDocTag {
    /**
     * Name of the tag
     *
     * @ref tag.tagName.escapedText.toString()
     */
    name: string;
    /**
     * Value of the tag
     *
     * @ref tag.comment
     */
    value?: string;
}
export declare type GetSchemaName = (identifier: string) => string;
export declare type NameFilter = (name: string) => boolean;
export declare type JSDocTagFilter = (tags: SimplifiedJSDocTag[]) => boolean;
export declare type MaybeConfig = {
    typeNames: Set<string>;
    optional: boolean;
    nullable: boolean;
};
export declare const DefaultMaybeConfig: MaybeConfig;
export declare type Config = {
    /**
     * Path of the input file (types source)
     */
    input: string;
    /**
     * Path of the output file (generated zod schemas)
     */
    output: string;
    /**
     * Skip the validation step (not recommended)
     */
    skipValidation?: boolean;
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
    getSchemaName?: GetSchemaName;
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
     * If present, it will enable the Maybe special case for each of the given type names.
     * They can be names of interfaces or types.
     *
     * e.g.
     * - maybeTypeNames: ["Maybe"]
     * - maybeOptional: true
     * - maybeNullable: true
     *
     * ```ts
     * // input:
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
    maybeTypeNames?: string[];
    /**
     * determines if the Maybe special case is optional (can be treated as undefined) or not
     *
     * @see maybeTypeNames
     * @default true
     */
    maybeOptional?: boolean;
    /**
     * determines if the Maybe special case is nullable (can be treated as null) or not
     *
     * @see maybeTypeNames
     * @default true
     */
    maybeNullable?: boolean;
};
export declare type Configs = Array<Config & {
    /**
     * Name of the config.
     *
     * Usage: `ts-to-zod --config {name}`
     */
    name: string;
}>;
export declare type TsToZodConfig = Config | Configs;
