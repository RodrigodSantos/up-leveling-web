import type { CSSProperties } from 'react'

// Partículas com posição, tamanho e ritmo variados. Calculadas uma vez a partir do índice (sem Math.random):
// a tela fica igual a cada visita e não muda entre uma renderização e outra.
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100, // espalha de 0 a 100% sem repetir em sequência
  size: 2 + (i % 3),
  duration: 9 + ((i * 7) % 8),
  delay: -((i * 13) % 14), // negativo: a animação já começa "no meio", sem a tela vazia no início
}))

/**
 * Fundo da tela de entrada: grade em perspectiva (um "piso" que some no horizonte), brilho na cor de destaque
 * e partículas de luz subindo. Puramente decorativo: aria-hidden e sem receber cliques.
 */
export function SystemBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Brilho central na cor de destaque */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--brand)_18%,transparent),transparent_65%)]" />

      {/* Grade: inclinada em 3D (rotateX) e apagada nas bordas pela máscara */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 [perspective:400px]">
        <div
          className="absolute inset-0 origin-bottom [transform:rotateX(60deg)] [mask-image:linear-gradient(to_top,black,transparent)]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in oklab, var(--brand) 35%, transparent) 1px, transparent 1px),' +
              'linear-gradient(90deg, color-mix(in oklab, var(--brand) 35%, transparent) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {PARTICLES.map((particle, i) => (
        <span
          key={i}
          data-motion
          // motion-reduce:hidden: paradas, as partículas seriam só pontos no rodapé; melhor nem mostrar
          className="bg-brand absolute bottom-0 rounded-full shadow-[0_0_8px_var(--brand)] motion-reduce:hidden"
          style={
            {
              left: `${particle.left}%`,
              width: particle.size,
              height: particle.size,
              animation: `system-rise ${particle.duration}s linear ${particle.delay}s infinite`,
            } satisfies CSSProperties
          }
        />
      ))}
    </div>
  )
}
