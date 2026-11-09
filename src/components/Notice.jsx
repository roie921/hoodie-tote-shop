function Notice({ notice }) {
  if (!notice) return null

  const style =
    notice.type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-sand bg-beige text-ink'

  return (
    <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${style}`}>
      {notice.text}
    </p>
  )
}

export default Notice
