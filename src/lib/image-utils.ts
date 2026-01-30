/**
 * Resize an image file to a specified dimension and format on the client side.
 * @param file - The input image file.
 * @param maxWidth - The maximum width of the output image.
 * @param maxHeight - The maximum height of the output image.
 * @param quality - The quality of the JPEG output (0 to 1).
 * @returns A Promise resolving to the resized Blob.
 */
export async function resizeImage(
    file: File,
    maxWidth: number = 300,
    maxHeight: number = 300,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = (e) => {
            reject(e);
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        reader.readAsDataURL(file);
    });
}
