# Secret of the Sea Story Assets

This folder contains the assets for the "Secret of the Sea" video story.

## ✏️ Required Files to Add

Currently, a placeholder image is being used. To display the actual story with custom branding, add these files:

1. **cover.png** - Story card thumbnail image
   - Recommended size: 1280x800px (16:10 aspect ratio) or 1920x1080px
   - Format: PNG or JPG
   - Purpose: Displays as the story card thumbnail on the home page
   - **How to add**: Replace the placeholder by creating this file

2. **video.mp4** - The video content to play
   - Format: MP4 video file
   - Recommended resolution: 1920x1080 (1080p) or 1280x720 (720p)
   - Audio: Recommended for educational content
   - **How to add**: Place your MP4 file in this directory

## 📝 How to Add Your Files

### Option 1: Direct File Replacement
1. Copy your cover image file to this directory and name it exactly: `cover.png`
2. Copy your video file to this directory and name it exactly: `video.mp4`

### Option 2: Update Stories Data
If you want to use different filenames or paths, edit `client/src/data/stories.js` and update the story object:

```javascript
{
  id: "secret-of-the-sea",
  title: "Secret of the Sea",
  description: "Dive into the ocean and uncover magical secrets beneath the waves.",
  emoji: "🌊",
  thumbnail: yourImportedImage,  // Update this
  theme: "#42B8FF",
  videoPath: "/path/to/your/video.mp4",  // Update this
  duration: "MM:SS",  // Update duration
}
```

## ➕ Adding More Video Stories

To add additional stories, follow this pattern:

### 1. Create Story Folder
```
client/src/assets/stories/{story-slug}/
  ├── cover.png
  ├── video.mp4
  └── README.md (optional)
```

### 2. Update Stories Data File
Edit `client/src/data/stories.js`:

```javascript
import newStoryCover from "../assets/stories/new_story/cover.png";

export const stories = [
  // ... existing stories
  {
    id: "new-story-id",
    title: "New Story Title",
    description: "Brief description of the story",
    emoji: "🎬",  // Thematic emoji
    thumbnail: newStoryCover,
    theme: "#HexColorCode",  // e.g., "#FF6B9D"
    videoPath: "/src/assets/stories/new_story/video.mp4",
    duration: "MM:SS",  // e.g., "15:45"
  },
];
```

### 3. The New Story Auto-Appears
Once added to `stories.js`, the story will automatically appear in the "LEARN BY VIDEOS" section on the home page.

## 🎨 Theme Color Suggestions

- Ocean/Water stories: `#42B8FF` (light blue)
- Adventure stories: `#FF9D5C` (orange)
- Nature stories: `#7CFC00` (lime)
- Space stories: `#7b2ff7` (purple)
- Fantasy stories: `#FF6B9D` (pink)

## 📱 Design Notes

- Story cards are responsive and display in a 3-column grid on desktop
- On tablets, they show in 2 columns
- On mobile, they display as a single column
- Cards have hover effects with play button overlay
- Videos include native HTML5 player controls (play, pause, volume, fullscreen)

## ✅ Testing

After adding your files:
1. Run `npm run dev` in the client directory
2. Navigate to the home page
3. Scroll to "LEARN BY VIDEOS" section
4. Click a story card to test the video player
5. Verify the video plays correctly with all controls working

