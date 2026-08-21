import { weddingImages } from '../config/weddingImages.js'
import LookbookFrame from '../components/LookbookFrame.jsx'

export default function GallerySection() {
  return (
    <section className="w-gallery" id="gallery" aria-label="Gallery">
      <div className="w-lookbook">
        {weddingImages.gallery.map((image) => (
          <LookbookFrame key={image.src} image={image} ratio="3 / 4" />
        ))}
      </div>
    </section>
  )
}
