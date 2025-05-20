package org.spring.framework.ai.vaadin.ui.util;

import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;

/** Utility class for image operations. */
public class ImageUtils {

  /**
   * Creates a thumbnail from the provided image data.
   *
   * @param imageData The original image data as byte array
   * @param contentType The content type of the image (e.g., "image/jpeg", "image/png")
   * @param thumbWidth The width of the thumbnail
   * @param thumbHeight The height of the thumbnail
   * @return The thumbnail as byte array, or the original data if thumbnail creation fails
   */
  public static byte[] createThumbnail(
      byte[] imageData, String contentType, int thumbWidth, int thumbHeight) {
    try {
      var bis = new ByteArrayInputStream(imageData);
      var originalImage = ImageIO.read(bis);

      // Create thumbnail image
      var thumbnailImage = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.TYPE_INT_RGB);
      var g = thumbnailImage.createGraphics();
      g.setRenderingHint(
          RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
      g.drawImage(originalImage, 0, 0, thumbWidth, thumbHeight, null);
      g.dispose();

      // Convert thumbnail to byte array
      var bos = new ByteArrayOutputStream();
      // Extract format from contentType (e.g., "jpeg" from "image/jpeg")
      var format = contentType.substring(6);
      ImageIO.write(thumbnailImage, format, bos);
      return bos.toByteArray();
    } catch (IOException e) {
      // Fallback to original image if thumbnail creation fails
      System.err.println("Failed to create thumbnail: " + e.getMessage());
      return imageData;
    }
  }
}
