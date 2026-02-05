'use client';

import { useState } from 'react';
import { Header, Sidebar } from '@/components/layout';
import { PlannerPanel, FactoryPlanner, CalculatorTabs, ComparisonView } from '@/components/planner';
import { RecipeBook } from '@/components/recipes';
import { ProductionGraph, ProductionSummary } from '@/components/graph';
import { ShortcutsModal } from '@/components/ui';
import { useCalculation, useKeyboardShortcuts } from '@/hooks';
import { usePlannerStore, useRecipeStore } from '@/stores';
import { convertCalculationToPlannerAsync } from '@/lib/plannerConverter';

type ViewMode = 'planner' | 'recipes' | 'factory';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('planner');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const { result, calculate, tabs } = useCalculation();
  const { importNodes } = usePlannerStore();
  const { recipes } = useRecipeStore();

  const handleOpenInPlanner = async () => {
    if (!result) return;
    const { nodes, edges } = await convertCalculationToPlannerAsync(result);
    // Import logic
    importNodes(nodes, edges, recipes);
    setViewMode('factory');
  };

  useKeyboardShortcuts({
    onCalculate: calculate,
    onSwitchTab: () => {
      // Rotation between main views
      setViewMode(prev => {
        if (prev === 'planner') return 'recipes';
        if (prev === 'recipes') return 'factory';
        return 'planner';
      });
    },
    onClose: () => {
      setIsSidebarOpen(false);
      setIsShortcutsOpen(false);
      setIsCompareOpen(false);
    },
    onHelp: () => setIsShortcutsOpen(true),
    // @ts-ignore
    onUndo: () => usePlannerStore.temporal.getState().undo(),
    // @ts-ignore
    onRedo: () => usePlannerStore.temporal.getState().redo(),
    onCopy: usePlannerStore.getState().copySelection,
    onPaste: () => usePlannerStore.getState().paste(recipes),
  });

  const hasMultipleResults = tabs.filter(t => t.result).length > 1;

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

      {isCompareOpen && (
        <ComparisonView onClose={() => setIsCompareOpen(false)} />
      )}

      <div className="max-w-screen-2xl mx-auto flex">
        {/* Sidebar - Only show in Planner view */}
        {viewMode === 'planner' && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
            <div className="animate-fade-in flex flex-col h-full">
              <div className="flex-none">
                <CalculatorTabs />
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                <PlannerPanel />
              </div>

              {/* Comparison Trigger */}
              <div className="flex-none mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => setIsCompareOpen(true)}
                  disabled={!hasMultipleResults}
                  className={`
                        w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all
                        ${hasMultipleResults
                      ? 'bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20'
                      : 'bg-surface hover:bg-surface-high text-text-dim border border-transparent cursor-not-allowed opacity-50'
                    }
                      `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Compare Tabs
                </button>
                {!hasMultipleResults && tabs.filter(t => t.result).length === 1 && (
                  <p className="text-[10px] text-center text-text-dim mt-2">
                    Run calculation on another tab to enable comparison.
                  </p>
                )}
              </div>
            </div>
          </Sidebar>
        )}

        <main className={`flex-1 ${viewMode === 'factory' ? '' : 'p-4 lg:p-6 space-y-6 overflow-y-auto h-[calc(100vh-64px)] scrollbar-hide'}`}>
          {viewMode === 'recipes' ? (
            <div className="animate-fade-in">
              <RecipeBook />
            </div>
          ) : viewMode === 'factory' ? (
            <FactoryPlanner />
          ) : (
            <div className="animate-fade-in space-y-6">
              {result ? (
                <>
                  {/* Summary */}
                  <ProductionSummary
                    summary={result.summary}
                    targetItemName={result.target_item_name}
                    amountRequested={result.amount_requested}
                    strategy={result.optimization_strategy}
                    provenOptimal={result.production_graph.proven_optimal}
                  />

                  {/* Open in Planner Button */}
                  <button
                    onClick={handleOpenInPlanner}
                    className="w-full py-3 bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 text-text font-bold rounded-xl border border-primary/30 transition-all flex items-center justify-center gap-2 group"
                  >
                    <svg className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Open in Factory Planner
                  </button>

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
                </>
              ) : (
                /* Empty State */
                <div className="h-[calc(100vh-200px)] flex items-center justify-center p-8">
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
