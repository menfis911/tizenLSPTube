# Third-party notices

## LSPTube 0.4.0 additions

- Yandex protocol and generated protobuf definitions: FOSWLY/vot.js 3.2.1, Toil and contributors, commit `9f7220c4af4df92f0df39805a1a47cc52d0323f2`, MIT. See [MIT license](licenses/vot.js-MIT.txt) and [source provenance](src/vot/vendor/README.md). The transport and playback integration are LSPTube modifications.
- Bundled protobuf wire runtime: @bufbuild/protobuf 2.10.0, Buf Technologies and Google, Apache-2.0 AND BSD-3-Clause. See [Apache license](licenses/bufbuild-protobuf-Apache-2.0.txt) and [Google BSD notice](licenses/bufbuild-protobuf-Google-BSD-3-Clause.txt). Original copyright comments remain in the bundle.
- Build-only esbuild 0.25.12, Evan Wallace, MIT: [license](licenses/esbuild-0.25.12-MIT.md).
- The locally built enhancements use the original TizenTube mods sources under GPL-3.0-only. Their dependency versions are pinned in `src/mods/package-lock.json`; original notices below remain preserved. Build-tool updates do not update the historical network-service bundle.

## Preserved upstream notices

LSPTube is derived from TizenTube v2.1.1, copyright Reis Can and contributors, distributed under GPL-3.0-only. Original source and notices are preserved in upstream/. New LSPTube code and artwork are distributed under GPL-3.0-only.

The application bundles third-party dependencies under their respective licenses. This inventory includes the exact release-locked standalone dependencies and the preserved DIAL source dependency tree. The historical DIAL bundle may use other versions; its original source and notices are retained. See docs/DEVELOPMENT.md for the reproducibility boundary.

| Component | License declared upstream | Original notices |
|---|---|---|
| @patrickkfkan/peer-dial@0.1.2 | UNSPECIFIED | [_patrickkfkan_peer-dial_0.1.2-LICENSE](licenses/_patrickkfkan_peer-dial_0.1.2-LICENSE), [_patrickkfkan_peer-dial_0.1.2-package.json](licenses/_patrickkfkan_peer-dial_0.1.2-package.json) |
| @patrickkfkan/peer-ssdp@0.1.0 | UNSPECIFIED | [_patrickkfkan_peer-ssdp_0.1.0-LICENSE](licenses/_patrickkfkan_peer-ssdp_0.1.0-LICENSE), [_patrickkfkan_peer-ssdp_0.1.0-package.json](licenses/_patrickkfkan_peer-ssdp_0.1.0-package.json) |
| accepts@1.3.8 | MIT | [accepts_1.3.8-LICENSE](licenses/accepts_1.3.8-LICENSE), [accepts_1.3.8-package.json](licenses/accepts_1.3.8-package.json) |
| adbhost@0.0.2 | MIT | [adbhost_0.0.2-LICENSE](licenses/adbhost_0.0.2-LICENSE), [adbhost_0.0.2-package.json](licenses/adbhost_0.0.2-package.json) |
| ansi-styles@4.3.0 | MIT | [ansi-styles_4.3.0-license](licenses/ansi-styles_4.3.0-license), [ansi-styles_4.3.0-package.json](licenses/ansi-styles_4.3.0-package.json) |
| array-flatten@1.1.1 | MIT | [array-flatten_1.1.1-LICENSE](licenses/array-flatten_1.1.1-LICENSE), [array-flatten_1.1.1-package.json](licenses/array-flatten_1.1.1-package.json) |
| async-limiter@1.0.1 | MIT | [async-limiter_1.0.1-LICENSE](licenses/async-limiter_1.0.1-LICENSE), [async-limiter_1.0.1-package.json](licenses/async-limiter_1.0.1-package.json) |
| async@3.2.5 | MIT | [async_3.2.5-LICENSE](licenses/async_3.2.5-LICENSE), [async_3.2.5-package.json](licenses/async_3.2.5-package.json) |
| balanced-match@1.0.2 | MIT | [balanced-match_1.0.2-LICENSE.md](licenses/balanced-match_1.0.2-LICENSE.md), [balanced-match_1.0.2-package.json](licenses/balanced-match_1.0.2-package.json) |
| body-parser@1.20.2 | MIT | [body-parser_1.20.2-LICENSE](licenses/body-parser_1.20.2-LICENSE), [body-parser_1.20.2-package.json](licenses/body-parser_1.20.2-package.json) |
| body-parser@1.20.8 | MIT | [body-parser_1.20.8-LICENSE](licenses/body-parser_1.20.8-LICENSE), [body-parser_1.20.8-package.json](licenses/body-parser_1.20.8-package.json) |
| brace-expansion@1.1.11 | MIT | [brace-expansion_1.1.11-LICENSE](licenses/brace-expansion_1.1.11-LICENSE), [brace-expansion_1.1.11-package.json](licenses/brace-expansion_1.1.11-package.json) |
| brace-expansion@2.0.1 | MIT | [brace-expansion_2.0.1-LICENSE](licenses/brace-expansion_2.0.1-LICENSE), [brace-expansion_2.0.1-package.json](licenses/brace-expansion_2.0.1-package.json) |
| bytes@3.1.2 | MIT | [bytes_3.1.2-LICENSE](licenses/bytes_3.1.2-LICENSE), [bytes_3.1.2-package.json](licenses/bytes_3.1.2-package.json) |
| call-bind-apply-helpers@1.0.2 | MIT | [call-bind-apply-helpers_1.0.2-LICENSE](licenses/call-bind-apply-helpers_1.0.2-LICENSE), [call-bind-apply-helpers_1.0.2-package.json](licenses/call-bind-apply-helpers_1.0.2-package.json) |
| call-bind@1.0.7 | MIT | [call-bind_1.0.7-LICENSE](licenses/call-bind_1.0.7-LICENSE), [call-bind_1.0.7-package.json](licenses/call-bind_1.0.7-package.json) |
| call-bound@1.0.4 | MIT | [call-bound_1.0.4-LICENSE](licenses/call-bound_1.0.4-LICENSE), [call-bound_1.0.4-package.json](licenses/call-bound_1.0.4-package.json) |
| chalk@4.1.2 | MIT | [chalk_4.1.2-license](licenses/chalk_4.1.2-license), [chalk_4.1.2-package.json](licenses/chalk_4.1.2-package.json) |
| chrome-remote-interface@0.25.7 | MIT | [chrome-remote-interface_0.25.7-LICENSE](licenses/chrome-remote-interface_0.25.7-LICENSE), [chrome-remote-interface_0.25.7-package.json](licenses/chrome-remote-interface_0.25.7-package.json) |
| color-convert@2.0.1 | MIT | [color-convert_2.0.1-LICENSE](licenses/color-convert_2.0.1-LICENSE), [color-convert_2.0.1-package.json](licenses/color-convert_2.0.1-package.json) |
| color-name@1.1.4 | MIT | [color-name_1.1.4-LICENSE](licenses/color-name_1.1.4-LICENSE), [color-name_1.1.4-package.json](licenses/color-name_1.1.4-package.json) |
| commander@2.11.0 | MIT | [commander_2.11.0-LICENSE](licenses/commander_2.11.0-LICENSE), [commander_2.11.0-package.json](licenses/commander_2.11.0-package.json) |
| concat-map@0.0.1 | MIT | [concat-map_0.0.1-LICENSE](licenses/concat-map_0.0.1-LICENSE), [concat-map_0.0.1-package.json](licenses/concat-map_0.0.1-package.json) |
| content-disposition@0.5.4 | MIT | [content-disposition_0.5.4-LICENSE](licenses/content-disposition_0.5.4-LICENSE), [content-disposition_0.5.4-package.json](licenses/content-disposition_0.5.4-package.json) |
| content-type@1.0.5 | MIT | [content-type_1.0.5-LICENSE](licenses/content-type_1.0.5-LICENSE), [content-type_1.0.5-package.json](licenses/content-type_1.0.5-package.json) |
| cookie-signature@1.0.6 | MIT | [cookie-signature_1.0.6-index.js](licenses/cookie-signature_1.0.6-index.js), [cookie-signature_1.0.6-Readme.md](licenses/cookie-signature_1.0.6-Readme.md), [cookie-signature_1.0.6-package.json](licenses/cookie-signature_1.0.6-package.json) |
| cookie-signature@1.0.7 | MIT | [cookie-signature_1.0.7-index.js](licenses/cookie-signature_1.0.7-index.js), [cookie-signature_1.0.7-Readme.md](licenses/cookie-signature_1.0.7-Readme.md), [cookie-signature_1.0.7-package.json](licenses/cookie-signature_1.0.7-package.json) |
| cookie@0.6.0 | MIT | [cookie_0.6.0-LICENSE](licenses/cookie_0.6.0-LICENSE), [cookie_0.6.0-package.json](licenses/cookie_0.6.0-package.json) |
| cookie@0.7.2 | MIT | [cookie_0.7.2-LICENSE](licenses/cookie_0.7.2-LICENSE), [cookie_0.7.2-package.json](licenses/cookie_0.7.2-package.json) |
| cors@2.8.5 | MIT | [cors_2.8.5-LICENSE](licenses/cors_2.8.5-LICENSE), [cors_2.8.5-package.json](licenses/cors_2.8.5-package.json) |
| debug@2.6.9 | MIT | [debug_2.6.9-LICENSE](licenses/debug_2.6.9-LICENSE), [debug_2.6.9-package.json](licenses/debug_2.6.9-package.json) |
| define-data-property@1.1.4 | MIT | [define-data-property_1.1.4-LICENSE](licenses/define-data-property_1.1.4-LICENSE), [define-data-property_1.1.4-package.json](licenses/define-data-property_1.1.4-package.json) |
| depd@2.0.0 | MIT | [depd_2.0.0-LICENSE](licenses/depd_2.0.0-LICENSE), [depd_2.0.0-package.json](licenses/depd_2.0.0-package.json) |
| destroy@1.2.0 | MIT | [destroy_1.2.0-LICENSE](licenses/destroy_1.2.0-LICENSE), [destroy_1.2.0-package.json](licenses/destroy_1.2.0-package.json) |
| dunder-proto@1.0.1 | MIT | [dunder-proto_1.0.1-LICENSE](licenses/dunder-proto_1.0.1-LICENSE), [dunder-proto_1.0.1-package.json](licenses/dunder-proto_1.0.1-package.json) |
| ee-first@1.1.1 | MIT | [ee-first_1.1.1-LICENSE](licenses/ee-first_1.1.1-LICENSE), [ee-first_1.1.1-package.json](licenses/ee-first_1.1.1-package.json) |
| ejs@3.1.10 | Apache-2.0 | [ejs_3.1.10-LICENSE](licenses/ejs_3.1.10-LICENSE), [ejs_3.1.10-package.json](licenses/ejs_3.1.10-package.json), [Apache-2.0.txt](licenses/Apache-2.0.txt) |
| encodeurl@1.0.2 | MIT | [encodeurl_1.0.2-LICENSE](licenses/encodeurl_1.0.2-LICENSE), [encodeurl_1.0.2-package.json](licenses/encodeurl_1.0.2-package.json) |
| encodeurl@2.0.0 | MIT | [encodeurl_2.0.0-LICENSE](licenses/encodeurl_2.0.0-LICENSE), [encodeurl_2.0.0-package.json](licenses/encodeurl_2.0.0-package.json) |
| es-define-property@1.0.0 | MIT | [es-define-property_1.0.0-LICENSE](licenses/es-define-property_1.0.0-LICENSE), [es-define-property_1.0.0-package.json](licenses/es-define-property_1.0.0-package.json) |
| es-define-property@1.0.1 | MIT | [es-define-property_1.0.1-LICENSE](licenses/es-define-property_1.0.1-LICENSE), [es-define-property_1.0.1-package.json](licenses/es-define-property_1.0.1-package.json) |
| es-errors@1.3.0 | MIT | [es-errors_1.3.0-LICENSE](licenses/es-errors_1.3.0-LICENSE), [es-errors_1.3.0-package.json](licenses/es-errors_1.3.0-package.json) |
| es-object-atoms@1.1.2 | MIT | [es-object-atoms_1.1.2-LICENSE](licenses/es-object-atoms_1.1.2-LICENSE), [es-object-atoms_1.1.2-package.json](licenses/es-object-atoms_1.1.2-package.json) |
| escape-html@1.0.3 | MIT | [escape-html_1.0.3-LICENSE](licenses/escape-html_1.0.3-LICENSE), [escape-html_1.0.3-package.json](licenses/escape-html_1.0.3-package.json) |
| etag@1.8.1 | MIT | [etag_1.8.1-LICENSE](licenses/etag_1.8.1-LICENSE), [etag_1.8.1-package.json](licenses/etag_1.8.1-package.json) |
| express@4.19.2 | MIT | [express_4.19.2-LICENSE](licenses/express_4.19.2-LICENSE), [express_4.19.2-package.json](licenses/express_4.19.2-package.json) |
| express@4.22.2 | MIT | [express_4.22.2-LICENSE](licenses/express_4.22.2-LICENSE), [express_4.22.2-package.json](licenses/express_4.22.2-package.json) |
| filelist@1.0.4 | Apache-2.0 | [filelist_1.0.4-index.js](licenses/filelist_1.0.4-index.js), [filelist_1.0.4-README.md](licenses/filelist_1.0.4-README.md), [filelist_1.0.4-package.json](licenses/filelist_1.0.4-package.json), [Apache-2.0.txt](licenses/Apache-2.0.txt) |
| finalhandler@1.2.0 | MIT | [finalhandler_1.2.0-LICENSE](licenses/finalhandler_1.2.0-LICENSE), [finalhandler_1.2.0-package.json](licenses/finalhandler_1.2.0-package.json) |
| finalhandler@1.3.2 | MIT | [finalhandler_1.3.2-LICENSE](licenses/finalhandler_1.3.2-LICENSE), [finalhandler_1.3.2-package.json](licenses/finalhandler_1.3.2-package.json) |
| forwarded@0.2.0 | MIT | [forwarded_0.2.0-LICENSE](licenses/forwarded_0.2.0-LICENSE), [forwarded_0.2.0-package.json](licenses/forwarded_0.2.0-package.json) |
| fresh@0.5.2 | MIT | [fresh_0.5.2-LICENSE](licenses/fresh_0.5.2-LICENSE), [fresh_0.5.2-package.json](licenses/fresh_0.5.2-package.json) |
| function-bind@1.1.2 | MIT | [function-bind_1.1.2-LICENSE](licenses/function-bind_1.1.2-LICENSE), [function-bind_1.1.2-package.json](licenses/function-bind_1.1.2-package.json) |
| gate@0.3.0 | UNSPECIFIED | [gate_0.3.0-LICENSE](licenses/gate_0.3.0-LICENSE), [gate_0.3.0-package.json](licenses/gate_0.3.0-package.json) |
| get-intrinsic@1.2.4 | MIT | [get-intrinsic_1.2.4-LICENSE](licenses/get-intrinsic_1.2.4-LICENSE), [get-intrinsic_1.2.4-package.json](licenses/get-intrinsic_1.2.4-package.json) |
| get-intrinsic@1.3.0 | MIT | [get-intrinsic_1.3.0-LICENSE](licenses/get-intrinsic_1.3.0-LICENSE), [get-intrinsic_1.3.0-package.json](licenses/get-intrinsic_1.3.0-package.json) |
| get-proto@1.0.1 | MIT | [get-proto_1.0.1-LICENSE](licenses/get-proto_1.0.1-LICENSE), [get-proto_1.0.1-package.json](licenses/get-proto_1.0.1-package.json) |
| gopd@1.0.1 | MIT | [gopd_1.0.1-LICENSE](licenses/gopd_1.0.1-LICENSE), [gopd_1.0.1-package.json](licenses/gopd_1.0.1-package.json) |
| gopd@1.2.0 | MIT | [gopd_1.2.0-LICENSE](licenses/gopd_1.2.0-LICENSE), [gopd_1.2.0-package.json](licenses/gopd_1.2.0-package.json) |
| has-flag@4.0.0 | MIT | [has-flag_4.0.0-license](licenses/has-flag_4.0.0-license), [has-flag_4.0.0-package.json](licenses/has-flag_4.0.0-package.json) |
| has-property-descriptors@1.0.2 | MIT | [has-property-descriptors_1.0.2-LICENSE](licenses/has-property-descriptors_1.0.2-LICENSE), [has-property-descriptors_1.0.2-package.json](licenses/has-property-descriptors_1.0.2-package.json) |
| has-proto@1.0.3 | MIT | [has-proto_1.0.3-LICENSE](licenses/has-proto_1.0.3-LICENSE), [has-proto_1.0.3-package.json](licenses/has-proto_1.0.3-package.json) |
| has-symbols@1.0.3 | MIT | [has-symbols_1.0.3-LICENSE](licenses/has-symbols_1.0.3-LICENSE), [has-symbols_1.0.3-package.json](licenses/has-symbols_1.0.3-package.json) |
| has-symbols@1.1.0 | MIT | [has-symbols_1.1.0-LICENSE](licenses/has-symbols_1.1.0-LICENSE), [has-symbols_1.1.0-package.json](licenses/has-symbols_1.1.0-package.json) |
| hasown@2.0.2 | MIT | [hasown_2.0.2-LICENSE](licenses/hasown_2.0.2-LICENSE), [hasown_2.0.2-package.json](licenses/hasown_2.0.2-package.json) |
| hasown@2.0.4 | MIT | [hasown_2.0.4-LICENSE](licenses/hasown_2.0.4-LICENSE), [hasown_2.0.4-package.json](licenses/hasown_2.0.4-package.json) |
| http-errors@2.0.0 | MIT | [http-errors_2.0.0-LICENSE](licenses/http-errors_2.0.0-LICENSE), [http-errors_2.0.0-package.json](licenses/http-errors_2.0.0-package.json) |
| http-errors@2.0.1 | MIT | [http-errors_2.0.1-LICENSE](licenses/http-errors_2.0.1-LICENSE), [http-errors_2.0.1-package.json](licenses/http-errors_2.0.1-package.json) |
| iconv-lite@0.4.24 | MIT | [iconv-lite_0.4.24-LICENSE](licenses/iconv-lite_0.4.24-LICENSE), [iconv-lite_0.4.24-package.json](licenses/iconv-lite_0.4.24-package.json) |
| inherits@2.0.4 | ISC | [inherits_2.0.4-LICENSE](licenses/inherits_2.0.4-LICENSE), [inherits_2.0.4-package.json](licenses/inherits_2.0.4-package.json) |
| ipaddr.js@1.9.1 | MIT | [ipaddr.js_1.9.1-LICENSE](licenses/ipaddr.js_1.9.1-LICENSE), [ipaddr.js_1.9.1-package.json](licenses/ipaddr.js_1.9.1-package.json) |
| jake@10.9.1 | Apache-2.0 | [jake_10.9.1-README.md](licenses/jake_10.9.1-README.md), [jake_10.9.1-package.json](licenses/jake_10.9.1-package.json), [Apache-2.0.txt](licenses/Apache-2.0.txt) |
| math-intrinsics@1.1.0 | MIT | [math-intrinsics_1.1.0-LICENSE](licenses/math-intrinsics_1.1.0-LICENSE), [math-intrinsics_1.1.0-package.json](licenses/math-intrinsics_1.1.0-package.json) |
| media-typer@0.3.0 | MIT | [media-typer_0.3.0-LICENSE](licenses/media-typer_0.3.0-LICENSE), [media-typer_0.3.0-package.json](licenses/media-typer_0.3.0-package.json) |
| merge-descriptors@1.0.1 | MIT | [merge-descriptors_1.0.1-LICENSE](licenses/merge-descriptors_1.0.1-LICENSE), [merge-descriptors_1.0.1-package.json](licenses/merge-descriptors_1.0.1-package.json) |
| merge-descriptors@1.0.3 | MIT | [merge-descriptors_1.0.3-LICENSE](licenses/merge-descriptors_1.0.3-LICENSE), [merge-descriptors_1.0.3-package.json](licenses/merge-descriptors_1.0.3-package.json) |
| methods@1.1.2 | MIT | [methods_1.1.2-LICENSE](licenses/methods_1.1.2-LICENSE), [methods_1.1.2-package.json](licenses/methods_1.1.2-package.json) |
| mime-db@1.52.0 | MIT | [mime-db_1.52.0-LICENSE](licenses/mime-db_1.52.0-LICENSE), [mime-db_1.52.0-package.json](licenses/mime-db_1.52.0-package.json) |
| mime-types@2.1.35 | MIT | [mime-types_2.1.35-LICENSE](licenses/mime-types_2.1.35-LICENSE), [mime-types_2.1.35-package.json](licenses/mime-types_2.1.35-package.json) |
| mime@1.6.0 | MIT | [mime_1.6.0-LICENSE](licenses/mime_1.6.0-LICENSE), [mime_1.6.0-package.json](licenses/mime_1.6.0-package.json) |
| minimatch@3.1.2 | ISC | [minimatch_3.1.2-LICENSE](licenses/minimatch_3.1.2-LICENSE), [minimatch_3.1.2-package.json](licenses/minimatch_3.1.2-package.json) |
| minimatch@5.1.6 | ISC | [minimatch_5.1.6-LICENSE](licenses/minimatch_5.1.6-LICENSE), [minimatch_5.1.6-package.json](licenses/minimatch_5.1.6-package.json) |
| ms@2.0.0 | MIT | [ms_2.0.0-license.md](licenses/ms_2.0.0-license.md), [ms_2.0.0-package.json](licenses/ms_2.0.0-package.json) |
| ms@2.1.3 | MIT | [ms_2.1.3-license.md](licenses/ms_2.1.3-license.md), [ms_2.1.3-package.json](licenses/ms_2.1.3-package.json) |
| negotiator@0.6.3 | MIT | [negotiator_0.6.3-LICENSE](licenses/negotiator_0.6.3-LICENSE), [negotiator_0.6.3-package.json](licenses/negotiator_0.6.3-package.json) |
| node-fetch@2.7.0 | MIT | [node-fetch_2.7.0-LICENSE.md](licenses/node-fetch_2.7.0-LICENSE.md), [node-fetch_2.7.0-package.json](licenses/node-fetch_2.7.0-package.json) |
| node-forge@1.4.0 | (BSD-3-Clause OR GPL-2.0) | [node-forge_1.4.0-LICENSE](licenses/node-forge_1.4.0-LICENSE), [node-forge_1.4.0-package.json](licenses/node-forge_1.4.0-package.json) |
| object-assign@4.1.1 | MIT | [object-assign_4.1.1-license](licenses/object-assign_4.1.1-license), [object-assign_4.1.1-package.json](licenses/object-assign_4.1.1-package.json) |
| object-inspect@1.13.2 | MIT | [object-inspect_1.13.2-LICENSE](licenses/object-inspect_1.13.2-LICENSE), [object-inspect_1.13.2-package.json](licenses/object-inspect_1.13.2-package.json) |
| object-inspect@1.13.4 | MIT | [object-inspect_1.13.4-LICENSE](licenses/object-inspect_1.13.4-LICENSE), [object-inspect_1.13.4-package.json](licenses/object-inspect_1.13.4-package.json) |
| on-finished@2.4.1 | MIT | [on-finished_2.4.1-LICENSE](licenses/on-finished_2.4.1-LICENSE), [on-finished_2.4.1-package.json](licenses/on-finished_2.4.1-package.json) |
| parseurl@1.3.3 | MIT | [parseurl_1.3.3-LICENSE](licenses/parseurl_1.3.3-LICENSE), [parseurl_1.3.3-package.json](licenses/parseurl_1.3.3-package.json) |
| path-to-regexp@0.1.13 | MIT | [path-to-regexp_0.1.13-LICENSE](licenses/path-to-regexp_0.1.13-LICENSE), [path-to-regexp_0.1.13-package.json](licenses/path-to-regexp_0.1.13-package.json) |
| path-to-regexp@0.1.7 | MIT | [path-to-regexp_0.1.7-LICENSE](licenses/path-to-regexp_0.1.7-LICENSE), [path-to-regexp_0.1.7-package.json](licenses/path-to-regexp_0.1.7-package.json) |
| proxy-addr@2.0.7 | MIT | [proxy-addr_2.0.7-LICENSE](licenses/proxy-addr_2.0.7-LICENSE), [proxy-addr_2.0.7-package.json](licenses/proxy-addr_2.0.7-package.json) |
| qs@6.11.0 | BSD-3-Clause | [qs_6.11.0-LICENSE.md](licenses/qs_6.11.0-LICENSE.md), [qs_6.11.0-package.json](licenses/qs_6.11.0-package.json) |
| qs@6.15.3 | BSD-3-Clause | [qs_6.15.3-LICENSE.md](licenses/qs_6.15.3-LICENSE.md), [qs_6.15.3-package.json](licenses/qs_6.15.3-package.json) |
| qs@6.16.0 | BSD-3-Clause | [qs_6.16.0-LICENSE.md](licenses/qs_6.16.0-LICENSE.md), [qs_6.16.0-package.json](licenses/qs_6.16.0-package.json) |
| range-parser@1.2.1 | MIT | [range-parser_1.2.1-LICENSE](licenses/range-parser_1.2.1-LICENSE), [range-parser_1.2.1-package.json](licenses/range-parser_1.2.1-package.json) |
| raw-body@2.5.2 | MIT | [raw-body_2.5.2-LICENSE](licenses/raw-body_2.5.2-LICENSE), [raw-body_2.5.2-package.json](licenses/raw-body_2.5.2-package.json) |
| raw-body@2.5.3 | MIT | [raw-body_2.5.3-LICENSE](licenses/raw-body_2.5.3-LICENSE), [raw-body_2.5.3-package.json](licenses/raw-body_2.5.3-package.json) |
| safe-buffer@5.1.2 | MIT | [safe-buffer_5.1.2-LICENSE](licenses/safe-buffer_5.1.2-LICENSE), [safe-buffer_5.1.2-package.json](licenses/safe-buffer_5.1.2-package.json) |
| safe-buffer@5.2.1 | MIT | [safe-buffer_5.2.1-LICENSE](licenses/safe-buffer_5.2.1-LICENSE), [safe-buffer_5.2.1-package.json](licenses/safe-buffer_5.2.1-package.json) |
| safer-buffer@2.1.2 | MIT | [safer-buffer_2.1.2-LICENSE](licenses/safer-buffer_2.1.2-LICENSE), [safer-buffer_2.1.2-package.json](licenses/safer-buffer_2.1.2-package.json) |
| sax@1.4.1 | ISC | [sax_1.4.1-LICENSE](licenses/sax_1.4.1-LICENSE), [sax_1.4.1-package.json](licenses/sax_1.4.1-package.json) |
| send@0.18.0 | MIT | [send_0.18.0-LICENSE](licenses/send_0.18.0-LICENSE), [send_0.18.0-package.json](licenses/send_0.18.0-package.json) |
| send@0.19.2 | MIT | [send_0.19.2-LICENSE](licenses/send_0.19.2-LICENSE), [send_0.19.2-package.json](licenses/send_0.19.2-package.json) |
| serve-static@1.15.0 | MIT | [serve-static_1.15.0-LICENSE](licenses/serve-static_1.15.0-LICENSE), [serve-static_1.15.0-package.json](licenses/serve-static_1.15.0-package.json) |
| serve-static@1.16.3 | MIT | [serve-static_1.16.3-LICENSE](licenses/serve-static_1.16.3-LICENSE), [serve-static_1.16.3-package.json](licenses/serve-static_1.16.3-package.json) |
| set-function-length@1.2.2 | MIT | [set-function-length_1.2.2-LICENSE](licenses/set-function-length_1.2.2-LICENSE), [set-function-length_1.2.2-package.json](licenses/set-function-length_1.2.2-package.json) |
| setprototypeof@1.2.0 | ISC | [setprototypeof_1.2.0-LICENSE](licenses/setprototypeof_1.2.0-LICENSE), [setprototypeof_1.2.0-package.json](licenses/setprototypeof_1.2.0-package.json) |
| side-channel-list@1.0.1 | MIT | [side-channel-list_1.0.1-LICENSE](licenses/side-channel-list_1.0.1-LICENSE), [side-channel-list_1.0.1-package.json](licenses/side-channel-list_1.0.1-package.json) |
| side-channel-map@1.0.1 | MIT | [side-channel-map_1.0.1-LICENSE](licenses/side-channel-map_1.0.1-LICENSE), [side-channel-map_1.0.1-package.json](licenses/side-channel-map_1.0.1-package.json) |
| side-channel-weakmap@1.0.2 | MIT | [side-channel-weakmap_1.0.2-LICENSE](licenses/side-channel-weakmap_1.0.2-LICENSE), [side-channel-weakmap_1.0.2-package.json](licenses/side-channel-weakmap_1.0.2-package.json) |
| side-channel@1.0.6 | MIT | [side-channel_1.0.6-LICENSE](licenses/side-channel_1.0.6-LICENSE), [side-channel_1.0.6-package.json](licenses/side-channel_1.0.6-package.json) |
| side-channel@1.1.1 | MIT | [side-channel_1.1.1-LICENSE](licenses/side-channel_1.1.1-LICENSE), [side-channel_1.1.1-package.json](licenses/side-channel_1.1.1-package.json) |
| statuses@2.0.1 | MIT | [statuses_2.0.1-LICENSE](licenses/statuses_2.0.1-LICENSE), [statuses_2.0.1-package.json](licenses/statuses_2.0.1-package.json) |
| statuses@2.0.2 | MIT | [statuses_2.0.2-LICENSE](licenses/statuses_2.0.2-LICENSE), [statuses_2.0.2-package.json](licenses/statuses_2.0.2-package.json) |
| supports-color@7.2.0 | MIT | [supports-color_7.2.0-license](licenses/supports-color_7.2.0-license), [supports-color_7.2.0-package.json](licenses/supports-color_7.2.0-package.json) |
| toidentifier@1.0.1 | MIT | [toidentifier_1.0.1-LICENSE](licenses/toidentifier_1.0.1-LICENSE), [toidentifier_1.0.1-package.json](licenses/toidentifier_1.0.1-package.json) |
| tr46@0.0.3 | MIT | [tr46_0.0.3-index.js](licenses/tr46_0.0.3-index.js), [tr46_0.0.3-package.json](licenses/tr46_0.0.3-package.json), [tr46-LICENSE.md](licenses/tr46-LICENSE.md) |
| type-is@1.6.18 | MIT | [type-is_1.6.18-LICENSE](licenses/type-is_1.6.18-LICENSE), [type-is_1.6.18-package.json](licenses/type-is_1.6.18-package.json) |
| ultron@1.1.1 | MIT | [ultron_1.1.1-LICENSE](licenses/ultron_1.1.1-LICENSE), [ultron_1.1.1-package.json](licenses/ultron_1.1.1-package.json) |
| unpipe@1.0.0 | MIT | [unpipe_1.0.0-LICENSE](licenses/unpipe_1.0.0-LICENSE), [unpipe_1.0.0-package.json](licenses/unpipe_1.0.0-package.json) |
| utils-merge@1.0.1 | MIT | [utils-merge_1.0.1-LICENSE](licenses/utils-merge_1.0.1-LICENSE), [utils-merge_1.0.1-package.json](licenses/utils-merge_1.0.1-package.json) |
| uuid@11.1.1 | MIT | [uuid_11.1.1-LICENSE.md](licenses/uuid_11.1.1-LICENSE.md), [uuid_11.1.1-package.json](licenses/uuid_11.1.1-package.json) |
| uuid@3.4.0 | MIT | [uuid_3.4.0-LICENSE.md](licenses/uuid_3.4.0-LICENSE.md), [uuid_3.4.0-package.json](licenses/uuid_3.4.0-package.json) |
| vary@1.1.2 | MIT | [vary_1.1.2-LICENSE](licenses/vary_1.1.2-LICENSE), [vary_1.1.2-package.json](licenses/vary_1.1.2-package.json) |
| webidl-conversions@3.0.1 | BSD-2-Clause | [webidl-conversions_3.0.1-LICENSE.md](licenses/webidl-conversions_3.0.1-LICENSE.md), [webidl-conversions_3.0.1-package.json](licenses/webidl-conversions_3.0.1-package.json) |
| whatwg-url@5.0.0 | MIT | [whatwg-url_5.0.0-LICENSE.txt](licenses/whatwg-url_5.0.0-LICENSE.txt), [whatwg-url_5.0.0-package.json](licenses/whatwg-url_5.0.0-package.json) |
| ws@3.3.3 | MIT | [ws_3.3.3-LICENSE](licenses/ws_3.3.3-LICENSE), [ws_3.3.3-package.json](licenses/ws_3.3.3-package.json) |
| xml2js@0.6.2 | MIT | [xml2js_0.6.2-LICENSE](licenses/xml2js_0.6.2-LICENSE), [xml2js_0.6.2-package.json](licenses/xml2js_0.6.2-package.json) |
| xmlbuilder@11.0.1 | MIT | [xmlbuilder_11.0.1-LICENSE](licenses/xmlbuilder_11.0.1-LICENSE), [xmlbuilder_11.0.1-package.json](licenses/xmlbuilder_11.0.1-package.json) |

## Typography

PT Sans by ParaType is distributed under SIL Open Font License 1.1. Original font and license: assets/fonts/. The same license is shipped with the launcher.
