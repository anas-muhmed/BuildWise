"use client";

import * as React from "react";

type Config = {
  name?: string;
  tech?: string;
  notes?: string;
  cpu?: string;
  ram?: string;
};

interface ConfigModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Config;
  onSave: (data: Config) => void;
  blockTitle?: string; // for the dialog title (e.g., "Backend")
}

export default function ConfigModal({
  open, onOpenChange, initial, onSave, blockTitle,
}: ConfigModalProps) {
  const [form, setForm] = React.useState<Config>(initial || {});

  React.useEffect(() => {
    setForm(initial || {});
  }, [initial, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
      <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Configure {blockTitle || "Component"}</h2>
          <p className="text-sm text-zinc-400 mt-1">Customize component properties</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Name (label on diagram)</label>
            <input
              id="name"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder="e.g., Frontend (Next.js)"
              value={form.name ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tech" className="block text-sm font-medium text-zinc-300">Tech Stack</label>
            <input
              id="tech"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder="e.g., Next.js, Express, MongoDB"
              value={form.tech ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, tech: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="cpu" className="block text-sm font-medium text-zinc-300">CPU</label>
              <input
                id="cpu"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="e.g., 2 vCPU"
                value={form.cpu ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, cpu: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ram" className="block text-sm font-medium text-zinc-300">RAM</label>
              <input
                id="ram"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="e.g., 4 GB"
                value={form.ram ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, ram: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-300">Notes</label>
            <textarea
              id="notes"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
              placeholder="Any special configs or assumptions"
              value={form.notes ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button 
              type="button" 
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
