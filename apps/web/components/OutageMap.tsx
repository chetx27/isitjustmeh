'use client'

import React, { useMemo } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { ServiceMapData } from '../../../packages/shared/types'

// Ideally you host this JSON on your own CDN or public folder
const INDIA_TOPO_JSON = 'https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.topo.json'

interface OutageMapProps {
  data: ServiceMapData
}

export function OutageMap({ data }: OutageMapProps) {
  const stateValues = useMemo(() => {
    const map = new Map<string, number>()
    let max = 1
    data.states.forEach(s => {
      // ratio of down votes to total
      const ratio = s.total > 0 ? s.down_count / s.total : 0
      map.set(s.state_code, ratio)
      if (ratio > max) max = ratio
    })
    return { map, max }
  }, [data])

  return (
    <div className="w-full h-full min-h-[300px] bg-surface border border-border p-4 relative">
      <h3 className="absolute top-4 left-4 font-disp font-bold text-ink">Outage Heatmap</h3>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1000, center: [80, 22] }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={INDIA_TOPO_JSON}>
          {({ geographies }) =>
            geographies.map(geo => {
              // The id mapping depends heavily on the specific TopoJSON used.
              // Assuming geo.id or geo.properties.ST_NM contains something matchable
              // We'll mock the color mapping here.
              const stateCode = geo.id // simplified
              const ratio = stateValues.map.get(stateCode) || 0
              
              // Map ratio (0 to 1) to an opacity of red
              const fill = ratio > 0 ? `rgba(220, 38, 38, ${Math.max(ratio, 0.1)})` : '#E8E6E0'

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#FF6B00' },
                    pressed: { outline: 'none' }
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
      
      {/* Fallback state list if map fails or isn't detailed enough */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {data.states.filter(s => s.down_count > 0).sort((a,b) => b.down_count - a.down_count).slice(0, 5).map(s => (
          <span key={s.state_code} className="bg-red-50 text-outage px-2 py-1 font-mono">
            {s.state_code}: {s.down_count}
          </span>
        ))}
      </div>
    </div>
  )
}
