import Markdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-light.css';
import { ReactNode, useMemo } from 'react';

interface Props {
  content: string;
  renderer?: (className: string, content: string) => ReactNode;
}

export default function ({ content, renderer }: Props) {
  const components: Components = useMemo(
    () => ({
      code: function ({ className, children, ...props }) {
        return (
          (className && typeof children === 'string' && renderer?.(className, children)) || (
            <code className={className} {...props}>
              {children}
            </code>
          )
        );
      },
    }),
    [renderer],
  );

  return (
    <Markdown rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]} components={components}>
      {content}
    </Markdown>
  );
}
