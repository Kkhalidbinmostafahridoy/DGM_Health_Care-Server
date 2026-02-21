declare module "dotenv" {
  export function config(options?: { path?: string }): void;
  const _default: { config: typeof config };
  export default _default;
}

declare module "path" {
  export function join(...paths: Array<string>): string;
}

declare module "process" {
  interface ProcessEnv {
    NODE_ENV?: string;
    PORT?: string;
    DATABASE_URL?: string;
    [key: string]: string | undefined;
  }
  export var env: ProcessEnv;
  export function cwd(): string;
}

declare var process: any;

declare module "@prisma/client" {
  export class PrismaClient {
    constructor(arg?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
  }
  export const Prisma: any;
}
