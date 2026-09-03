import { weddingConfig } from '../config/weddingConfig.js'
import { weddingImages } from '../config/weddingImages.js'
import LookbookFrame from '../components/LookbookFrame.jsx'
import Reveal from '../components/Reveal.jsx'

export default function StorySection() {
  return (
    <section className="w-story" id="story">
      <Reveal className="w-copy">
        <p className="w-eyebrow">Our story</p>
        <p className="w-pullquote w-pullquote--sm">{weddingConfig.story.subtitle.en.toLowerCase()}</p>
        <h2 className="w-display">{weddingConfig.story.place}</h2>
        <p className="w-prose">{weddingConfig.story.body.ko}</p>
      </Reveal>
      <div className="w-lookbook">
        {weddingImages.story.map((image, index) => (
          <LookbookFrame
            key={image.src}
            image={image}
            ratio={index === 0 ? '5 / 4' : '3 / 4'}
          />
        ))}
      </div>
    </section>
  )
}
