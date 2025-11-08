import __nuxt_component_0 from './ContentDoc-CU7CTSiN.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-CPVnD00a.mjs';
import { defineComponent, mergeProps, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { _ as _export_sfc, u as useRoute } from './server.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[...slug]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ContentDoc = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "prose" }, _attrs))} data-v-c6560ae6>`);
      _push(ssrRenderComponent(_component_ContentDoc, {
        path: unref(route).path
      }, {
        "not-found": withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="not-found" data-v-c6560ae6${_scopeId}><h1 data-v-c6560ae6${_scopeId}>Document not found</h1><p data-v-c6560ae6${_scopeId}> We couldn&#39;t find that page. Try another link from the sidebar or `);
            _push2(ssrRenderComponent(_component_NuxtLink, { to: "/" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`return to the docs home`);
                } else {
                  return [
                    createTextVNode("return to the docs home")
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(`. </p></div>`);
          } else {
            return [
              createVNode("div", { class: "not-found" }, [
                createVNode("h1", null, "Document not found"),
                createVNode("p", null, [
                  createTextVNode(" We couldn't find that page. Try another link from the sidebar or "),
                  createVNode(_component_NuxtLink, { to: "/" }, {
                    default: withCtx(() => [
                      createTextVNode("return to the docs home")
                    ]),
                    _: 1
                  }),
                  createTextVNode(". ")
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/[...slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ____slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c6560ae6"]]);

export { ____slug_ as default };
//# sourceMappingURL=_...slug_-Cy9ivXwh.mjs.map
