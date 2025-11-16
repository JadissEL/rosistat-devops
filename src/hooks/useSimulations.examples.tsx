/**
 * React Query Hooks - Integration Examples
 * 
 * This file demonstrates practical usage patterns of React Query hooks
 * in component development with proper error handling and loading states
 */

import React, { useState } from "react";
import { useSimulations, useSimulation, useCreateSimulation, useSimulationStats, usePrefetchSimulation } from "@/hooks/useSimulations";
import { SimulationRow } from "@/lib/api";

// ============================================================================
// EXAMPLE 1: List Component with Caching
// ============================================================================

/**
 * Demonstrates:
 * - useSimulations hook usage
 * - Loading state display
 * - Error handling
 * - Cache effectiveness (same data from cache)
 * - Optional userId filtering
 */
export function SimulationsListExample({ userId }: { userId?: string }) {
  const {
    data: simulations,
    isLoading,
    isError,
    error,
    isFetching,
    isStale,
    refetch,
  } = useSimulations(userId);

  return (
    <div className="simulations-list">
      <div className="header">
        <h2>Simulations</h2>
        {isStale && <span className="badge">Data is stale (will auto-refresh)</span>}
        {isFetching && <span className="badge">Refreshing...</span>}
      </div>

      {isLoading && <div className="skeleton">Loading simulations...</div>}

      {isError && (
        <div className="error">
          <p>Error loading simulations: {error?.message}</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !isError && simulations.length === 0 && (
        <div className="empty">No simulations yet</div>
      )}

      {!isLoading && !isError && simulations.length > 0 && (
        <ul className="list">
          {simulations.map((sim) => (
            <li key={sim.id} className="item">
              <div className="strategy">{sim.strategy}</div>
              <div className="earnings">${sim.finalEarnings}</div>
              <div className="date">{new Date(sim.timestamp).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? "Refreshing..." : "Manual Refresh"}
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Detail View with Multiple Queries
// ============================================================================

/**
 * Demonstrates:
 * - useSimulation hook for detailed view
 * - useSimulationStats for supplementary data
 * - Conditional query enabling (enabled: id > 0)
 * - Combined loading states
 */
export function SimulationDetailExample({ id }: { id: number }) {
  const {
    data: simulationData,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useSimulation(id);

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useSimulationStats(id);

  const isLoading = detailLoading || statsLoading;
  const isError = detailError || statsError;

  return (
    <div className="simulation-detail">
      {isLoading && <div className="skeleton">Loading details...</div>}

      {isError && (
        <div className="error">
          <p>Error: {detailErrorObj?.message}</p>
        </div>
      )}

      {!isLoading && !isError && simulationData && (
        <>
          <h2>{simulationData.simulation.strategy}</h2>
          <div className="details-grid">
            <div className="detail">
              <label>Starting Investment</label>
              <span>${simulationData.simulation.startingInvestment}</span>
            </div>
            <div className="detail">
              <label>Final Portfolio</label>
              <span>${simulationData.simulation.finalPortfolio}</span>
            </div>
            <div className="detail">
              <label>Total Earnings</label>
              <span className={simulationData.simulation.finalEarnings >= 0 ? "positive" : "negative"}>
                ${simulationData.simulation.finalEarnings}
              </span>
            </div>
          </div>

          {stats && (
            <div className="statistics">
              <h3>Statistics</h3>
              <div className="stats-grid">
                <div className="stat">
                  <label>Total Spins</label>
                  <span>{stats.totalSpins}</span>
                </div>
                <div className="stat">
                  <label>Min Earnings</label>
                  <span>{stats.minEarnings?.toFixed(2)}</span>
                </div>
                <div className="stat">
                  <label>Max Earnings</label>
                  <span>{stats.maxEarnings?.toFixed(2)}</span>
                </div>
                <div className="stat">
                  <label>Average</label>
                  <span>{stats.avgNetResult?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="spins-preview">
            <h3>Spins ({simulationData.spins.length} total)</h3>
            {simulationData.spins.slice(0, 10).map((spin) => (
              <div key={spin.id} className="spin-row">
                <span>Spin #{spin.spinNumber}: {spin.drawnNumber}</span>
                <span className={spin.spinNetResult >= 0 ? "win" : "loss"}>
                  {spin.spinNetResult >= 0 ? "+" : "-"}${Math.abs(spin.spinNetResult)}
                </span>
              </div>
            ))}
            {simulationData.spins.length > 10 && (
              <p>... and {simulationData.spins.length - 10} more</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Create Form with Mutation
// ============================================================================

/**
 * Demonstrates:
 * - useCreateSimulation mutation
 * - Loading state during mutation
 * - Error handling
 * - Success callback (cache invalidation automatic)
 * - Form submission pattern
 */
export function CreateSimulationExample() {
  const [formData, setFormData] = useState({
    strategy: "martingale",
    startingInvestment: 10000,
    finalEarnings: 1500,
    finalPortfolio: 11500,
    totalSpins: 100,
  });

  const { mutate, isPending, isSuccess, isError, error, reset } =
    useCreateSimulation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      ...formData,
      settings: {},
    });
  };

  return (
    <form onSubmit={handleSubmit} className="create-form">
      <h2>Create Simulation</h2>

      <div className="form-group">
        <label>Strategy</label>
        <select
          value={formData.strategy}
          onChange={(e) =>
            setFormData({ ...formData, strategy: e.target.value })
          }
        >
          <option>martingale</option>
          <option>zapping</option>
          <option>max_lose</option>
        </select>
      </div>

      <div className="form-group">
        <label>Starting Investment ($)</label>
        <input
          type="number"
          value={formData.startingInvestment}
          onChange={(e) =>
            setFormData({
              ...formData,
              startingInvestment: Number(e.target.value),
            })
          }
        />
      </div>

      <div className="form-group">
        <label>Total Spins</label>
        <input
          type="number"
          value={formData.totalSpins}
          onChange={(e) =>
            setFormData({
              ...formData,
              totalSpins: Number(e.target.value),
            })
          }
        />
      </div>

      {isError && (
        <div className="error">
          Error: {error?.message}
          <button type="button" onClick={() => reset()}>
            Dismiss
          </button>
        </div>
      )}

      {isSuccess && (
        <div className="success">
          Simulation created successfully!
          <button type="button" onClick={() => reset()}>
            Create Another
          </button>
        </div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Simulation"}
      </button>
    </form>
  );
}

// ============================================================================
// EXAMPLE 4: Prefetching on Navigation
// ============================================================================

/**
 * Demonstrates:
 * - usePrefetchSimulation hook
 * - Optimistic loading (data ready when user navigates)
 * - Hover-based prefetch
 * - Click handling with prefetch
 */
export function SimulationLinkWithPrefetch({ id, title }: { id: number; title: string }) {
  const prefetch = usePrefetchSimulation(id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Data is likely already prefetched
    window.location.href = `/simulations/${id}`;
  };

  return (
    <a
      href={`/simulations/${id}`}
      onClick={handleClick}
      onMouseEnter={() => prefetch()}
      className="simulation-link"
    >
      {title}
    </a>
  );
}

// ============================================================================
// EXAMPLE 5: Cache-Aware Component
// ============================================================================

/**
 * Demonstrates:
 * - Reading from cache without refetch
 * - Showing cached data immediately
 * - Fallback to network if not cached
 */
export function CachedSimulationBadge({ id }: { id: number }) {
  const {
    data: simulationData,
    isLoading,
    isError,
  } = useSimulation(id);

  // Data from query (with network)
  const simulation = simulationData?.simulation;

  // Show "Cached" badge if data is in cache
  const isCached = isLoading === false && !isError && simulation;

  return (
    <div className="badge-container">
      {simulation && (
        <>
          <span className="strategy">{simulation.strategy}</span>
          {isCached && <span className="cache-badge">📦 Cached</span>}
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Pagination Pattern
// ============================================================================

/**
 * Demonstrates:
 * - Fetching paginated data
 * - Query key variation for different pages
 * - Page change handling
 */
export function PaginatedSimulationsExample() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const {
    data: simulations,
    isLoading,
    isError,
  } = useSimulations();

  const paginatedData = simulations?.slice(offset, offset + pageSize) || [];
  const totalPages = simulations ? Math.ceil(simulations.length / pageSize) : 0;

  return (
    <div className="paginated-list">
      <div className="items">
        {isLoading && <div>Loading...</div>}
        {isError && <div>Error loading simulations</div>}
        {!isLoading &&
          !isError &&
          paginatedData.map((sim) => (
            <div key={sim.id} className="item">
              {sim.strategy} - ${sim.finalPortfolio}
            </div>
          ))}
      </div>

      <div className="pagination">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Dependent Queries
// ============================================================================

/**
 * Demonstrates:
 * - Query depending on another query's result
 * - enabled: condition pattern
 * - Loading state for dependent query
 */
export function UserSimulationWithStats({ userId }: { userId: string }) {
  // First query: get user's simulations
  const { data: simulations, isLoading: simulationsLoading } =
    useSimulations(userId);

  // Second query: only fetch stats if we have a simulation
  const firstSimId = simulations?.[0]?.id;
  const { data: stats, isLoading: statsLoading } = useSimulationStats(
    firstSimId || 0
  );

  return (
    <div className="dependent-queries">
      {simulationsLoading && <div>Loading simulations...</div>}

      {simulations && simulations.length === 0 && (
        <div>No simulations for this user</div>
      )}

      {simulations && simulations.length > 0 && (
        <>
          <h3>{simulations[0].strategy}</h3>
          {statsLoading && <div>Loading stats...</div>}
          {stats && (
            <p>Total spins: {stats.totalSpins}</p>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Refetch on Interval Pattern
// ============================================================================

/**
 * Demonstrates:
 * - Manual refetch trigger
 * - Polling pattern using useEffect
 * - Cleanup on unmount
 */
export function RefreshableSimulationsList() {
  const { refetch, data: simulations } = useSimulations();
  const [isAutoRefreshing, setIsAutoRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (!isAutoRefreshing) return;

    // Refetch every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, refetch]);

  return (
    <div>
      <button
        onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
        className={isAutoRefreshing ? "active" : ""}
      >
        {isAutoRefreshing ? "Stop Auto-Refresh" : "Start Auto-Refresh"}
      </button>

      <ul>
        {simulations?.map((sim) => (
          <li key={sim.id}>{sim.strategy}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Error Boundary Integration
// ============================================================================

/**
 * Demonstrates:
 * - Error boundary for query errors
 * - Fallback UI
 * - Error recovery
 */
export class QueryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// EXAMPLE 10: Complete Dashboard
// ============================================================================

/**
 * Demonstrates:
 * - Combining multiple hooks
 * - Layout and composition
 * - Real-world usage pattern
 */
export function SimulationDashboard() {
  const { data: simulations, isLoading: listLoading } = useSimulations();
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  return (
    <QueryErrorBoundary>
      <div className="dashboard">
        <div className="sidebar">
          <h2>Simulations</h2>
          {listLoading && <div>Loading...</div>}
          <ul>
            {simulations?.map((sim) => (
              <li
                key={sim.id}
                onClick={() => setSelectedId(sim.id)}
                className={selectedId === sim.id ? "active" : ""}
              >
                {sim.strategy}
              </li>
            ))}
          </ul>
        </div>

        <div className="main">
          {selectedId && (
            <SimulationDetailExample id={selectedId} />
          )}
          {!selectedId && (
            <div className="empty-state">Select a simulation to view details</div>
          )}
        </div>
      </div>
    </QueryErrorBoundary>
  );
}
