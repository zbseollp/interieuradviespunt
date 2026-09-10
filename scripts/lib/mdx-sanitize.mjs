/**
 * Keep Payload-synced .mdx compilable. MDX treats `<` as JSX — a stray
 * comparison or HTML comment in a CMS body would abort the whole deploy.
 */

export function sanitizeMdxBody(md) {
  return mapOutsideCodeFences(md.replace(/\r\n/g, '\n'), (chunk) => {
    let text = chunk.replace(/<!--[\s\S]*?-->/g, '');
    text = text.replace(/<!DOCTYPE[^>]*>/gi, '');
    text = escapeStrayLessThan(text);
    return text;
  });
}

function mapOutsideCodeFences(md, fn) {
  const lines = md.split('\n');
  const out = [];
  let inFence = false;
  let chunk = [];

  const flush = () => {
    if (chunk.length === 0) return;
    out.push(fn(chunk.join('\n')));
    chunk = [];
  };

  for (const line of lines) {
    const fence = line.trimStart();
    if (/^(`{3,}|~{3,})/.test(fence)) {
      flush();
      out.push(line);
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    chunk.push(line);
  }
  flush();
  return out.join('\n');
}

function escapeStrayLessThan(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '<') {
      out += text[i];
      i += 1;
      continue;
    }
    const rest = text.slice(i);
    const tagMatch = rest.match(/^<\/?[A-Za-z][\w:-]*(?:\s[^<>]*?)?\/?>/);
    if (tagMatch) {
      out += tagMatch[0];
      i += tagMatch[0].length;
      continue;
    }
    out += '&lt;';
    i += 1;
  }
  return out;
}
