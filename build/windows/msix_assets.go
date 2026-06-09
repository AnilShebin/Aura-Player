package main

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"os"
	"path/filepath"
)

func resizeNearest(img image.Image, width, height int) image.Image {
	rect := image.Rect(0, 0, width, height)
	res := image.NewRGBA(rect)
	bounds := img.Bounds()
	dx := bounds.Dx()
	dy := bounds.Dy()
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			srcX := (x * dx) / width
			srcY := (y * dy) / height
			res.Set(x, y, img.At(bounds.Min.X+srcX, bounds.Min.Y+srcY))
		}
	}
	return res
}

func makePadded(img image.Image, canvasW, canvasH, iconH int) image.Image {
	rect := image.Rect(0, 0, canvasW, canvasH)
	canvas := image.NewRGBA(rect)
	// Fill canvas with transparent
	draw.Draw(canvas, canvas.Bounds(), &image.Uniform{color.Transparent}, image.Point{}, draw.Src)

	// Scale icon to iconH x iconH
	scaledIcon := resizeNearest(img, iconH, iconH)

	// Center icon on canvas
	offsetX := (canvasW - iconH) / 2
	offsetY := (canvasH - iconH) / 2
	draw.Draw(canvas, image.Rect(offsetX, offsetY, offsetX+iconH, offsetY+iconH), scaledIcon, image.Point{}, draw.Over)

	return canvas
}

func savePNG(img image.Image, path string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return png.Encode(f, img)
}

func main() {
	iconPath := filepath.Join("build", "appicon.png")
	outDir := filepath.Join("build", "windows", "msix", "Assets")

	file, err := os.Open(iconPath)
	if err != nil {
		fmt.Printf("Error opening appicon.png: %v\n", err)
		os.Exit(1)
	}
	defer file.Close()

	srcImg, err := png.Decode(file)
	if err != nil {
		fmt.Printf("Error decoding appicon.png: %v\n", err)
		os.Exit(1)
	}

	targets := []struct {
		name   string
		width  int
		height int
	}{
		{"StoreLogo.png", 48, 48},
		{"Square150x150Logo.png", 150, 150},
		{"Square44x44Logo.png", 44, 44},
	}

	for _, t := range targets {
		resized := resizeNearest(srcImg, t.width, t.height)
		path := filepath.Join(outDir, t.name)
		if err := savePNG(resized, path); err != nil {
			fmt.Printf("Error saving %s: %v\n", t.name, err)
			os.Exit(1)
		}
		fmt.Printf("Generated: %s (%dx%d)\n", path, t.width, t.height)
	}

	// Generate Wide310x150Logo.png (padded)
	wideLogo := makePadded(srcImg, 310, 150, 120)
	widePath := filepath.Join(outDir, "Wide310x150Logo.png")
	if err := savePNG(wideLogo, widePath); err != nil {
		fmt.Printf("Error saving Wide310x150Logo.png: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Generated: %s (310x150)\n", widePath)

	// Generate SplashScreen.png (padded)
	splashScreen := makePadded(srcImg, 620, 300, 200)
	splashPath := filepath.Join(outDir, "SplashScreen.png")
	if err := savePNG(splashScreen, splashPath); err != nil {
		fmt.Printf("Error saving SplashScreen.png: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Generated: %s (620x300)\n", splashPath)

	// Also generate AppIcon.png for the properties/logo fields (256x256)
	appIcon := resizeNearest(srcImg, 256, 256)
	appIconPath := filepath.Join(outDir, "AppIcon.png")
	if err := savePNG(appIcon, appIconPath); err != nil {
		fmt.Printf("Error saving AppIcon.png: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Generated: %s (256x256)\n", appIconPath)
}
