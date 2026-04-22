'use client'

import React, { useState } from 'react'

export default function SuggestPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      url: formData.get('url'),
      category: formData.get('category'),
      description: formData.get('description')
    }

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/services/suggest' || 'http://localhost:3001/v1/services/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to submit')
      setStatus('success')
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-disp font-extrabold text-ink mb-2">Suggest a Service</h1>
      <p className="text-muted mb-8">Missing something? Let us know what we should track next.</p>
      
      {status === 'success' ? (
        <div className="bg-green-50 border border-ok p-6 text-center">
          <p className="text-ok font-bold uppercase tracking-widest text-sm mb-2">Received</p>
          <p className="text-ink">Thanks for the suggestion! We'll review it shortly.</p>
          <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-bold text-accent hover:underline">Submit another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-border p-8">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-muted mb-2">Service Name</label>
            <input name="name" required className="w-full border border-border p-3 focus:outline-none focus:border-accent" placeholder="e.g. Dream11" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-muted mb-2">Category</label>
            <select name="category" required className="w-full border border-border p-3 focus:outline-none focus:border-accent">
              <option value="telecom">Telecom</option>
              <option value="payments">Payments</option>
              <option value="food">Food & Delivery</option>
              <option value="banking">Banking</option>
              <option value="govt">Govt / Infra</option>
              <option value="streaming">Streaming</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-muted mb-2">URL (optional)</label>
            <input name="url" type="url" className="w-full border border-border p-3 focus:outline-none focus:border-accent" placeholder="https://" />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-muted mb-2">Why add it? (optional)</label>
            <textarea name="description" rows={3} className="w-full border border-border p-3 focus:outline-none focus:border-accent" placeholder="It goes down often..." />
          </div>
          
          {status === 'error' && (
            <p className="text-outage text-sm font-bold">Failed to submit. Please try again.</p>
          )}

          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-ink text-white font-disp font-bold text-lg py-4 hover:bg-black disabled:opacity-50"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      )}
    </div>
  )
}
