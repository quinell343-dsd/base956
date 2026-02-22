import { useEffect, useState } from 'react';

interface Video {
  id: number;
  prompt: string;
  videoUrl: string;
  createdAt: string;
  likes: number;
}

export default function CommunityFeed() {
      const [videos, setVideos] = useState<Video[]>([]);

  const handleShare = (id: number) => {
    const url = `${window.location.origin}/video/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleLike = async (id: number) => {
    try {
      const response = await fetch(`/api/videos/${id}/like`, {
        method: 'POST',
      });
      const updatedVideo = await response.json();
      setVideos(videos.map(v => v.id === id ? updatedVideo : v));
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/videos');
        const data = await response.json();
        setVideos(data);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-center mb-8">Community Feed</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <video src={video.videoUrl} controls className="w-full h-48 object-cover"></video>
            <div className="p-4">
              <p className="text-sm text-gray-400 truncate">{video.prompt}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">{new Date(video.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                                                      <button onClick={() => handleLike(video.id)} className="text-gray-400 hover:text-white">❤️</button>
                  <button onClick={() => handleShare(video.id)} className="text-gray-400 hover:text-white">🔗</button>
                  <span>{video.likes}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
