import __nuxt_component_0 from './ContentRendererMarkdown-CU-jsCL-.mjs';
import { defineComponent, useSlots, h, watch, useSSRContext } from 'vue';
import '../nitro/nitro.mjs';
import 'unified';
import 'remark-parse';
import 'remark-rehype';
import 'remark-mdc';
import 'remark-gfm';
import 'rehype-external-links';
import 'rehype-sort-attribute-values';
import 'rehype-sort-attributes';
import 'rehype-raw';
import 'detab';
import 'micromark-util-sanitize-uri';
import 'hast-util-to-string';
import 'github-slugger';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import './node-yHY0X6Y7.mjs';
import 'vue/server-renderer';
import './server.mjs';
import 'vue-router';
import '../_/index.mjs';

const _sfc_main = defineComponent({
  name: "ContentRenderer",
  props: {
    /**
     * The document to render.
     */
    value: {
      type: Object,
      required: false,
      default: () => ({})
    },
    /**
     * Whether or not to render the excerpt.
     * @default false
     */
    excerpt: {
      type: Boolean,
      default: false
    },
    /**
     * The tag to use for the renderer element if it is used.
     * @default 'div'
     */
    tag: {
      type: String,
      default: "div"
    }
  },
  setup(props) {
    watch(
      () => props.excerpt,
      (newExcerpt) => {
        if (newExcerpt && !props.value?.excerpt) {
          console.warn(`No excerpt found for document content/${props?.value?._path}.${props?.value?._extension}!`);
          console.warn("Make sure to use <!--more--> in your content if you want to use excerpt feature.");
        }
      },
      {
        immediate: true
      }
    );
  },
  /**
   * Content empty fallback
   * @slot empty
   */
  render(ctx) {
    const slots = useSlots();
    const { value, excerpt, tag } = ctx;
    const markdownAST = excerpt ? value?.excerpt : value?.body;
    if (!markdownAST?.children?.length && slots?.empty) {
      return slots.empty({ value, excerpt, tag, ...this.$attrs });
    }
    if (slots?.default) {
      return slots.default({ value, excerpt, tag, ...this.$attrs });
    }
    if (markdownAST?.type === "root" && markdownAST?.children?.length) {
      return h(
        __nuxt_component_0,
        {
          value,
          excerpt,
          tag,
          ...this.$attrs
        }
      );
    }
    return h(
      "pre",
      null,
      JSON.stringify({ message: "You should use slots with <ContentRenderer>", value, excerpt, tag }, null, 2)
    );
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/.pnpm/@nuxt+content@2.13.4_db0@0.3.4_ioredis@5.8.2_magicast@0.5.1_nuxt@4.2.1_@biomejs+biome@2_86c681ad1c4e268732d9ec20eccc9e77/node_modules/@nuxt/content/dist/runtime/components/ContentRenderer.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main, { __name: "ContentRenderer" });

export { __nuxt_component_1 as default };
//# sourceMappingURL=ContentRenderer-CMttcdjA.mjs.map
