const P: Record<string, string> = {
  plus: 'M12 5v14M5 12h14',
  menu: 'M4 8h16M4 16h10',
  close: 'M6 6l12 12M18 6L6 18',
  next: 'M14 6l-6 6 6 6',
  prev: 'M10 6l6 6-6 6',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  image: 'M4 6h16v12H4zM4 16l5-5 4 4 3-3 4 4',
  video: 'M4 7h11v10H4zM15 11l5-3v8l-5-3',
  audio: 'M12 4v10M8 8v4M16 8v4M5 10v0M19 10v0M12 17v3M9 20h6',
  mic: 'M12 4a3 3 0 013 3v5a3 3 0 01-6 0V7a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v3',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 9l5-5 5 5M5 20h14',
  sparkle: 'M12 4c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z',
  check: 'M5 12.5l4.5 4.5L19 7',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  photos: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M9 9.5h.01',
  sprout: 'M12 21v-9M12 12c0-4-3-6-7-6 0 4 2 6 7 6zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z',
  lock: 'M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z',
  play: 'M8 5l11 7-11 7z',
  calendar: 'M5 6h14v14H5zM5 10h14M9 4v4M15 4v4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  pause: 'M8 6v12M16 6v12',
  slideshow: 'M4 5h16v11H4zM9 20h6M12 16v4M10 8.5v4l4-2z',
  share: 'M12 4v11M8 8l4-4 4 4M5 13v7h14v-7',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  stop: 'M7 7h10v10H7z',
};

export default function Icon({ name, size = 22 }: { name: keyof typeof P; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}


