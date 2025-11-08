import ContentSlot from './ContentSlot-CUO8zmlu.mjs';
import { defineComponent, getCurrentInstance, useSlots, computed, useSSRContext } from 'vue';
import './node-yHY0X6Y7.mjs';

const _sfc_main = defineComponent({
  name: "Markdown",
  extends: ContentSlot,
  setup(props) {
    const { parent } = getCurrentInstance();
    const { between, default: fallbackSlot } = useSlots();
    const tags = computed(() => {
      if (typeof props.unwrap === "string") {
        return props.unwrap.split(" ");
      }
      return ["*"];
    });
    return {
      fallbackSlot,
      tags,
      between,
      parent
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/.pnpm/@nuxt+content@2.13.4_db0@0.3.4_ioredis@5.8.2_magicast@0.5.1_nuxt@4.2.1_@biomejs+biome@2_86c681ad1c4e268732d9ec20eccc9e77/node_modules/@nuxt/content/dist/runtime/components/Markdown.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const Markdown = Object.assign(_sfc_main, { __name: "Markdown" });

export { Markdown as default };
//# sourceMappingURL=Markdown-5RC9F_Wd.mjs.map
