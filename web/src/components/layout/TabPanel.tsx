'use client';

interface Tab {
    id: string;
    label: string;
}

interface TabPanelProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
}

export function TabPanel({ tabs, activeTab, onChange }: TabPanelProps) {
    return (
        <div className="flex gap-1 p-1 bg-surface-high rounded-lg mb-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === tab.id
                            ? 'bg-primary text-on-primary shadow-lg'
                            : 'text-text-dim hover:text-text'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
