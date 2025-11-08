import { NuxtModule, ModuleDependencyMeta } from '@nuxt/schema'
declare module '@nuxt/schema' {
  interface ModuleDependencies {
    ["@nuxtjs/mdc"]?: ModuleDependencyMeta<typeof import("@nuxtjs/mdc").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
    ["@nuxt/content"]?: ModuleDependencyMeta<typeof import("@nuxt/content").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
    ["@nuxt/devtools"]?: ModuleDependencyMeta<typeof import("@nuxt/devtools").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
    ["@nuxt/telemetry"]?: ModuleDependencyMeta<typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
  }
  interface NuxtOptions {
    /**
     * Configuration for `@nuxtjs/mdc`
     */
    ["mdc"]: typeof import("@nuxtjs/mdc").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/content`
     */
    ["content"]: typeof import("@nuxt/content").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     */
    ["devtools"]: typeof import("@nuxt/devtools").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     */
    ["telemetry"]: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
  }
  interface NuxtConfig {
    /**
     * Configuration for `@nuxtjs/mdc`
     */
    ["mdc"]?: typeof import("@nuxtjs/mdc").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/content`
     */
    ["content"]?: typeof import("@nuxt/content").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     */
    ["devtools"]?: typeof import("@nuxt/devtools").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     */
    ["telemetry"]?: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    modules?: (undefined | null | false | NuxtModule<any> | string | [NuxtModule | string, Record<string, any>] | ["@nuxtjs/mdc", Exclude<NuxtConfig["mdc"], boolean>] | ["@nuxt/content", Exclude<NuxtConfig["content"], boolean>] | ["@nuxt/devtools", Exclude<NuxtConfig["devtools"], boolean>] | ["@nuxt/telemetry", Exclude<NuxtConfig["telemetry"], boolean>])[],
  }
}
declare module 'nuxt/schema' {
  interface ModuleDependencies {
    ["@nuxtjs/mdc"]?: ModuleDependencyMeta<typeof import("@nuxtjs/mdc").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
    ["@nuxt/content"]?: ModuleDependencyMeta<typeof import("@nuxt/content").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
    ["@nuxt/devtools"]?: ModuleDependencyMeta<typeof import("@nuxt/devtools").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
    ["@nuxt/telemetry"]?: ModuleDependencyMeta<typeof import("@nuxt/telemetry").default extends NuxtModule<infer O> ? O : Record<string, unknown>>
  }
  interface NuxtOptions {
    /**
     * Configuration for `@nuxtjs/mdc`
     * @see https://www.npmjs.com/package/@nuxtjs/mdc
     */
    ["mdc"]: typeof import("@nuxtjs/mdc").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/content`
     * @see https://www.npmjs.com/package/@nuxt/content
     */
    ["content"]: typeof import("@nuxt/content").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     * @see https://www.npmjs.com/package/@nuxt/devtools
     */
    ["devtools"]: typeof import("@nuxt/devtools").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     * @see https://www.npmjs.com/package/@nuxt/telemetry
     */
    ["telemetry"]: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? O : Record<string, any>
  }
  interface NuxtConfig {
    /**
     * Configuration for `@nuxtjs/mdc`
     * @see https://www.npmjs.com/package/@nuxtjs/mdc
     */
    ["mdc"]?: typeof import("@nuxtjs/mdc").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/content`
     * @see https://www.npmjs.com/package/@nuxt/content
     */
    ["content"]?: typeof import("@nuxt/content").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/devtools`
     * @see https://www.npmjs.com/package/@nuxt/devtools
     */
    ["devtools"]?: typeof import("@nuxt/devtools").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    /**
     * Configuration for `@nuxt/telemetry`
     * @see https://www.npmjs.com/package/@nuxt/telemetry
     */
    ["telemetry"]?: typeof import("@nuxt/telemetry").default extends NuxtModule<infer O, unknown, boolean> ? Partial<O> : Record<string, any>
    modules?: (undefined | null | false | NuxtModule<any> | string | [NuxtModule | string, Record<string, any>] | ["@nuxtjs/mdc", Exclude<NuxtConfig["mdc"], boolean>] | ["@nuxt/content", Exclude<NuxtConfig["content"], boolean>] | ["@nuxt/devtools", Exclude<NuxtConfig["devtools"], boolean>] | ["@nuxt/telemetry", Exclude<NuxtConfig["telemetry"], boolean>])[],
  }
}