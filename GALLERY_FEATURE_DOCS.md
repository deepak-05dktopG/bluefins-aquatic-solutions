# Gallery Management Feature - Documentation

## Overview
Added a complete gallery management system to the Posts page that allows you to upload and manage images for the HomePage gallery section using Cloudinary.

## Features Added

### Backend (Server)

1. **Gallery Model** (`server/src/models/Gallery.js`)
   - Fields: title, description, imageUrl, cloudinaryPublicId, category, displayOrder, isActive
   - Categories: training, events, facilities, achievements, other
   - Timestamps and indexes for performance

2. **Gallery Controller** (`server/src/controllers/galleryController.js`)
   - `createGalleryImage` - Upload new gallery image
   - `getAllGalleryImages` - Get all images with optional filters
   - `getGalleryImageById` - Get single image
   - `updateGalleryImage` - Update image details
   - `deleteGalleryImage` - Delete image
   - `getGalleryStats` - Get statistics

3. **API Routes** (`server/src/routes/api.js`)
   - `GET /api/gallery` - Public route to fetch all gallery images
   - `POST /api/gallery` - Admin route to upload new image
   - `GET /api/gallery/:id` - Get single image
   - `PATCH /api/gallery/:id` - Update image
   - `DELETE /api/gallery/:id` - Delete image
   - `GET /api/gallery/stats` - Get statistics

### Frontend (Client)

1. **Posts Page Enhancement** (`client/src/pages/AdminPanel/Posts.jsx`)
   - Added tabbed interface with two tabs:
     * 📢 Announcements - Existing posts management
     * 🖼️ Gallery - New gallery management
   - Gallery upload form with:
     * Title (optional)
     * Description (optional)
     * Category selection (training/events/facilities/achievements/other)
     * Image upload with preview
     * Cloudinary integration
   - Gallery grid display showing all uploaded images
   - Delete functionality with confirmation
   - Statistics showing total images and active count

2. **Home Page Integration** (`client/src/pages/Home.jsx`)
   - Automatically fetches and displays gallery images from database
   - Shows first 6 images in gallery section
   - Falls back to hardcoded images if no gallery images available
   - Image titles and descriptions shown on hover

## How to Use

### Upload Gallery Images

1. Log in to Admin Panel
2. Navigate to Posts page
3. Click on "🖼️ Gallery" tab
4. Click "Add Gallery Image" button
5. Fill in the form:
   - Title (optional): Brief title for the image
   - Description (optional): Longer description
   - Category: Select appropriate category
   - Image: Choose image file (REQUIRED)
6. Click "Add to Gallery"
7. Image will be uploaded to Cloudinary and saved to database

### Delete Gallery Images

1. In Gallery tab, find the image you want to delete
2. Click "Delete" button on the image card
3. Confirm deletion in the popup
4. Image will be removed from database (and from homepage gallery)

### View Gallery on Homepage

1. Gallery images automatically appear on the homepage
2. First 6 active images are displayed
3. If no images in database, fallback images are shown
4. Hover over images to see titles/descriptions

## API Endpoints

### Gallery Endpoints

```
GET    /api/gallery              - Get all gallery images (Public)
POST   /api/gallery              - Create new gallery image (Admin)
GET    /api/gallery/stats        - Get gallery statistics (Admin)
GET    /api/gallery/:id          - Get single image (Public)
PATCH  /api/gallery/:id          - Update image details (Admin)
DELETE /api/gallery/:id          - Delete image (Admin)
```

### Query Parameters for GET /api/gallery
- `category` - Filter by category (training/events/facilities/achievements/other)
- `isActive` - Filter by active status (true/false)

## Database Schema

```javascript
{
  title: String (max 100 chars, optional),
  description: String (max 500 chars, optional),
  imageUrl: String (required),
  cloudinaryPublicId: String (required),
  category: Enum ['training', 'events', 'facilities', 'achievements', 'other'],
  displayOrder: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Technical Details

- **Image Upload**: Direct upload to Cloudinary using VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET
- **Image Storage**: All images stored in Cloudinary cloud storage
- **Database**: MongoDB with Gallery collection
- **UI Framework**: React with inline styles
- **Notifications**: SweetAlert2 for success/error messages
- **Icons**: React Icons (FaImages, FaImage, FaTrash, etc.)

## Environment Variables Required

Make sure these are set in your `.env` files:

**Client (.env.development / .env.production):**
```
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_API_BASE_URL=your_backend_url
```

**Server (.env):**
```
MONGO_URI=your_mongodb_connection_string
```

## Next Steps

1. Test the gallery upload functionality
2. Upload some real swimming/pool images
3. Verify they appear on the homepage
4. Customize categories if needed
5. Deploy changes to production (Render + Netlify)

## Notes

- Gallery images are displayed in order of displayOrder then createdAt (newest first)
- Only active images (isActive: true) are shown on homepage
- Maximum 6 images displayed on homepage gallery section
- All images are responsive and optimized for different screen sizes
- Delete operation removes entry from database but keeps image in Cloudinary (can be enhanced to delete from Cloudinary too)
