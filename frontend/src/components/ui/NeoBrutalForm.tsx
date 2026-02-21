"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface NeoBrutalFormProps {
    title?: string;
    fields?: Array<{ label: string; type?: string }>;
    buttonText?: string;
    onSubmit?: (data: Record<string, string>) => void;
    maxWidth?: string;
    backgroundColor?: string;
    cardBgColor?: string;
    borderColor?: string;
    shadowColor?: string;
    titleColor?: string;
    labelColor?: string;
    inputBgColor?: string;
    inputBorderColor?: string;
    inputTextColor?: string;
    inputPlaceholderColor?: string;
    inputFocusShadowColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    buttonBorderColor?: string;
    buttonShadowColor?: string;
    buttonHoverShadowColor?: string;
    className?: string;
}

export const NeoBrutalForm: React.FC<NeoBrutalFormProps> = ({
    title = "Join the Cult",
    fields = [
        { label: "Username", type: "text" },
        { label: "Email Address", type: "text" },
        { label: "Secret Code", type: "password" },
    ],
    buttonText = "Submit Data",
    onSubmit,
    maxWidth = "28rem",
    backgroundColor = "#E0E7FF",
    cardBgColor = "#FFDE00",
    borderColor = "#000000",
    shadowColor = "rgba(0,0,0,1)",
    titleColor = "#000000",
    labelColor = "#000000",
    inputBgColor = "#ffffff",
    inputBorderColor = "#000000",
    inputTextColor = "#000000",
    inputPlaceholderColor = "#9ca3af",
    inputFocusShadowColor = "rgba(0,0,0,1)",
    buttonBgColor = "#FF6B6B",
    buttonTextColor = "#ffffff",
    buttonBorderColor = "#000000",
    buttonShadowColor = "rgba(0,0,0,1)",
    buttonHoverShadowColor = "rgba(0,0,0,1)",
    className = "",
}) => {
    const [formData, setFormData] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(formData);
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-8 font-mono"
            style={{ backgroundColor }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full border-4 p-8 ${className}`}
                style={{
                    maxWidth,
                    backgroundColor: cardBgColor,
                    borderColor,
                    boxShadow: `8px 8px 0px 0px ${shadowColor}`,
                }}
            >
                <h2
                    className="text-4xl font-black uppercase mb-8 tracking-tighter"
                    style={{ color: titleColor }}
                >
                    {title}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {fields.map((field, i) => (
                        <div key={i} className="relative group">
                            <label
                                className="block text-sm font-bold uppercase mb-2 border-l-4 pl-2"
                                style={{
                                    borderLeftColor: borderColor,
                                    color: labelColor,
                                }}
                            >
                                {field.label}
                            </label>
                            <input
                                type={field.type || "text"}
                                value={formData[field.label] || ""}
                                onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                                className="w-full border-4 p-4 font-bold focus:outline-none focus:-translate-y-1 transition-all text-black"
                                style={{
                                    backgroundColor: inputBgColor,
                                    borderColor: inputBorderColor,
                                    color: inputTextColor,
                                }}
                                placeholder={`ENTER ${field.label.toUpperCase()}`}
                                onFocus={(e) => {
                                    e.currentTarget.style.boxShadow = `4px 4px 0px 0px ${inputFocusShadowColor}`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.boxShadow = "none";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            />
                        </div>
                    ))}
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02, x: -2, y: -2, boxShadow: `6px 6px 0px 0px ${buttonHoverShadowColor}` }}
                        whileTap={{ scale: 0.98, x: 0, y: 0, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }}
                        className="w-full border-4 p-4 text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        style={{
                            backgroundColor: buttonBgColor,
                            color: buttonTextColor,
                            borderColor: buttonBorderColor,
                        }}
                    >
                        {buttonText}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};