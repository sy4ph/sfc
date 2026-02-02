'use client';

import { useState } from 'react';
import { Header, Sidebar, TabPanel } from '@/components/layout';
import { PlannerPanel } from '@/components/planner';
import { RecipesPanel, RecipeBook } from '@/components/recipes';
import { ProductionGraph, ProductionSummary } from '@/components/graph';
import { ShortcutsModal } from '@/components/ui';
import { useCalculation, useKeyboardShortcuts } from '@/hooks';

type SidebarTabId = 'planner' | 'recipes';
type ViewMode = 'planner' | 'recipes';

const SIDEBAR_TABS = [
  { id: 'planner', label: 'Items' },
  { id: 'recipes', label: 'Recipes' },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('planner');
  const [sidebarTab, setSidebarTab] = useState<SidebarTabId>('planner');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const { result, calculate } = useCalculation();

  useKeyboardShortcuts({
    onCalculate: calculate,
    onSwitchTab: (index) => {
      if (typeof index === 'number') {
        const targetTab = SIDEBAR_TABS[index].id as SidebarTabId;
        setSidebarTab(targetTab);
      } else {
        setSidebarTab(prev => prev === 'planner' ? 'recipes' : 'planner');
      }
    },
    onClose: () => {
      setIsSidebarOpen(false);
      setIsShortcutsOpen(false);
    },
    onHelp: () => setIsShortcutsOpen(true),
  });

  return (
    <div className="min-h-screen bg-bg transition-colors duration-300">
      <Header
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <div className="max-w-screen-2xl mx-auto flex">
        {/* Sidebar - Only show in Planner view */}
        {viewMode === 'planner' && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
            <TabPanel
              tabs={SIDEBAR_TABS}
              activeTab={sidebarTab}
              onChange={(id) => {
                setSidebarTab(id as SidebarTabId);
                setIsSidebarOpen(false); // Close on mobile after selection
              }}
            />

            <div className="animate-fade-in">
              {sidebarTab === 'planner' ? <PlannerPanel /> : <RecipesPanel />}
            </div>
          </Sidebar>
        )}

        <main className={`flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto h-[calc(100vh-64px)] scrollbar-hide`}>
          {viewMode === 'recipes' ? (
            <RecipeBook />
          ) : (
            <>
              {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Summary */}
                  <ProductionSummary
                    summary={result.summary}
                    targetItemName={result.target_item_name}
                    amountRequested={result.amount_requested}
                    strategy={result.optimization_strategy}
                    provenOptimal={result.production_graph.proven_optimal}
                  />

                  {/* Graph Area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim">
                        Production Visualization
                      </h4>
                      <span className="text-[10px] text-text-dim opacity-50 px-2 py-0.5 bg-surface-high rounded uppercase font-bold">
                        ELK Layered Engine
                      </span>
                    </div>
                    <div className="h-[600px] xl:h-[700px]">
                      <ProductionGraph graph={result.production_graph} />
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="h-full flex items-center justify-center p-8">
                  <div className="relative max-w-lg w-full">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-50" />

                    <div className="relative bg-surface/40 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center space-y-8 shadow-2xl">
                      <div className="w-24 h-24 mx-auto relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                        <div className="relative w-24 h-24 bg-surface-high rounded-full flex items-center justify-center border border-border/50 shadow-inner">
                          <svg
                            className="w-12 h-12 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-3xl font-black text-text tracking-tight">
                          Ready for Optimization
                        </h2>
                        <p className="text-text-dim max-w-sm mx-auto leading-relaxed">
                          Select a production target in the sidebar to generate your ideal factory layout using our MILP-driven optimization engine.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-higher rounded-full border border-border/50">
                          <kbd className="text-primary font-mono font-black text-xs">C</kbd>
                          <span>Calculate</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-higher rounded-full border border-border/50">
                          <kbd className="text-primary font-mono font-black text-xs">Tab</kbd>
                          <span>Switch Tab</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
