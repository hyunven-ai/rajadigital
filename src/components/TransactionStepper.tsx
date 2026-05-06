"use client";

import { Check } from "lucide-react";

export const STEPS = [
  { id: 1, label: "Pilih Game", icon: "🎮", short: "Game" },
  { id: 2, label: "Pilih Paket", icon: "📦", short: "Paket" },
  { id: 3, label: "Isi Formulir", icon: "📝", short: "Formulir" },
  { id: 4, label: "Konfirmasi", icon: "✅", short: "Konfirm" },
  { id: 5, label: "Bayar QRIS", icon: "📱", short: "QRIS" },
  { id: 6, label: "Via WhatsApp", icon: "💬", short: "WhatsApp" },
];

interface TransactionStepperProps {
  currentStep: number; // 1-6
  gameColor?: string;
}

export default function TransactionStepper({ currentStep, gameColor = "#f5c842" }: TransactionStepperProps) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        padding: "20px 16px 16px",
        marginBottom: "24px",
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Langkah {currentStep} dari {STEPS.length}
        </span>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginTop: "2px",
          }}
        >
          {STEPS[currentStep - 1]?.icon} {STEPS[currentStep - 1]?.label}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "var(--bg-secondary)",
          borderRadius: "99px",
          marginBottom: "14px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
            background: `linear-gradient(90deg, ${gameColor}, ${gameColor}cc)`,
            borderRadius: "99px",
            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 8px ${gameColor}60`,
          }}
        />
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        {/* connector line behind dots */}
        <div
          style={{
            position: "absolute",
            top: "13px",
            left: "13px",
            right: "13px",
            height: "2px",
            background: "var(--border)",
            zIndex: 0,
          }}
        />

        {STEPS.map((step) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          const future = step.id > currentStep;

          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                zIndex: 1,
                position: "relative",
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 800,
                  transition: "all 0.3s ease",
                  background: done
                    ? "#10b981"
                    : active
                      ? gameColor
                      : "var(--bg-secondary)",
                  color: done
                    ? "#fff"
                    : active
                      ? "#0a0a14"
                      : "var(--text-muted)",
                  border: future ? "2px solid var(--border)" : "none",
                  boxShadow: active ? `0 0 12px ${gameColor}60` : done ? "0 0 8px rgba(16,185,129,0.4)" : "none",
                  transform: active ? "scale(1.15)" : "scale(1)",
                }}
              >
                {done ? <Check size={13} /> : step.id}
              </div>

              {/* Label — only active and done are visible on mobile */}
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  textAlign: "center",
                  color: active
                    ? "var(--text-primary)"
                    : done
                      ? "#10b981"
                      : "var(--text-muted)",
                  lineHeight: 1.2,
                  maxWidth: "40px",
                  opacity: future ? 0.5 : 1,
                }}
              >
                {step.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
