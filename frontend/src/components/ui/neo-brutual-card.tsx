"use client";

import { motion } from "framer-motion";
import React from "react";

/* ── Neo-Brutal Card ─────────────────────────────────────────── */
export function NeoBrutalCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-full border-4 border-black p-6 ${className}`}
      style={{
        backgroundColor: "#FFDE00",
        boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Neo-Brutal Card (smaller variant for dashboard) ─────────── */
export function NeoBrutalCardCompact({ children, className = "", bg = "#FFDE00" }: { children: React.ReactNode; className?: string; bg?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-full border-4 border-black p-4 ${className}`}
      style={{
        backgroundColor: bg,
        boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Neo-Brutal Title ────────────────────────────────────────── */
export function NeoBrutalTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-4xl font-black uppercase mb-2 tracking-tighter text-black ${className}`}>
      {children}
    </h2>
  );
}

/* ── Neo-Brutal Section Title (smaller, for dashboard cards) ── */
export function NeoBrutalSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-black uppercase tracking-tight text-black border-l-4 border-black pl-2 mb-3">
      {children}
    </h3>
  );
}

/* ── Neo-Brutal Subtitle ─────────────────────────────────────── */
export function NeoBrutalSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold uppercase text-black/60 mb-6 border-l-4 border-black pl-2">
      {children}
    </p>
  );
}

/* ── Neo-Brutal Page Header ──────────────────────────────────── */
export function NeoBrutalPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black uppercase tracking-tighter text-black">{title}</h1>
      {subtitle && (
        <p className="text-sm font-bold uppercase text-black/60 border-l-4 border-black pl-2 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Neo-Brutal Label ────────────────────────────────────────── */
export function NeoBrutalLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold uppercase mb-1.5 border-l-4 border-black pl-2 text-black"
    >
      {children}
    </label>
  );
}

/* ── Neo-Brutal Input ────────────────────────────────────────── */
export const NeoBrutalInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full border-4 border-black bg-white p-3 font-bold text-black placeholder:text-gray-400 focus:outline-none focus:-translate-y-0.5 transition-all ${className}`}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "4px 4px 0px 0px rgba(0,0,0,1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      {...props}
    />
  );
});
NeoBrutalInput.displayName = "NeoBrutalInput";

/* ── Neo-Brutal Input (compact for inline / table use) ───────── */
export const NeoBrutalInputCompact = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`border-3 border-black bg-white px-2 py-1 text-xs font-bold text-black placeholder:text-gray-400 focus:outline-none transition-all ${className}`}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "2px 2px 0px 0px rgba(0,0,0,1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    />
  );
});
NeoBrutalInputCompact.displayName = "NeoBrutalInputCompact";

/* ── Neo-Brutal Select ───────────────────────────────────────── */
export const NeoBrutalSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`w-full border-4 border-black bg-white p-3 font-bold text-black focus:outline-none focus:-translate-y-0.5 transition-all ${className}`}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "4px 4px 0px 0px rgba(0,0,0,1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      {...props}
    >
      {children}
    </select>
  );
});
NeoBrutalSelect.displayName = "NeoBrutalSelect";

/* ── Neo-Brutal Select (compact for filters) ─────────────────── */
export const NeoBrutalSelectCompact = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`border-3 border-black bg-white px-3 py-1.5 text-sm font-bold text-black focus:outline-none transition-all ${className}`}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "3px 3px 0px 0px rgba(0,0,0,1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
      {...props}
    >
      {children}
    </select>
  );
});
NeoBrutalSelectCompact.displayName = "NeoBrutalSelectCompact";

/* ── Neo-Brutal Button ───────────────────────────────────────── */
export function NeoBrutalButton({
  children,
  disabled = false,
  type = "submit",
  variant = "primary",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "default" | "sm" | "xs";
}) {
  const variantStyles: Record<string, { bg: string; text: string }> = {
    primary: { bg: "#FF6B6B", text: "#ffffff" },
    secondary: { bg: "#60A5FA", text: "#ffffff" },
    outline: { bg: "#ffffff", text: "#000000" },
    destructive: { bg: "#EF4444", text: "#ffffff" },
    ghost: { bg: "transparent", text: "#000000" },
  };

  const sizeClasses: Record<string, string> = {
    default: "px-6 py-3 text-base font-black uppercase",
    sm: "px-4 py-2 text-sm font-bold uppercase",
    xs: "px-2 py-1 text-xs font-bold uppercase",
  };

  const { bg, text } = variantStyles[variant] || variantStyles.primary;
  const borderWidth = size === "xs" ? "border-2" : size === "sm" ? "border-3" : "border-4";
  const shadowSize = size === "xs" ? "2px 2px" : size === "sm" ? "3px 3px" : "4px 4px";

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={
        disabled
          ? {}
          : { scale: 1.02, x: -1, y: -1, boxShadow: `${parseInt(shadowSize) + 2}px ${parseInt(shadowSize) + 2}px 0px 0px rgba(0,0,0,1)` }
      }
      whileTap={
        disabled
          ? {}
          : { scale: 0.98, x: 0, y: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }
      }
      className={`${borderWidth} border-black ${sizeClasses[size]} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
      style={{
        backgroundColor: bg,
        color: text,
        boxShadow: `${shadowSize} 0px 0px rgba(0,0,0,1)`,
      }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

/* ── Neo-Brutal Table ────────────────────────────────────────── */
export function NeoBrutalTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border-4 border-black bg-white" style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}>
      <table className="w-full text-sm font-bold text-black">{children}</table>
    </div>
  );
}

export function NeoBrutalTHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b-4 border-black bg-black text-white uppercase text-xs">
        {children}
      </tr>
    </thead>
  );
}

export function NeoBrutalTH({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left py-3 px-3 font-black ${className}`}>{children}</th>;
}

export function NeoBrutalTBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function NeoBrutalTR({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`border-b-2 border-black/20 hover:bg-yellow-50 transition-colors ${className} ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

export function NeoBrutalTD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-2.5 px-3 ${className}`}>{children}</td>;
}

/* ── Neo-Brutal Stat Card ────────────────────────────────────── */
export function NeoBrutalStatCard({
  label,
  value,
  sub,
  bg = "#FFDE00",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  bg?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="border-4 border-black p-4"
      style={{ backgroundColor: bg, boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase text-black/60">{label}</p>
          <p className="text-3xl font-black text-black mt-1">{value}</p>
          {sub && <p className="text-xs font-bold text-black/50 mt-1 uppercase">{sub}</p>}
        </div>
        {icon && <div className="text-black/40">{icon}</div>}
      </div>
    </motion.div>
  );
}

/* ── Neo-Brutal Link Button ──────────────────────────────────── */
export function NeoBrutalLink({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-bold text-black underline underline-offset-4 hover:text-black/70 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

/* ── Neo-Brutal Error ────────────────────────────────────────── */
export function NeoBrutalError({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="border-4 border-black p-3 text-sm font-bold text-black"
      style={{ backgroundColor: "#FF6B6B33" }}
    >
      {children}
    </div>
  );
}

/* ── Neo-Brutal Success ──────────────────────────────────────── */
export function NeoBrutalSuccess({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="border-4 border-black p-3 text-sm font-bold text-black"
      style={{ backgroundColor: "#4ADE8033" }}
    >
      {children}
    </div>
  );
}

/* ── Neo-Brutal Helper Text ──────────────────────────────────── */
export function NeoBrutalHelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-black/50 mt-1 uppercase">{children}</p>;
}

/* ── Neo-Brutal Badge / Pill ─────────────────────────────────── */
export function NeoBrutalBadge({
  children,
  color = "#60A5FA",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-block border-2 border-black px-2 py-0.5 text-xs font-black uppercase text-black"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
}
