import __nuxt_component_0 from './ContentDoc-CU7CTSiN.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-CPVnD00a.mjs';
import { mergeProps, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';
import './ContentQuery-BoZSPwK0.mjs';
import '../_/index.mjs';
import './asyncData-Vu3IovYn.mjs';
import 'perfect-debounce';
import './ContentRenderer-CMttcdjA.mjs';
import './ContentRendererMarkdown-CU-jsCL-.mjs';
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
import './composables-Cgss-3Aw.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_ContentDoc = __nuxt_component_0;
  const _component_NuxtLink = __nuxt_component_0$1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "prose" }, _attrs))} data-v-4b536976>`);
  _push(ssrRenderComponent(_component_ContentDoc, { path: "/" }, {
    "not-found": withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`<div class="not-found" data-v-4b536976${_scopeId}><h1 data-v-4b536976${_scopeId}>Document not found</h1><p data-v-4b536976${_scopeId}> The requested page is missing. Head back to `);
        _push2(ssrRenderComponent(_component_NuxtLink, { to: "/" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(`the docs home`);
            } else {
              return [
                createTextVNode("the docs home")
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(` or pick another topic from the sidebar. </p></div>`);
      } else {
        return [
          createVNode("div", { class: "not-found" }, [
            createVNode("h1", null, "Document not found"),
            createVNode("p", null, [
              createTextVNode(" The requested page is missing. Head back to "),
              createVNode(_component_NuxtLink, { to: "/" }, {
                default: withCtx(() => [
                  createTextVNode("the docs home")
                ]),
                _: 1
              }),
              createTextVNode(" or pick another topic from the sidebar. ")
            ])
          ])
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-4b536976"]]);

export { index as default };
//# sourceMappingURL=index-DyxCx0KJ.mjs.map
