"use client";

import { useEffect, useState, useCallback } from "react";
import { useAudit } from "@/context/AuditContext";
import { Search, FileText, Check } from "lucide-react";

export function PolicyBrowser() {
  const {
    policyList,
    selectedPolicyNames,
    fetchPolicies,
    togglePolicy,
    selectAllPolicies,
    clearPolicies,
  } = useAudit();

  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchPolicies().then(() => setLoaded(true));
    }
  }, [loaded, fetchPolicies]);

  const handleSearch = useCallback(() => {
    fetchPolicies(search || undefined);
  }, [search, fetchPolicies]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  const categories = Array.from(new Set(policyList.map((p) => p.category))).sort();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-700">
          Policy Library
        </label>
        <span className="text-xs text-zinc-400">
          {selectedPolicyNames.length} selected
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search policies (e.g. hospice, authorization)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-zinc-50 border border-zinc-200 py-2 pl-9 pr-4 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAllPolicies}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Select all ({policyList.length})
        </button>
        <span className="text-zinc-300">|</span>
        <button
          type="button"
          onClick={clearPolicies}
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          Clear
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
        {categories.map((cat) => {
          const catPolicies = policyList.filter((p) => p.category === cat);
          return (
            <div key={cat}>
              <div className="sticky top-0 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-500 border-b border-zinc-100">
                {cat} ({catPolicies.length})
              </div>
              {catPolicies.map((policy) => {
                const selected = selectedPolicyNames.includes(policy.name);
                return (
                  <button
                    key={policy.name}
                    type="button"
                    onClick={() => togglePolicy(policy.name)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 ${
                      selected ? "bg-blue-50" : ""
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-blue-500 bg-blue-500"
                          : "border-zinc-300"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="flex-1 truncate text-zinc-700">
                      {policy.name.replace(".pdf", "")}
                    </span>
                    {policy.matchingPages && (
                      <span className="text-xs text-blue-500">
                        {policy.matchingPages.length} pg match
                      </span>
                    )}
                    <span className="text-xs text-zinc-400">
                      {policy.totalPages} pg
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}

        {policyList.length === 0 && loaded && (
          <p className="px-3 py-4 text-center text-sm text-zinc-400">
            No policies found.
          </p>
        )}
      </div>
    </div>
  );
}
