'use client'

import React, { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export function LiveCounter({ value, className = '' }: { value: number; className?: string }) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 })
  const displayValue = useTransform(spring, (curr) => Math.round(curr).toLocaleString())

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return (
    <motion.span className={`font-mono tabular-nums ${className}`}>
      {displayValue}
    </motion.span>
  )
}
