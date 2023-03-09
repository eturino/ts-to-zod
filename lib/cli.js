"use strict";
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const errors_1 = require("@oclif/errors");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const slash_1 = (0, tslib_1.__importDefault)(require("slash"));
const typescript_1 = (0, tslib_1.__importDefault)(require("typescript"));
const generate_1 = require("./core/generate");
const config_zod_1 = require("./config.zod");
const getImportPath_1 = require("./utils/getImportPath");
const ora_1 = (0, tslib_1.__importDefault)(require("ora"));
const prettier_1 = (0, tslib_1.__importDefault)(require("prettier"));
const worker = (0, tslib_1.__importStar)(require("./worker"));
const inquirer_1 = (0, tslib_1.__importDefault)(require("inquirer"));
const async_1 = require("async");
const createConfig_1 = require("./createConfig");
const chokidar_1 = (0, tslib_1.__importDefault)(require("chokidar"));
// Try to load `ts-to-zod.config.js`
// We are doing this here to be able to infer the `flags` & `usage` in the cli help
const tsToZodConfigJs = "ts-to-zod.config.js";
const configPath = (0, path_1.join)(process.cwd(), tsToZodConfigJs);
let config;
let haveMultiConfig = false;
const configKeys = [];
try {
    if ((0, fs_extra_1.existsSync)(configPath)) {
        const rawConfig = require((0, slash_1.default)((0, path_1.relative)(__dirname, configPath)));
        config = config_zod_1.tsToZodConfigSchema.parse(rawConfig);
        if (Array.isArray(config)) {
            haveMultiConfig = true;
            configKeys.push(...config.map((c) => c.name));
        }
    }
}
catch (e) {
    if (e instanceof Error) {
        (0, errors_1.error)(`"${tsToZodConfigJs}" invalid:
  ${e.message}
  
  Please fix the invalid configuration
  You can generate a new config with --init`, { exit: false });
    }
    process.exit(2);
}
class TsToZod extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(TsToZod);
        if (flags.init) {
            (await (0, createConfig_1.createConfig)(configPath))
                ? this.log(`🧐 ts-to-zod.config.js created!`)
                : this.log(`Nothing changed!`);
            return;
        }
        const fileConfig = await this.loadFileConfig(config, flags);
        if (Array.isArray(fileConfig)) {
            if (args.input || args.output) {
                this.error(`INPUT and OUTPUT arguments are not compatible with --all`);
            }
            await (0, async_1.eachSeries)(fileConfig, async (config) => {
                this.log(`Generating "${config.name}"`);
                const result = await this.generate(args, config, flags);
                if (result.success) {
                    this.log(` 🎉 Zod schemas generated!`);
                }
                else {
                    this.error(result.error, { exit: false });
                }
                this.log(); // empty line between configs
            }).catch((e) => this.error(e, { exit: false }));
        }
        else {
            const result = await this.generate(args, fileConfig, flags);
            if (result.success) {
                this.log(`🎉 Zod schemas generated!`);
            }
            else {
                this.error(result.error);
            }
        }
        if (flags.watch) {
            const inputs = Array.isArray(fileConfig)
                ? fileConfig.map((i) => i.input)
                : (fileConfig === null || fileConfig === void 0 ? void 0 : fileConfig.input) || args.input;
            this.log("\nWatching for changes…");
            chokidar_1.default.watch(inputs).on("change", async (path) => {
                console.clear();
                this.log(`Changes detected in "${(0, slash_1.default)(path)}"`);
                const config = Array.isArray(fileConfig)
                    ? fileConfig.find((i) => i.input === (0, slash_1.default)(path))
                    : fileConfig;
                const result = await this.generate(args, config, flags);
                if (result.success) {
                    this.log(`🎉 Zod schemas generated!`);
                }
                else {
                    this.error(result.error);
                }
                this.log("\nWatching for changes…");
            });
        }
    }
    /**
     * Generate on zod schema file.
     * @param args
     * @param fileConfig
     * @param flags
     */
    async generate(args, fileConfig, flags) {
        const input = args.input || (fileConfig === null || fileConfig === void 0 ? void 0 : fileConfig.input);
        const output = args.output || (fileConfig === null || fileConfig === void 0 ? void 0 : fileConfig.output);
        if (!input) {
            return {
                success: false,
                error: `Missing 1 required arg:
${TsToZod.args[0].description}
See more help with --help`,
            };
        }
        const inputPath = (0, path_1.join)(process.cwd(), input);
        const outputPath = (0, path_1.join)(process.cwd(), output || input);
        // Check args/flags file extensions
        const extErrors = [];
        if (!hasExtensions(input, typescriptExtensions)) {
            extErrors.push({
                path: input,
                expectedExtensions: typescriptExtensions,
            });
        }
        if (output &&
            !hasExtensions(output, [...typescriptExtensions, ...javascriptExtensions])) {
            extErrors.push({
                path: output,
                expectedExtensions: [...typescriptExtensions, ...javascriptExtensions],
            });
        }
        if (extErrors.length) {
            return {
                success: false,
                error: `Unexpected file extension:\n${extErrors
                    .map(({ path, expectedExtensions }) => `"${path}" must be ${expectedExtensions
                    .map((i) => `"${i}"`)
                    .join(", ")}`)
                    .join("\n")}`,
            };
        }
        const sourceText = await (0, fs_extra_1.readFile)(inputPath, "utf-8");
        const generateOptions = this.extractGenerateOptions(sourceText, fileConfig, flags);
        const { errors, transformedSourceText, getZodSchemasFile, getIntegrationTestFile, hasCircularDependencies, } = (0, generate_1.generate)(generateOptions);
        if (hasCircularDependencies && !output) {
            return {
                success: false,
                error: "--output= must also be provided when input file have some circular dependencies",
            };
        }
        errors.map(this.warn);
        if (!flags.skipValidation) {
            const validatorSpinner = (0, ora_1.default)("Validating generated types").start();
            if (flags.all)
                validatorSpinner.indent = 1;
            const generationErrors = await worker.validateGeneratedTypesInWorker({
                sourceTypes: {
                    sourceText: transformedSourceText,
                    relativePath: "./source.ts",
                },
                integrationTests: {
                    sourceText: getIntegrationTestFile("./source", "./source.zod"),
                    relativePath: "./source.integration.ts",
                },
                zodSchemas: {
                    sourceText: getZodSchemasFile("./source"),
                    relativePath: "./source.zod.ts",
                },
                skipParseJSDoc: Boolean(generateOptions.skipParseJSDoc),
            });
            generationErrors.length
                ? validatorSpinner.fail()
                : validatorSpinner.succeed();
            if (generationErrors.length > 0) {
                return {
                    success: false,
                    error: generationErrors.join("\n"),
                };
            }
        }
        const zodSchemasFile = getZodSchemasFile((0, getImportPath_1.getImportPath)(outputPath, inputPath));
        const prettierConfig = await prettier_1.default.resolveConfig(process.cwd());
        if (output && hasExtensions(output, javascriptExtensions)) {
            await (0, fs_extra_1.outputFile)(outputPath, prettier_1.default.format(typescript_1.default.transpileModule(zodSchemasFile, {
                compilerOptions: {
                    target: typescript_1.default.ScriptTarget.Latest,
                    module: typescript_1.default.ModuleKind.ESNext,
                    newLine: typescript_1.default.NewLineKind.LineFeed,
                },
            }).outputText, Object.assign({ parser: "babel-ts" }, prettierConfig)));
        }
        else {
            await (0, fs_extra_1.outputFile)(outputPath, prettier_1.default.format(zodSchemasFile, Object.assign({ parser: "babel-ts" }, prettierConfig)));
        }
        return { success: true };
    }
    extractGenerateOptions(sourceText, givenFileConfig, flags) {
        const _a = givenFileConfig || {}, { maybeOptional, maybeNullable, maybeTypeNames } = _a, fileConfig = (0, tslib_1.__rest)(_a, ["maybeOptional", "maybeNullable", "maybeTypeNames"]);
        const maybeConfig = {
            optional: maybeOptional !== null && maybeOptional !== void 0 ? maybeOptional : true,
            nullable: maybeNullable !== null && maybeNullable !== void 0 ? maybeNullable : true,
            typeNames: new Set(maybeTypeNames !== null && maybeTypeNames !== void 0 ? maybeTypeNames : []),
        };
        if (typeof flags.maybeTypeName === "string" && flags.maybeTypeName) {
            maybeConfig.typeNames = new Set([flags.maybeTypeName]);
        }
        if (flags.maybeTypeName &&
            Array.isArray(flags.maybeTypeName) &&
            flags.maybeTypeName.length) {
            maybeConfig.typeNames = new Set(flags.maybeTypeName);
        }
        if (typeof flags.maybeOptional === "boolean") {
            maybeConfig.optional = flags.maybeOptional;
        }
        if (typeof flags.maybeNullable === "boolean") {
            maybeConfig.nullable = flags.maybeNullable;
        }
        const generateOptions = Object.assign({ sourceText,
            maybeConfig }, fileConfig);
        if (typeof flags.maxRun === "number") {
            generateOptions.maxRun = flags.maxRun;
        }
        if (typeof flags.keepComments === "boolean") {
            generateOptions.keepComments = flags.keepComments;
        }
        if (typeof flags.skipParseJSDoc === "boolean") {
            generateOptions.skipParseJSDoc = flags.skipParseJSDoc;
        }
        return generateOptions;
    }
    /**
     * Load user config from `ts-to-zod.config.js`
     */
    async loadFileConfig(config, flags) {
        if (!config) {
            return undefined;
        }
        if (Array.isArray(config)) {
            if (!flags.all && !flags.config) {
                const { mode } = await inquirer_1.default.prompt([
                    {
                        name: "mode",
                        message: `You have multiple configs available in "${tsToZodConfigJs}"\n What do you want?`,
                        type: "list",
                        choices: [
                            {
                                value: "multi",
                                name: `${TsToZod.flags.all.description} (--all)`,
                            },
                            ...configKeys.map((key) => ({
                                value: `single-${key}`,
                                name: `Execute "${key}" config (--config=${key})`,
                            })),
                            { value: "none", name: "Don't use the config" },
                        ],
                    },
                ]);
                if (mode.startsWith("single-")) {
                    flags.config = mode.slice("single-".length);
                }
                else if (mode === "multi") {
                    flags.all = true;
                }
            }
            if (flags.all) {
                return config;
            }
            if (flags.config) {
                const selectedConfig = config.find((c) => c.name === flags.config);
                if (!selectedConfig) {
                    this.error(`${flags.config} configuration not found!`);
                }
                return selectedConfig;
            }
            return undefined;
        }
        return Object.assign(Object.assign({}, config), { getSchemaName: config.getSchemaName
                ? config_zod_1.getSchemaNameSchema.implement(config.getSchemaName)
                : undefined, nameFilter: config.nameFilter
                ? config_zod_1.nameFilterSchema.implement(config.nameFilter)
                : undefined });
    }
}
TsToZod.description = "Generate Zod schemas from a Typescript file";
TsToZod.usage = haveMultiConfig
    ? [
        "--all",
        ...configKeys.map((key) => `--config ${key.includes(" ") ? `"${key}"` : key}`),
    ]
    : undefined;
TsToZod.flags = {
    version: command_1.flags.version({ char: "v" }),
    help: command_1.flags.help({ char: "h" }),
    maxRun: command_1.flags.integer({
        hidden: true,
        default: 10,
        description: "max iteration number to resolve the declaration order",
    }),
    keepComments: command_1.flags.boolean({
        char: "k",
        description: "Keep parameters comments",
    }),
    maybeOptional: command_1.flags.boolean({
        description: "treat Maybe<T> as optional (can be undefined). Can be combined with maybeNullable",
    }),
    maybeNullable: command_1.flags.boolean({
        description: "treat Maybe<T> as nullable (can be null). Can be combined with maybeOptional",
    }),
    maybeTypeName: command_1.flags.string({
        multiple: true,
        description: "determines the name of the types to treat as 'Maybe'. Can be multiple.",
    }),
    init: command_1.flags.boolean({
        char: "i",
        description: "Create a ts-to-zod.config.js file",
    }),
    skipParseJSDoc: command_1.flags.boolean({
        default: false,
        description: "Skip the creation of zod validators from JSDoc annotations",
    }),
    skipValidation: command_1.flags.boolean({
        default: false,
        description: "Skip the validation step (not recommended)",
    }),
    watch: command_1.flags.boolean({
        char: "w",
        default: false,
        description: "Watch input file(s) for changes and re-run related task",
    }),
    // -- Multi config flags --
    config: command_1.flags.enum({
        char: "c",
        options: configKeys,
        description: "Execute one config",
        hidden: !haveMultiConfig,
    }),
    all: command_1.flags.boolean({
        char: "a",
        default: false,
        description: "Execute all configs",
        hidden: !haveMultiConfig,
    }),
};
TsToZod.args = [
    { name: "input", description: "input file (typescript)" },
    {
        name: "output",
        description: "output file (zod schemas)",
    },
];
const typescriptExtensions = [".ts", ".tsx"];
const javascriptExtensions = [".js", ".jsx"];
/**
 * Validate if the file extension is ts or tsx.
 *
 * @param path relative path
 * @param extensions list of allowed extensions
 * @returns true if the extension is valid
 */
function hasExtensions(path, extensions) {
    const { ext } = (0, path_1.parse)(path);
    return extensions.includes(ext);
}
module.exports = TsToZod;
//# sourceMappingURL=cli.js.map