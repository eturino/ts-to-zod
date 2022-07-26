import { z } from "zod";
export declare const simplifiedJSDocTagSchema: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value?: string | undefined;
    name: string;
}, {
    value?: string | undefined;
    name: string;
}>;
export declare const getSchemaNameSchema: z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodString>;
export declare const nameFilterSchema: z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodBoolean>;
export declare const jSDocTagFilterSchema: z.ZodFunction<z.ZodTuple<[z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    value: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value?: string | undefined;
    name: string;
}, {
    value?: string | undefined;
    name: string;
}>, "many">], z.ZodUnknown>, z.ZodBoolean>;
export declare const configSchema: z.ZodObject<{
    input: z.ZodString;
    output: z.ZodString;
    skipValidation: z.ZodOptional<z.ZodBoolean>;
    maxRun: z.ZodOptional<z.ZodNumber>;
    nameFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodBoolean>>;
    jsDocTagFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string | undefined;
        name: string;
    }, {
        value?: string | undefined;
        name: string;
    }>, "many">], z.ZodUnknown>, z.ZodBoolean>>;
    getSchemaName: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodString>>;
    keepComments: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    skipParseJSDoc: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeTypeNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maybeOptional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeNullable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    input: string;
    output: string;
    skipParseJSDoc: boolean;
    keepComments: boolean;
    maybeOptional: boolean;
    maybeNullable: boolean;
}, {
    skipParseJSDoc?: boolean | undefined;
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    keepComments?: boolean | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    maybeOptional?: boolean | undefined;
    maybeNullable?: boolean | undefined;
    input: string;
    output: string;
}>;
export declare const configsSchema: z.ZodArray<z.ZodIntersection<z.ZodObject<{
    input: z.ZodString;
    output: z.ZodString;
    skipValidation: z.ZodOptional<z.ZodBoolean>;
    maxRun: z.ZodOptional<z.ZodNumber>;
    nameFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodBoolean>>;
    jsDocTagFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string | undefined;
        name: string;
    }, {
        value?: string | undefined;
        name: string;
    }>, "many">], z.ZodUnknown>, z.ZodBoolean>>;
    getSchemaName: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodString>>;
    keepComments: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    skipParseJSDoc: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeTypeNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maybeOptional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeNullable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    input: string;
    output: string;
    skipParseJSDoc: boolean;
    keepComments: boolean;
    maybeOptional: boolean;
    maybeNullable: boolean;
}, {
    skipParseJSDoc?: boolean | undefined;
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    keepComments?: boolean | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    maybeOptional?: boolean | undefined;
    maybeNullable?: boolean | undefined;
    input: string;
    output: string;
}>, z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>>, "many">;
export declare const tsToZodConfigSchema: z.ZodUnion<[z.ZodObject<{
    input: z.ZodString;
    output: z.ZodString;
    skipValidation: z.ZodOptional<z.ZodBoolean>;
    maxRun: z.ZodOptional<z.ZodNumber>;
    nameFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodBoolean>>;
    jsDocTagFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string | undefined;
        name: string;
    }, {
        value?: string | undefined;
        name: string;
    }>, "many">], z.ZodUnknown>, z.ZodBoolean>>;
    getSchemaName: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodString>>;
    keepComments: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    skipParseJSDoc: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeTypeNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maybeOptional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeNullable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    input: string;
    output: string;
    skipParseJSDoc: boolean;
    keepComments: boolean;
    maybeOptional: boolean;
    maybeNullable: boolean;
}, {
    skipParseJSDoc?: boolean | undefined;
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    keepComments?: boolean | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    maybeOptional?: boolean | undefined;
    maybeNullable?: boolean | undefined;
    input: string;
    output: string;
}>, z.ZodArray<z.ZodIntersection<z.ZodObject<{
    input: z.ZodString;
    output: z.ZodString;
    skipValidation: z.ZodOptional<z.ZodBoolean>;
    maxRun: z.ZodOptional<z.ZodNumber>;
    nameFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodBoolean>>;
    jsDocTagFilter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string | undefined;
        name: string;
    }, {
        value?: string | undefined;
        name: string;
    }>, "many">], z.ZodUnknown>, z.ZodBoolean>>;
    getSchemaName: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodString], z.ZodUnknown>, z.ZodString>>;
    keepComments: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    skipParseJSDoc: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeTypeNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maybeOptional: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maybeNullable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    input: string;
    output: string;
    skipParseJSDoc: boolean;
    keepComments: boolean;
    maybeOptional: boolean;
    maybeNullable: boolean;
}, {
    skipParseJSDoc?: boolean | undefined;
    maxRun?: number | undefined;
    nameFilter?: ((args_0: string, ...args_1: unknown[]) => boolean) | undefined;
    jsDocTagFilter?: ((args_0: {
        value?: string | undefined;
        name: string;
    }[], ...args_1: unknown[]) => boolean) | undefined;
    getSchemaName?: ((args_0: string, ...args_1: unknown[]) => string) | undefined;
    keepComments?: boolean | undefined;
    skipValidation?: boolean | undefined;
    maybeTypeNames?: string[] | undefined;
    maybeOptional?: boolean | undefined;
    maybeNullable?: boolean | undefined;
    input: string;
    output: string;
}>, z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>>, "many">]>;
