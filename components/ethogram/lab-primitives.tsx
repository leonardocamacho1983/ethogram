'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

const ANGLES = [-90, -30, 30, 90, 150, 210].map((angle) => (angle * Math.PI) / 180)

export const MASTER_PROFILE = [22, 20, 9, 19, 16, 21]
export const PASS_PROFILE = [22, 21, 20, 22, 19, 21]
export const FAIL_PROFILE = [21, 19, 8, 20, 17, 18]

export function profilePoint(radius: number, index: number) {
  return {
    x: Math.round((32 + radius * Math.cos(ANGLES[index])) * 10) / 10,
    y: Math.round((32 + radius * Math.sin(ANGLES[index])) * 10) / 10,
  }
}

export function profilePath(radii: number[] = MASTER_PROFILE) {
  return `${radii
    .map((radius, index) => {
      const point = profilePoint(Math.max(8, Math.min(24, radius)), index)
      return `${index ? 'L' : 'M'}${point.x} ${point.y}`
    })
    .join('')}Z`
}

export function profileClip(radii: number[] = MASTER_PROFILE) {
  return `polygon(${radii
    .map((radius, index) => {
      const point = profilePoint(Math.max(8, Math.min(24, radius)), index)
      return `${((point.x / 64) * 100).toFixed(2)}% ${((point.y / 64) * 100).toFixed(2)}%`
    })
    .join(', ')})`
}

type BehaviorProfileProps = {
  activeAxis?: number
  className?: string
  color?: string
  ghostRadii?: number[]
  label?: string
  onAxisChange?: (axis: number) => void
  radii?: number[]
  size?: number
  strokeWidth?: number
}

export function BehaviorProfile({
  activeAxis,
  className,
  color = 'currentColor',
  ghostRadii,
  label = 'Perfil comportamental de seis eixos',
  onAxisChange,
  radii = MASTER_PROFILE,
  size = 96,
  strokeWidth = 2.2,
}: BehaviorProfileProps) {
  return (
    <svg
      aria-label={label}
      className={className}
      height={size}
      role="img"
      viewBox="0 0 64 64"
      width={size}
    >
      {ghostRadii ? (
        <path className="eg-profile-ghost" d={profilePath(ghostRadii)} fill="none" stroke="currentColor" strokeWidth="1" />
      ) : null}
      <path
        className="eg-profile-path"
        d={profilePath(radii)}
        fill="none"
        stroke={color}
        strokeLinejoin="miter"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      {onAxisChange
        ? radii.map((radius, index) => {
            const point = profilePoint(radius, index)
            return (
              <g key={index}>
                <line
                  className={activeAxis === index ? 'eg-profile-axis is-active' : 'eg-profile-axis'}
                  x1="32"
                  x2={point.x}
                  y1="32"
                  y2={point.y}
                />
                <line
                  aria-label={`Eixo ${index + 1}`}
                  className="eg-profile-hit"
                  onFocus={() => onAxisChange(index)}
                  onMouseEnter={() => onAxisChange(index)}
                  role="button"
                  tabIndex={0}
                  x1="32"
                  x2={point.x}
                  y1="32"
                  y2={point.y}
                />
              </g>
            )
          })
        : null}
    </svg>
  )
}

type LabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'small' | 'regular'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
}

export function LabButton({ className = '', size = 'regular', variant = 'secondary', ...props }: LabButtonProps) {
  return <button className={`eg-button eg-button--${variant} eg-button--${size} ${className}`.trim()} {...props} />
}

export function VerdictBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'pass' | 'fail' | 'neutral' | 'critical' | 'running' }) {
  return <span className={`eg-verdict eg-verdict--${tone}`}>{children}</span>
}

export function Specimen({ children, className = '', id, note, title }: { children: ReactNode; className?: string; id: string; note?: string; title: string }) {
  return (
    <article className={`eg-specimen ${className}`.trim()} data-specimen={id}>
      <div className="eg-specimen-label">{id} · {title}</div>
      <div className="eg-specimen-body">{children}</div>
      {note ? <p className="eg-specimen-note">{note}</p> : null}
    </article>
  )
}

export function SectionHeader({ eyebrow, index, title }: { eyebrow: string; index: string; title: string }) {
  return (
    <header className="eg-section-header">
      <span>{index}</span>
      <h2>{title}</h2>
      <p>{eyebrow}</p>
    </header>
  )
}
