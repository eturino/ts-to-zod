import { Command, flags } from "@oclif/command";
import { OutputFlags } from "@oclif/parser";
import { TsToZodConfig, Config } from "./config";
declare class TsToZod extends Command {
    static description: string;
    static usage: string[] | undefined;
    static flags: {
        version: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        maxRun: import("@oclif/parser/lib/flags").IOptionFlag<number>;
        keepComments: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        maybeOptional: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        maybeNullable: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        maybeTypeName: flags.IOptionFlag<string[]>;
        init: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        skipParseJSDoc: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        skipValidation: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        watch: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        config: flags.IOptionFlag<string>;
        all: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
    };
    static args: {
        name: string;
        description: string;
    }[];
    run(): Promise<void>;
    /**
     * Generate on zod schema file.
     * @param args
     * @param fileConfig
     * @param flags
     */
    generate(args: {
        input?: string;
        output?: string;
    }, fileConfig: Config | undefined, flags: OutputFlags<typeof TsToZod.flags>): Promise<{
        success: true;
    } | {
        success: false;
        error: string;
    }>;
    private extractGenerateOptions;
    /**
     * Load user config from `ts-to-zod.config.js`
     */
    loadFileConfig(config: TsToZodConfig | undefined, flags: OutputFlags<typeof TsToZod.flags>): Promise<TsToZodConfig | undefined>;
}
export = TsToZod;