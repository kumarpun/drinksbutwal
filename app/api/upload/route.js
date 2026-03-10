export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return Response.json(
        { success: false, message: "No image provided" },
        { status: 400 }
      );
    }

    // Strip the data URL prefix to get pure base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const apiKey = process.env.FREEIMAGE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, message: "Image upload not configured" },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("source", base64Data);
    formData.append("format", "json");

    const res = await fetch("https://freeimage.host/api/1/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.status_code === 200 && data.image?.url) {
      return Response.json({ success: true, url: data.image.url });
    }

    return Response.json(
      { success: false, message: data.error?.message || "Upload failed" },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to upload image", error: error.message },
      { status: 500 }
    );
  }
}
