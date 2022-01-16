import mime from 'mime';

mime.define(
  {
    /**
     * https://html.spec.whatwg.org/multipage/scripting.html#scriptingLanguages
     *
     * Servers should use text/javascript for JavaScript resources.
     * Servers should not use other JavaScript MIME types for JavaScript resources,
     * and must not use non-JavaScript MIME types.
     */
    'text/javascript': ['mjs', 'js'],
  },
  true,
);

export default function getContentTypeHeader(filename: string) {
  const type = mime.getType(filename) || 'text/plain';

  return type === 'text-javascript' ? `${type}; charset=utf-8` : type;
}
