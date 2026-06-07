import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import heroImg from './assets/hero.png';
import module1Img from './assets/module1.png';
import module2Img from './assets/module2.png';

type HelixPlane = {
  image: string;
  label: string;
  angle: number;
  baseY: number;
  x: number;
  z: number;
  tilt: number;
  scale: number;
  width: number;
  height: number;
};

const sourceImages = [module1Img, heroImg, module2Img, heroImg, module1Img, module2Img];

const copySteps = [
  {
    kicker: '01 / Stack',
    title: 'Images peel into depth.',
    body: 'A vertical field holds the frames while the page scroll pulls a fresh image band into view.',
  },
  {
    kicker: '02 / Loop',
    title: 'The helix never empties.',
    body: 'The image bands repeat above and below the viewport, so the column feels continuous instead of exiting the scene.',
  },
  {
    kicker: '03 / Reveal',
    title: 'Copy enters in beats.',
    body: 'Each left-side line replaces the last as the media keeps rising, keeping the experiment focused on motion and timing.',
  },
  {
    kicker: '04 / Flow',
    title: 'Scroll keeps feeding it.',
    body: 'The final beat keeps the same upward travel, preserving the illusion that the gallery continues past the page.',
  },
];

const HELIX_WRAP_HEIGHT = 1900;
const HELIX_HALF_WRAP_HEIGHT = HELIX_WRAP_HEIGHT / 2;
const HELIX_SCROLL_SPEED = 0.86;
const HELIX_PLANE_COUNT = 26;

const seeded = (index: number, salt: number) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const wrapPlaneY = (y: number) => (
  ((((y + HELIX_HALF_WRAP_HEIGHT) % HELIX_WRAP_HEIGHT) + HELIX_WRAP_HEIGHT) % HELIX_WRAP_HEIGHT)
  - HELIX_HALF_WRAP_HEIGHT
);

const helixPlanes: HelixPlane[] = Array.from({ length: HELIX_PLANE_COUNT }, (_, index) => {
  const wide = index % 5 === 0;
  const tall = index % 3 === 0;
  const slotY = -HELIX_HALF_WRAP_HEIGHT + index * (HELIX_WRAP_HEIGHT / HELIX_PLANE_COUNT);
  const jitterY = (seeded(index, 1) - 0.5) * 58;

  return {
    image: sourceImages[index % sourceImages.length],
    label: `Helix image ${index + 1}`,
    angle: index * 137.5 + (seeded(index, 2) - 0.5) * 44,
    baseY: slotY + jitterY,
    x: (seeded(index, 3) - 0.5) * 190,
    z: 280 + seeded(index, 4) * 190,
    tilt: (seeded(index, 5) - 0.5) * 10,
    scale: 0.88 + seeded(index, 6) * 0.28,
    width: wide ? 214 : 156 + seeded(index, 7) * 34,
    height: wide ? 128 : tall ? 218 : 184,
  };
});

export default function GalleryPage() {
  const pageRef = useRef<HTMLElement>(null);
  const planeRefs = useRef<(HTMLElement | null)[]>([]);
  const metricsRef = useRef({ scrollableDistance: 1, sectionTop: 0 });
  const [activeCopy, setActiveCopy] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measureSection = () => {
      if (!pageRef.current) {
        return;
      }

      metricsRef.current = {
        scrollableDistance: Math.max(pageRef.current.offsetHeight - window.innerHeight, 1),
        sectionTop: pageRef.current.offsetTop,
      };
    };

    const updateScrollState = () => {
      if (!pageRef.current) {
        return;
      }

      const distanceThroughSection = Math.max(window.scrollY - metricsRef.current.sectionTop, 0);
      const nextProgress = Math.min(distanceThroughSection / metricsRef.current.scrollableDistance, 1);
      const nextLoopY = distanceThroughSection * HELIX_SCROLL_SPEED;
      const nextActiveCopy = Math.min(copySteps.length - 1, Math.floor(nextProgress * copySteps.length));

      pageRef.current.style.setProperty('--gallery-progress', nextProgress.toString());
      planeRefs.current.forEach((plane, index) => {
        if (!plane) {
          return;
        }

        plane.style.setProperty('--y', `${wrapPlaneY(helixPlanes[index].baseY - nextLoopY).toFixed(2)}px`);
      });
      setActiveCopy((currentActiveCopy) => (currentActiveCopy === nextActiveCopy ? currentActiveCopy : nextActiveCopy));
    };

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateScrollState);
    };

    const handleResize = () => {
      measureSection();
      handleScroll();
    };

    measureSection();
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main
      className="gallery-page"
      ref={pageRef}
      aria-label="3D image helix experiment"
    >
      <div className="gallery-sticky-scene">
        <h1 className="sr-only">3D image helix experiment</h1>
        <div className="gallery-helix-vignette" aria-hidden="true" />

        <section className="gallery-copy-rail" aria-live="polite">
          {copySteps.map((step, index) => (
            <article
              className={`gallery-copy-step ${index === activeCopy ? 'is-active' : ''}`}
              key={step.kicker}
            >
              <span>{step.kicker}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </article>
          ))}
        </section>

        <section className="gallery-helix-stage" aria-label="Rotating image gallery">
          <div className="gallery-helix-world">
            <div className="gallery-helix-core">
              {helixPlanes.map((plane, index) => (
                <figure
                  className="gallery-helix-plane"
                  key={plane.label}
                  ref={(node) => {
                    planeRefs.current[index] = node;
                  }}
                  style={
                    {
                      '--angle': `${plane.angle}deg`,
                      '--y': `${plane.baseY}px`,
                      '--x': `${plane.x}px`,
                      '--z': `${plane.z}px`,
                      '--tilt': `${plane.tilt}deg`,
                      '--scale': plane.scale,
                      '--plane-width': `${plane.width}px`,
                      '--plane-height': `${plane.height}px`,
                    } as CSSProperties
                  }
                >
                  <img src={plane.image} alt="" decoding="async" draggable={false} />
                </figure>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
