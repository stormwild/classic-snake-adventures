import { useState, useEffect } from "react";
import theWindhover from "@/assets/ads/the-windhover.jpg";
import shiningInTheDark from "@/assets/ads/shining-in-the-dark.jpg";
import rivenRisen from "@/assets/ads/riven-risen.jpg";
import tymara from "@/assets/ads/tymara.png";

const ads = [
  {
    image: theWindhover,
    title: "The Windhover — Wild Lightning",
    url: "https://artists.landr.com/057914922638",
  },
  {
    image: tymara,
    title: "Tymara — World Clock & Timezone Tracker",
    url: "https://tymara.app/",
  },
  {
    image: shiningInTheDark,
    title: "Shining in the Dark — Wild Lightning",
    url: "https://artists.landr.com/057914922775",
  },
  {
    image: rivenRisen,
    title: "Riven Risen — Wild Lightning",
    url: "https://artists.landr.com/057914939582",
  },
];

const ROTATE_INTERVAL = 5000;

const AdPlaceholder = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const ad = ads[index];

  return (
    <div className="flex flex-col items-center gap-0.5">
      <a
        href={ad.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-sm overflow-hidden border border-border hover:border-primary transition-colors"
        style={{ width: 150, height: 100 }}
        title={`${ad.title} — Wild Lightning`}
      >
        <img
          src={ad.image}
          alt={ad.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </a>
      <span className="text-[8px] text-muted-foreground/50 uppercase tracking-widest">Sponsored</span>
    </div>
  );
};

export default AdPlaceholder;
