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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Configure {blockTitle || "Component"}</h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">Name (label on diagram)</label>
            <input
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Frontend (Next.js)"
              value={form.name ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tech" className="block text-sm font-medium">Tech Stack</label>
            <input
              id="tech"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Next.js, Express, MongoDB"
              value={form.tech ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, tech: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="cpu" className="block text-sm font-medium">CPU</label>
              <input
                id="cpu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., 2 vCPU"
                value={form.cpu ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, cpu: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ram" className="block text-sm font-medium">RAM</label>
              <input
                id="ram"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., 4 GB"
                value={form.ram ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, ram: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Any special configs or assumptions"
              value={form.notes ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button" 
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
