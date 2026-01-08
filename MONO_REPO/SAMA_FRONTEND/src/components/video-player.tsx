"use client";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({
  videoUrl,
  title = "Vidéo du cours",
  poster,
  className = "",
}: VideoPlayerProps) {
  // Extraire l'ID YouTube de l'URL
  const getYouTubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  // Si c'est une vidéo YouTube, utiliser l'iframe intégré
  if (videoId) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

    return (
      <div className={`relative bg-black aspect-video ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Pour les autres types de vidéos (Cloudinary, etc.)
  return (
    <div className={`relative bg-black aspect-video ${className}`}>
      <video
        className="w-full h-full"
        poster={poster}
        controls
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    </div>
  );
}
