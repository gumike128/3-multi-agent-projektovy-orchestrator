import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/styles';
import { MermaidBlock } from '@/components/MermaidBlock';
import ErrorBoundary from '@/components/ErrorBoundary';

interface MarkdownRendererProps {
    children: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ children }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : null;

                    if (language === 'mermaid') {
                        const chartContent = typeof children === 'string' ? children.trim() : '';
                        return chartContent ? (
                            <ErrorBoundary>
                                <MermaidBlock chart={chartContent} />
                            </ErrorBoundary>
                        ) : <code className={className} {...props}>{children}</code>;
                    }
                    
                    return language ? (
                        <ErrorBoundary>
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={language}
                                PreTag="div"
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </ErrorBoundary>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                },
            }}
        >
            {children}
        </ReactMarkdown>
    );
});
