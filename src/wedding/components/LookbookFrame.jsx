import WeddingPhoto from './WeddingPhoto.jsx'

export default function LookbookFrame({
  image,
  caption = '',
  ratio = '3 / 4',
  sizes = '100vw',
  loading = 'lazy',
  className = '',
}) {
  if (!image?.src) return null

  return (
    <figure
      className={`w-lookbook__frame${className ? ` ${className}` : ''}`}
      style={{ '--look-ratio': ratio }}
    >
      <WeddingPhoto
        image={image}
        sizes={sizes}
        loading={loading}
        fetchPriority={loading === 'eager' ? 'high' : undefined}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
