package library

import (
	"image"
	"image/jpeg"
	"image/png"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// ResizeNearest resizes an image to the given width and height using Nearest Neighbor interpolation.
func ResizeNearest(img image.Image, width, height int) image.Image {
	bounds := img.Bounds()
	dx := bounds.Dx()
	dy := bounds.Dy()
	if dx == width && dy == height {
		return img
	}

	dst := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		sy := (y * dy) / height
		for x := 0; x < width; x++ {
			sx := (x * dx) / width
			dst.Set(x, y, img.At(bounds.Min.X+sx, bounds.Min.Y+sy))
		}
	}
	return dst
}

// GetThumbnailPath returns the path to the thumbnail of the requested size, generating and caching it if needed.
func GetThumbnailPath(artworkDir, fileName, sizeStr string) (string, error) {
	size, err := strconv.Atoi(sizeStr)
	if err != nil || (size != 128 && size != 256) {
		return filepath.Join(artworkDir, fileName), nil // Fallback to original
	}

	thumbPath := filepath.Join(artworkDir, "cache", sizeStr, fileName)
	if _, err := os.Stat(thumbPath); err == nil {
		return thumbPath, nil // Return cached image
	}

	// Generate thumbnail on-demand
	originalPath := filepath.Join(artworkDir, fileName)
	f, err := os.Open(originalPath)
	if err != nil {
		return originalPath, err
	}
	defer f.Close()

	img, format, err := image.Decode(f)
	if err != nil {
		return originalPath, err
	}

	resized := ResizeNearest(img, size, size)

	// Ensure cache subfolder exists
	os.MkdirAll(filepath.Dir(thumbPath), 0755)

	out, err := os.Create(thumbPath)
	if err != nil {
		return originalPath, err
	}
	defer out.Close()

	if format == "png" || strings.HasSuffix(strings.ToLower(fileName), ".png") {
		err = png.Encode(out, resized)
	} else {
		err = jpeg.Encode(out, resized, &jpeg.Options{Quality: 80})
	}
	if err != nil {
		return originalPath, err
	}

	return thumbPath, nil
}
