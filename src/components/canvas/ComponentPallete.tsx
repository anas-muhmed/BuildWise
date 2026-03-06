"use client";

import React from "react";
import DraggableItem from "./DraggableItem";

const ComponentPallete = () => {
  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto h-full">
      <h3 className="text-lg font-bold mb-4 text-white sticky top-0 bg-zinc-900 pb-2">Components</h3>

      {/* Core Components */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-semibold">Core Infrastructure</h4>
        <div className="space-y-3">
          <DraggableItem id="frontend" label="🖥️ Frontend" color="blue" />
          <DraggableItem id="backend" label="🗄️ Backend" color="green" />
          <DraggableItem id="database" label="💾 Database" color="purple" />
          <DraggableItem id="apigateway" label="🛡️ API Gateway" color="indigo" />
        </div>
      </div>

      {/* Scaling & Performance */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-semibold">Scaling & Performance</h4>
        <div className="space-y-3">
          <DraggableItem id="loadbalancer" label="🌐 Load Balancer" color="yellow" />
          <DraggableItem id="cache" label="🧠 Cache" color="orange" />
          <DraggableItem id="cdn" label="🌍 CDN" color="cyan" />
          <DraggableItem id="readreplica" label="📖 Read Replica" color="violet" />
        </div>
      </div>

      {/* Security & Auth */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-semibold">Security & Auth</h4>
        <div className="space-y-3">
          <DraggableItem id="auth" label="🔐 Auth Service" color="red" />
          <DraggableItem id="firewall" label="🛡️ Firewall" color="rose" />
          <DraggableItem id="vault" label="🔑 Secrets Vault" color="pink" />
        </div>
      </div>

      {/* Data & Storage */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-semibold">Data & Storage</h4>
        <div className="space-y-3">
          <DraggableItem id="storage" label="🗄️ Object Storage" color="emerald" />
          <DraggableItem id="datawarehouse" label="📊 Data Warehouse" color="teal" />
          <DraggableItem id="search" label="🔍 Search Engine" color="amber" />
        </div>
      </div>

      {/* Messaging & Events */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-semibold">Messaging & Events</h4>
        <div className="space-y-3">
          <DraggableItem id="queue" label="📬 Message Queue" color="sky" />
          <DraggableItem id="pubsub" label="📡 Pub/Sub" color="blue" />
          <DraggableItem id="websocket" label="⚡ WebSocket" color="indigo" />
        </div>
      </div>

      {/* External Services */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-semibold">External Services</h4>
        <div className="space-y-3">
          <DraggableItem id="payment" label="💳 Payment Gateway" color="lime" />
          <DraggableItem id="email" label="📧 Email Service" color="green" />
          <DraggableItem id="sms" label="📱 SMS Service" color="emerald" />
          <DraggableItem id="analytics" label="📈 Analytics" color="purple" />
        </div>
      </div>

      {/* Monitoring & Observability */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-400 uppercase tracking-wide mb-3 font-semibold">Monitoring</h4>
        <div className="space-y-3">
          <DraggableItem id="monitoring" label="📊 Monitoring" color="orange" />
          <DraggableItem id="logging" label="📝 Logging" color="yellow" />
        </div>
      </div>
    </div>
  );
};

export default ComponentPallete;
