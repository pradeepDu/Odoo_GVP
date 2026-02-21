"use client";

import { motion } from "framer-motion";
import React from "react";

/* ── Neo-Brutal Card ─────────────────────────────────────────── */
export function NeoBrutalCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-full border-4 border-black p-8 ${className}`}
      style={{
        backgroundColor: "#FFDE00",
        boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Neo-Brutal Title ────────────────────────────────────────── */
export function NeoBrutalTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-4xl font-black uppercase mb-2 tracking-tighter text-black">
      {children}
    </h2>
  );
}

/* ── Neo-Brutal Subtitle ─────────────────────────────────────── */
export function NeoBrutalSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold uppercase text-black/60 mb-8 border-l-4 border-black pl-2">
      {children}
    </p>
  );
}

/* ── Neo-Brutal Label ────────────────────────────────────────── */
export function NeoBrutalLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-bold uppercase mb-2 border-l-4 border-black pl-2 text-black"
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
      className={`w-full border-4 border-black bg-white p-4 font-bold text-black placeholder:text-gray-400 focus:outline-none focus:-translate-y-1 transition-all ${className}`}
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

/* ── Neo-Brutal Select ───────────────────────────────────────── */
export const NeoBrutalSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`w-full border-4 border-black bg-white p-4 font-bold text-black focus:outline-none focus:-translate-y-1 transition-all ${className}`}
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

/* ── Neo-Brutal Button ───────────────────────────────────────── */
export function NeoBrutalButton({
  children,
  disabled = false,
  type = "submit",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={
        disabled
          ? {}
          : { scale: 1.02, x: -2, y: -2, boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)" }
      }
      whileTap={
        disabled
          ? {}
          : { scale: 0.98, x: 0, y: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }
      }
      className="w-full border-4 border-black p-4 text-xl font-black uppercase text-white disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: "#FF6B6B",
        boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
      }}
      {...(props as any)}
    >
      {children}
    </motion.button>
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
