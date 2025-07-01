import React, { useEffect, useRef, useId, useState } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid once when the module is loaded
try {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'sans-serif',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'cardinal'
        },
        er: {
            useMaxWidth: true
        },
        sequence: {
            useMaxWidth: true
        },
        suppressErrorRendering: false,
        logLevel: 'error'
    });
} catch (e) {
    console.error("Could not initialize Mermaid", e);
}

interface MermaidBlockProps {
    chart: string;
}

const validateMermaidSyntax = (content: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('%%')) continue;
        
        // Kontrola bodkočiarok po definíciách uzlov
        if (line.includes('[') && line.includes(']') && !line.endsWith(';') && !line.includes('-->')) {
            errors.push(`Riadok ${i + 1}: Chýba bodkočiarka po definícii uzla`);
        }
        
        // Kontrola neukončených úvodzoviek
        const quoteCount = (line.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            errors.push(`Riadok ${i + 1}: Neukončené úvodzovky`);
        }
        
        // Kontrola rezervovaných slov ako ID
        const reservedWords = ['graph', 'end', 'subgraph'];
        reservedWords.forEach(word => {
            if (line.startsWith(word + ' -->') || line.startsWith(word + '[')) {
                errors.push(`Riadok ${i + 1}: "${word}" je rezervované slovo`);
            }
        });
    }
    
    return { isValid: errors.length === 0, errors };
};

const sanitizeMermaidCode = (content: string): string => {
    return content
        .split('\n')
        .map(line => {
            line = line.trim();
            
            // Preskočiť prázdne riadky a komentáre
            if (!line || line.startsWith('%%')) return line;
            
            // Oprava chýbajúcich bodkočiarok po definíciách uzlov
            if (line.includes('[') && line.includes(']') && !line.endsWith(';') && !line.includes('-->')) {
                // Odstráni komentár z konca riadku a pridá bodkočiarku
                const commentIndex = line.indexOf('%%');
                if (commentIndex > 0) {
                    const codepart = line.substring(0, commentIndex).trim();
                    const comment = line.substring(commentIndex);
                    return `${codepart}; ${comment}`;
                } else {
                    return `${line};`;
                }
            }
            
            return line;
        })
        .join('\n');
};

export const MermaidBlock: React.FC<MermaidBlockProps> = React.memo(({ chart }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [sanitizedContent, setSanitizedContent] = useState<string>('');
    // useId is preferred for generating unique IDs in React 18+
    const id = useId();
    const chartId = `mermaid-chart-${id}`;

    useEffect(() => {
        const renderChart = async () => {
            if (mermaidRef.current && chart) {
                // Ensure the container is empty before rendering
                mermaidRef.current.innerHTML = '';
                try {
                    // Log the chart content for debugging
                    console.log("Mermaid chart content:", chart);
                    // Validácia a sanitizácia
                    const validation = validateMermaidSyntax(chart);
                    
                    if (!validation.isValid) {
                        setError(`Syntaktické chyby: ${validation.errors.join(', ')}`);
                        return;
                    }
                    
                    const sanitized = sanitizeMermaidCode(chart);
                    setSanitizedContent(sanitized);
                    
                    // mermaid.render returns the svg code and a cleanup function
                    const { svg } = await mermaid.render(chartId, sanitized);
                    if (mermaidRef.current) {
                        mermaidRef.current.innerHTML = svg;
                        setError(null);
                    }
                } catch (error) {
                    console.error("Mermaid render error:", error);
                    console.error("Failed chart content:", chart);
                    if (mermaidRef.current) {
                        const errorMessage = error instanceof Error ? error.message : "Neznáma chyba";
                        setError(`Chyba v syntaxi diagramu: ${errorMessage}`);
                    }
                }
            }
        };
        renderChart();
    }, [chart, chartId]);
    
    if (error) {
        return (
            <div className="error-container p-2 bg-red-900 bg-opacity-30 rounded-md text-white">
                <h4 className="text-lg font-bold">Chyba v Mermaid diagrame:</h4>
                <p className="text-sm">{error}</p>
                <details className="mt-2 text-xs">
                    <summary>Pôvodný obsah:</summary>
                    <pre className="mt-1 p-2 bg-black bg-opacity-50 rounded">{chart}</pre>
                </details>
            </div>
        );
    }
    
    // The key forces a re-mount if the chart content changes, which helps with re-rendering complex diagrams.
    return <div key={chart} ref={mermaidRef} className="mermaid-container flex justify-center p-2"></div>;
});
