"use client";

import { formatDistanceToNow } from "date-fns";
import { BookOpen } from "lucide-react";
import { Story } from "@/types/story";

interface StoryHistoryProps {
  stories: Story[];
  onLoadStory: (story: Story) => void;
}

export function StoryHistory({ stories, onLoadStory }: StoryHistoryProps) {
  if (!stories.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        No previous stories found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <div
          key={story.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onLoadStory(story)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-medium">{story.title}</h3>
                <p className="text-sm text-gray-500">
                  {story.genre} •{" "}
                  {formatDistanceToNow(new Date(story.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <button className="text-sm text-gray-600 hover:text-black">
              Load
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
