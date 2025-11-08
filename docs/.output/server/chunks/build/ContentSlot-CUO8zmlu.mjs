import { f as flatUnwrap } from './node-yHY0X6Y7.mjs';
import { defineComponent, h, getCurrentInstance, useSlots, computed, useSSRContext } from 'vue';

const _sfc_main$1 = defineComponent({
  name: "MDCSlot",
  functional: true,
  props: {
    name: {
      type: String,
      default: "default"
    },
    /**
     * Tags to unwrap separated by spaces
     * Example: 'ul li'
     */
    unwrap: {
      type: [Boolean, String],
      default: false
    },
    /**
     * VNode to render
     * This is only useful for render functions
     */
    use: {
      type: Function,
      default: void 0
    }
  },
  setup(props) {
    const { parent } = getCurrentInstance();
    const { default: fallbackSlot } = useSlots();
    const tags = computed(() => {
      if (typeof props.unwrap === "string") {
        return props.unwrap.split(" ");
      }
      return ["*"];
    });
    return {
      fallbackSlot,
      tags,
      parent
    };
  },
  render({ use, unwrap, fallbackSlot, tags, parent }) {
    try {
      let slot = use;
      if (typeof use === "string") {
        slot = parent?.slots[use] || parent?.parent?.slots[use];
        console.warn(`Please set :use="$slots.${use}" in <MDCSlot> component to enable reactivity`);
      }
      if (!slot) {
        return fallbackSlot ? fallbackSlot() : h("div");
      }
      return unwrap ? flatUnwrap(slot(), tags) : [slot()];
    } catch {
      return h("div");
    }
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/.pnpm/@nuxtjs+mdc@0.9.5_magicast@0.5.1/node_modules/@nuxtjs/mdc/dist/runtime/components/MDCSlot.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = Object.assign(_sfc_main$1, { __name: "MDCSlot" });
const _sfc_main = defineComponent({
  props: {
    /**
     * A slot name or function
     */
    use: {
      type: Function,
      default: void 0
    },
    /**
     * Tags to unwrap separated by spaces
     * Example: 'ul li'
     */
    unwrap: {
      type: [Boolean, String],
      default: false
    }
  },
  render(props) {
    return h(__nuxt_component_0, props);
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/.pnpm/@nuxt+content@2.13.4_db0@0.3.4_ioredis@5.8.2_magicast@0.5.1_nuxt@4.2.1_@biomejs+biome@2_86c681ad1c4e268732d9ec20eccc9e77/node_modules/@nuxt/content/dist/runtime/components/ContentSlot.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ContentSlot = Object.assign(_sfc_main, { __name: "ContentSlot" });

export { ContentSlot as default };
//# sourceMappingURL=ContentSlot-CUO8zmlu.mjs.map
