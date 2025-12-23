"use client"

import React from 'react'

interface Entity {
    text: string
    label: string
}

interface EntityHighlighterProps {
    text: string
    entities: Entity[]
}

export function EntityHighlighter({ text, entities }: EntityHighlighterProps) {
    if (!entities.length) return <p className="text-sm leading-relaxed">{text}</p>

    // Sort entities by occurrence in text
    const sortedEntities = [...entities].sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text))

    const parts = []
    let lastIndex = 0

    sortedEntities.forEach((entity, idx) => {
        const startIndex = text.indexOf(entity.text, lastIndex)
        if (startIndex === -1) return

        // Add text before entity
        parts.push(text.substring(lastIndex, startIndex))

        // Add highlighted entity
        const colorClass =
            entity.label === 'DISEASES' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                entity.label === 'DRUGS' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' :
                    entity.label === 'LABS' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' :
                        'bg-accent/50 text-accent-foreground border-border'

        parts.push(
            <span
                key={idx}
                className={`inline-block px-1.5 py-0.5 rounded border text-xs font-medium mx-0.5 transition-colors hover:brightness-95 cursor-help`}
                title={entity.label}
            >
                {entity.text}
            </span>
        )

        lastIndex = startIndex + entity.text.length
    })

    // Add remaining text
    parts.push(text.substring(lastIndex))

    return (
        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 p-4 rounded-lg bg-background/50 border border-border/50">
            {parts}
        </div>
    )
}
