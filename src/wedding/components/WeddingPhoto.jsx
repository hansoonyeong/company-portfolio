export default function WeddingPhoto({
  image,
  className = '',
  sizes,
  loading = 'lazy',
  fetchPriority,
}) {
  if (!image?.src) return null

  return (
    <img
      className={className}
      src={image.src}
      srcSet={image.srcSet}
      alt={image.alt || ''}
      loading={loading}
      decoding="async"
      sizes={sizes}
      fetchPriority={fetchPriority}
    />
  )
}
