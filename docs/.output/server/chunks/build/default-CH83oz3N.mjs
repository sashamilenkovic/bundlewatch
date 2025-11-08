import { _ as __nuxt_component_0 } from './nuxt-link-CPVnD00a.mjs';
import { defineComponent, withAsyncContext, mergeProps, withCtx, createTextVNode, unref, createVNode, createBlock, createCommentVNode, toDisplayString, openBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { u as useAsyncData } from './asyncData-Vu3IovYn.mjs';
import { _ as _export_sfc, u as useRoute, f as fetchContentNavigation } from './server.mjs';
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
import 'perfect-debounce';
import 'vue-router';
import '../_/index.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: navigation } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("content-navigation", () => fetchContentNavigation())), __temp = await __temp, __restore(), __temp);
    const route = useRoute();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "layout" }, _attrs))} data-v-50edcd31><header class="layout__header" data-v-50edcd31><div class="brand" data-v-50edcd31><span aria-hidden="true" data-v-50edcd31>📦</span><div data-v-50edcd31><p class="brand__title" data-v-50edcd31>BundleWatch</p><p class="brand__subtitle" data-v-50edcd31>Docs &amp; Guides</p></div></div><nav class="header-nav" data-v-50edcd31>`);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/getting-started" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Getting Started`);
          } else {
            return [
              createTextVNode("Getting Started")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/storage" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Git Storage`);
          } else {
            return [
              createTextVNode("Git Storage")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<a href="https://github.com/sashamilenkovic/bundlewatch" target="_blank" rel="noreferrer" data-v-50edcd31>GitHub ↗</a></nav></header><div class="layout__body" data-v-50edcd31><aside class="sidebar" data-v-50edcd31><p class="sidebar__label" data-v-50edcd31>Documentation</p><ul class="sidebar__list" data-v-50edcd31><!--[-->`);
      ssrRenderList(unref(navigation), (section) => {
        _push(`<li data-v-50edcd31>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: section._path,
          class: ["sidebar__link", { "is-active": unref(route).path === section._path }]
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div data-v-50edcd31${_scopeId}><p class="sidebar__title" data-v-50edcd31${_scopeId}>${ssrInterpolate(section.title)}</p>`);
              if (section.description) {
                _push2(`<p class="sidebar__description" data-v-50edcd31${_scopeId}>${ssrInterpolate(section.description)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              return [
                createVNode("div", null, [
                  createVNode("p", { class: "sidebar__title" }, toDisplayString(section.title), 1),
                  section.description ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "sidebar__description"
                  }, toDisplayString(section.description), 1)) : createCommentVNode("", true)
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></aside><main class="content" data-v-50edcd31>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-50edcd31"]]);

export { _default as default };
//# sourceMappingURL=default-CH83oz3N.mjs.map
