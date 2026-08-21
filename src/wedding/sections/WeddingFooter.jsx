import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import LookbookFrame from '../components/LookbookFrame.jsx'

export default function WeddingFooter() {
  return (
    <footer className="w-end" id="ending">
      <LookbookFrame image={weddingImages.ending} ratio="3 / 4" className="w-lookbook__frame--end" />
      <div className="w-copy w-copy--end">
        <p className="w-end__line">{weddingConfig.ending.line}</p>
        <p className="w-end__meta">
          {weddingConfig.ending.date}
          <br />
          {weddingConfig.ending.place}
        </p>
      </div>
    </footer>
  )
}
