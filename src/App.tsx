/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect } from 'react';
import CommunityFeed from './components/CommunityFeed';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [showFeed, setShowFeed] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState('waveform');
  const [colorScheme, setColorScheme] = useState('neon');
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    };
    checkApiKey();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

    const generateVideo = async () => {
    if (!image || !prompt) return;

    setIsLoading(true);
    setVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });

            const enrichedPromptResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following idea, generate a rich, descriptive, and visually detailed prompt for an AI video generator. Use Google Search to get up-to-date and accurate information if needed. Idea: ${prompt}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const enrichedPrompt = enrichedPromptResponse.text;

      const base64Image = await toBase64(image);

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: enrichedPrompt,
        image: {
          imageBytes: base64Image,
          mimeType: image.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY!,
          },
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
                setVideoUrl(url);

        // Save the video to the database
        await fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: enrichedPrompt, videoUrl: url }),
        });
      }

    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('Requested entity was not found.')) {
        setHasApiKey(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-full h-full bg-gray-900 -z-10"></div>
      <div
        className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"
      >
        <div
          className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-400 opacity-20 blur-[100px]"
        ></div>
      </div>
      <div className="w-full max-w-2xl z-10">
                <div className="absolute top-4 right-4 flex space-x-4">
          <button onClick={() => setShowFeed(!showFeed)} className="text-sm text-gray-400 hover:text-white">
            {showFeed ? 'Generator' : 'Community Feed'}
          </button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white">
            Billing Information
          </a>
        </div>
        <h1 className="text-4xl font-bold text-center mb-8">Music Video Generator</h1>

                        {showFeed ? (
          <CommunityFeed />
        ) : hasApiKey ? (
          <div className="space-y-4">
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium text-gray-400">Upload Image</label>
            <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
          </div>

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-400">Prompt</label>
                        <input id="prompt" type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., a cat playing a guitar in space" className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="visualizer-style" className="block text-sm font-medium text-gray-400">Visualizer Style</label>
              <select id="visualizer-style" value={visualizerStyle} onChange={(e) => setVisualizerStyle(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-800 border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option>waveform</option>
                <option>particle</option>
                <option>abstract</option>
              </select>
            </div>
            <div>
              <label htmlFor="color-scheme" className="block text-sm font-medium text-gray-400">Color Scheme</label>
              <select id="color-scheme" value={colorScheme} onChange={(e) => setColorScheme(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-800 border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option>neon</option>
                <option>pastel</option>
                <option>monochrome</option>
              </select>
            </div>
            <div>
              <label htmlFor="animation-speed" className="block text-sm font-medium text-gray-400">Animation Speed</label>
              <input id="animation-speed" type="range" min="0.5" max="2" step="0.1" value={animationSpeed} onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))} className="mt-1 block w-full" />
            </div>
          </div>

          <button onClick={generateVideo} disabled={isLoading || !image || !prompt} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500">
            {isLoading ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">Please select your Gemini API key to use this application.</p>
            <button onClick={async () => { await window.aistudio.openSelectKey(); setHasApiKey(true); }} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Select API Key
            </button>
          </div>
        )}

        {videoUrl && (
          <div className="mt-8">
            <video src={videoUrl} controls className="w-full rounded-lg"></video>
          </div>
        )}
      </div>
    </div>
  );
}
