import Link  from "next/link";
import Image from "next/image";
import type { Game } from "@/lib/games";

interface Props {
  games: Game[];
}


export default function GamesGrid({ games }: Props) {
  if (games.length === 0) {
    return (
      <div className="col-span-full text-center py-16" style={{ color: "var(--text-muted)" }}>
        <span className="text-4xl block mb-3">🎮</span>
        <p>Belum ada game tersedia</p>
      </div>
    );
  }

  return (
    <>
      {games.map((game) => (
        <Link
          key={game.slug}
          href={`/games/${game.slug}`}
          id={`game-card-${game.slug}`}
          className="group relative rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl"
          style={{
            border: "1px solid var(--border)",
            willChange: "transform",
            contain: "layout",
            transform: "translateZ(0)", /* GPU layer — isolasi dari layout halaman */
          }}
        >
          {/* Cover image — aspect-square via padding trick agar tidak ada reflow */}
          <div className="relative w-full" style={{ paddingBottom: "100%" }}>
            <Image
              src={game.cover}
              alt={game.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              priority={false}
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)" }}
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {game.isHot && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#ef4444", color: "#fff" }}
                >
                  🔥 HOT
                </span>
              )}
              {game.isNew && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#10b981", color: "#fff" }}
                >
                  ✨ NEW
                </span>
              )}
            </div>

            {/* Currency badge */}
            <div className="absolute bottom-2 right-2">
              <span
                className="text-xs font-semibold px-2 py-1 rounded-lg backdrop-blur-sm"
                style={{
                  background: `${game.color}30`,
                  border:     `1px solid ${game.color}60`,
                  color:       game.color,
                }}
              >
                {game.currencyIcon} {game.currency}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-3" style={{ background: "var(--bg-card)" }}>
            <div
              className="font-bold text-sm leading-tight truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {game.name}
            </div>
            <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {game.publisher}
            </div>

            {/* CTA */}
            <div
              className="mt-2 text-xs font-semibold text-center py-1.5 rounded-lg transition-all"
              style={{
                background: `${game.color}15`,
                color:       game.color,
                border:     `1px solid ${game.color}30`,
              }}
            >
              Top Up →
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}
