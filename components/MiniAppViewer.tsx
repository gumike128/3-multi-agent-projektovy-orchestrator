import React, { useState, useEffect } from 'react';
import type { MiniAppTab, MiniApp } from '@/types';
import { UI_STRINGS, GENERIC_ICONS } from '@/constants';
import { useProject } from '@/contexts/ProjectContext';

interface MiniAppViewerProps {
    tab: MiniAppTab;
    miniApp: MiniApp;
}

export const MiniAppViewer: React.FC<MiniAppViewerProps> = ({ tab, miniApp }) => {
    const [iframeHeight, setIframeHeight] = useState('600px'); // A reasonable default height
    const { handleSaveMiniAppToDocs, handleDownloadMiniApp } = useProject();

    // Listener for iframe resize messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'mini-app-resize' && event.data.miniAppId === miniApp.id) {
                // Add a little buffer for safety and prevent scrollbars
                const newHeight = event.data.height > 0 ? `${event.data.height + 20}px` : '600px';
                if (newHeight !== iframeHeight) {
                    setIframeHeight(newHeight);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [miniApp.id, iframeHeight]); // Depend on iframeHeight to avoid stale closures

    // Script to be injected into the iframe to report its content height
    const resizeScript = `
    <script>
        try {
            const sendHeight = () => {
                const height = Math.max(
                    document.body.scrollHeight, document.body.offsetHeight,
                    document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight
                );
                window.parent.postMessage({ type: 'mini-app-resize', height: height, miniAppId: '${miniApp.id}' }, '*');
            };

            const observer = new ResizeObserver(sendHeight);
            
            observer.observe(document.body);
            observer.observe(document.documentElement);

            window.addEventListener('load', () => {
                sendHeight();
                setTimeout(sendHeight, 200);
                setTimeout(sendHeight, 500);
            });

            document.body.addEventListener('click', () => setTimeout(sendHeight, 150));
            document.body.addEventListener('input', () => setTimeout(sendHeight, 150));

        } catch(e) { console.error('Resize observer script failed:', e); }
    <\/script>
    `;

    // Inject the script right before the closing body tag, or append if it doesn't exist
    const htmlContentWithScript = miniApp.htmlContent.includes('</body>')
        ? miniApp.htmlContent.replace('</body>', `${resizeScript}</body>`)
        : `${miniApp.htmlContent}${resizeScript}`;

    const SaveIcon = GENERIC_ICONS.SaveToDocs;
    const DownloadIcon = GENERIC_ICONS.Download;
    
    const headerButtonClass = "flex-1 sm:flex-none flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition text-xs";

    return (
        <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-inner border border-slate-700 flex flex-col h-full animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-slate-700">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-green-300">{tab.title}</h2>
                    <p className="text-sm text-slate-400">{UI_STRINGS.miniAppViewerTitle}</p>
                </div>
                <div className="flex items-center space-x-2 mt-3 sm:mt-0 w-full sm:w-auto">
                    <button onClick={() => handleSaveMiniAppToDocs(miniApp.id)} className={`${headerButtonClass} bg-teal-600 hover:bg-teal-700`} title={UI_STRINGS.saveToDocumentation}>
                        <SaveIcon className="h-4 w-4 mr-1.5" />
                        <span>{UI_STRINGS.saveToDocumentation}</span>
                    </button>
                    <button onClick={() => handleDownloadMiniApp(miniApp.id)} className={`${headerButtonClass} bg-sky-600 hover:bg-sky-700`} title={UI_STRINGS.downloadMiniApp}>
                        <DownloadIcon className="h-4 w-4 mr-1.5" />
                        <span>{UI_STRINGS.downloadMiniApp}</span>
                    </button>
                    <button className={`${headerButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`} title={UI_STRINGS.miniAppSettings} disabled>
                        <GENERIC_ICONS.Settings className="h-4 w-4 mr-1.5" />
                        <span>{UI_STRINGS.settings}</span>
                    </button>
                </div>
            </header>

            <div className="flex-grow w-full bg-slate-900/50 rounded-md overflow-hidden border border-slate-700">
                <iframe
                    srcDoc={htmlContentWithScript}
                    title={tab.title}
                    className="w-full border-0 transition-all duration-300"
                    style={{ height: iframeHeight }}
                    sandbox="allow-scripts allow-forms allow-same-origin"
                />
            </div>
             <footer className="mt-4 text-xs text-center text-slate-500">
                <p>Táto miniaplikácia beží v izolovanom prostredí (sandbox) pre vašu bezpečnosť.</p>
            </footer>
        </div>
    );
};
