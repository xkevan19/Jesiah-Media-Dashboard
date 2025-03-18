/* --- Table of Contents ---
 1. Initialization
    1.1. DOM Element Caching
    1.2. State Variables
 2. Helper Functions
    2.1. toggleSidebar
    2.2. formatFileSize
    2.3. updateBulkDownloadButton
 3. Event Listeners
    3.1. Sidebar
    3.2. Back to Top
    3.3. Resize Settings
    3.4. Dropzone
    3.5. Conversion
 4. File Handling
    4.1. handleFiles
    4.2. createFileItem
    4.3. getResizeSettings
 5. Conversion
    5.1. convertFile
    5.2. convertAllFiles
    5.3. finishConversion
    5.4. createConvertedItem
 6. Download
    6.1. downloadFile
    6.2. downloadAllFiles
 7. Reset
    7.1. resetForMoreConversion
 8. UI Update
    8.1. updateUI
--- END --- */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialization

  // 1.1. DOM Element Caching
  const elements = {
    openSidebarBtn: document.getElementById("openSidebar"),
    closeSidebarBtn: document.getElementById("closeSidebar"),
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    backToTopBtn: document.getElementById("backToTopBtn"),
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    browseButton: document.getElementById("browseButton"),
    fileList: document.getElementById("fileList"),
    convertAllButton: document.getElementById("convertAllButton"),
    convertedList: document.getElementById("convertedList"),
    conversionArea: document.getElementById("conversionArea"),
    convertedArea: document.getElementById("convertedArea"),
    bulkDownloadButton: document.getElementById("bulkDownloadButton"),
    convertMoreButton: document.getElementById("convertMoreButton"),
    conversionProgress: document.getElementById("conversionProgress"),
    conversionCounter: document.getElementById("conversionCounter"),
    totalFiles: document.getElementById("totalFiles"),
    enableResize: document.getElementById("enableResize"),
    resizeOptions: document.getElementById("resizeOptions"),
    resizePercentage: document.getElementById("resizePercentage"),
    resizeDimensions: document.getElementById("resizeDimensions"),
    percentageResize: document.getElementById("percentageResize"),
    dimensionsResize: document.getElementById("dimensionsResize"),
    scalePercentage: document.getElementById("scalePercentage"),
    scaleValue: document.getElementById("scaleValue"),
    maxWidth: document.getElementById("maxWidth"),
    maxHeight: document.getElementById("maxHeight"),
    maintainAspectRatio: document.getElementById("maintainAspectRatio"),
    qualitySlider: document.getElementById("qualitySlider"),
    qualityValue: document.getElementById("qualityValue"),
  };

  // 1.2. State Variables
  let uploadedFiles = [];
  let convertedFiles = [];
  let conversionInProgress = false;

  // 2. Helper Functions

  // 2.1. toggleSidebar
  const toggleSidebar = (isOpen) => {
    elements.sidebar.classList.toggle("-translate-x-full", !isOpen);
    elements.overlay.classList.toggle("hidden", !isOpen);
    document.body.classList.toggle("overflow-hidden", isOpen);
    document.body.classList.toggle("md:overflow-auto", isOpen);
  };

  // 2.2. formatFileSize
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // 2.3. updateBulkDownloadButton
  const updateBulkDownloadButton = () => {
    elements.bulkDownloadButton.classList.toggle(
      "hidden",
      convertedFiles.length === 0
    );
    const classes = ["blue-gradient", "hover:bg-green-700"];
    elements.bulkDownloadButton.classList.add(...classes);
  };

  // 3. Event Listeners

  // 3.1. Sidebar
  elements.openSidebarBtn?.addEventListener("click", () => toggleSidebar(true));
  elements.closeSidebarBtn?.addEventListener("click", () =>
    toggleSidebar(false)
  );
  elements.overlay?.addEventListener("click", () => toggleSidebar(false));

  // 3.2. Back to Top
  const handleScroll = () => {
    elements.backToTopBtn.classList.toggle("opacity-0", window.scrollY <= 300);
    elements.backToTopBtn.classList.toggle("invisible", window.scrollY <= 300);
    elements.backToTopBtn.classList.toggle("opacity-100", window.scrollY > 300);
    elements.backToTopBtn.classList.toggle("visible", window.scrollY > 300);
  };

  window.addEventListener("scroll", handleScroll);
  elements.backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 3.3. Resize Settings
  elements.enableResize.addEventListener("change", () => {
    elements.resizeOptions.classList.toggle(
      "opacity-50",
      !elements.enableResize.checked
    );
    elements.resizeOptions.classList.toggle(
      "pointer-events-none",
      !elements.enableResize.checked
    );
  });

  elements.resizePercentage.addEventListener("change", () => {
    elements.percentageResize.classList.remove("hidden");
    elements.dimensionsResize.classList.add("hidden");
  });

  elements.resizeDimensions.addEventListener("change", () => {
    elements.percentageResize.classList.add("hidden");
    elements.dimensionsResize.classList.remove("hidden");
  });

  elements.scalePercentage.addEventListener("input", () => {
    elements.scaleValue.textContent = elements.scalePercentage.value;
  });

  elements.qualitySlider.addEventListener("input", () => {
    elements.qualityValue.textContent = elements.qualitySlider.value;
  });

  // 3.4. Dropzone
  const handleDragOver = (e) => {
    e.preventDefault();
    elements.dropzone.classList.add("dropzone-active");
  };

  const handleDragLeave = () => {
    elements.dropzone.classList.remove("dropzone-active");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    elements.dropzone.classList.remove("dropzone-active");
    handleFiles(e.dataTransfer.files);
  };

  elements.dropzone.addEventListener("dragover", handleDragOver);
  elements.dropzone.addEventListener("dragleave", handleDragLeave);
  elements.dropzone.addEventListener("drop", handleDrop);
  elements.browseButton.addEventListener("click", () =>
    elements.fileInput.click()
  );
  elements.fileInput.addEventListener("change", (e) =>
    handleFiles(e.target.files)
  );

  // 3.5. Conversion
  elements.convertAllButton.addEventListener("click", convertAllFiles);
  elements.bulkDownloadButton.addEventListener("click", downloadAllFiles);
  elements.convertMoreButton.addEventListener("click", resetForMoreConversion);

  // 4. File Handling

  // 4.1. handleFiles
  function handleFiles(files) {
    if (files.length === 0) return;

    elements.conversionArea.classList.remove("hidden");

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    const newFiles = imageFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      converted: false,
    }));

    uploadedFiles.push(...newFiles);
    newFiles.forEach((fileData) => createFileItem(fileData.file, fileData.id));
  }

  // 4.2. createFileItem
  function createFileItem(file, fileId) {
    const fileSize = formatFileSize(file.size);
    const fileItem = document.createElement("div");
    fileItem.id = fileId;
    fileItem.className =
      "flex items-center justify-between bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition";

    const reader = new FileReader();
    reader.onload = (e) => {
      fileItem.innerHTML = `
              <div class="flex items-center space-x-3">
                  <div class="h-12 w-12 overflow-hidden rounded-md bg-zinc-700 flex-shrink-0">
                      <img src="${e.target.result}" alt="${file.name}" class="h-full w-full object-cover">
                  </div>
                  <div>
                      <h3 class="text-zinc-200 font-medium truncate max-w-xs">${file.name}</h3>
                      <p class="text-zinc-400 text-sm">${fileSize}</p>
                  </div>
              </div>
              <button class="convert-btn px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition" data-id="${fileId}">
                  Convert
              </button>
          `;

      fileItem
        .querySelector(".convert-btn")
        .addEventListener("click", () => convertFile(fileId));
    };
    reader.readAsDataURL(file);

    elements.fileList.appendChild(fileItem);
  }

  // 4.3. getResizeSettings
  function getResizeSettings() {
    return {
      enabled: elements.enableResize.checked,
      method: elements.resizePercentage.checked ? "percentage" : "dimensions",
      scale: parseInt(elements.scalePercentage.value) / 100,
      maxWidth: parseInt(elements.maxWidth.value),
      maxHeight: parseInt(elements.maxHeight.value),
      maintainAspectRatio: elements.maintainAspectRatio.checked,
      quality: parseInt(elements.qualitySlider.value) / 100,
    };
  }

  // 5. Conversion

  // 5.1. convertFile
  function convertFile(fileId) {
    const fileData = uploadedFiles.find((f) => f.id === fileId);
    if (!fileData || fileData.converted) return;

    const file = fileData.file;
    const settings = getResizeSettings();

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (settings.enabled) {
        if (settings.method === "percentage") {
          width = Math.round(img.width * settings.scale);
          height = Math.round(img.height * settings.scale);
        } else {
          const aspectRatio = img.width / img.height;
          if (settings.maintainAspectRatio) {
            width = Math.min(settings.maxWidth, img.width);
            height = Math.round(width / aspectRatio);
            if (height > settings.maxHeight) {
              height = settings.maxHeight;
              width = Math.round(height * aspectRatio);
            }
          } else {
            width = Math.min(settings.maxWidth, img.width);
            height = Math.min(settings.maxHeight, img.height);
          }
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const originalDimensions = { width: img.width, height: img.height };
      const newDimensions = { width, height };

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Error: toBlob resulted in a null blob.");
            return;
          }

          const convertedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".webp"),
            { type: "image/webp" }
          );

          Object.assign(fileData, {
            converted: true,
            convertedFile,
            originalDimensions,
            newDimensions,
          });

          convertedFiles.push({
            id: fileId,
            originalFile: file,
            convertedFile,
            originalDimensions,
            newDimensions,
          });

          createConvertedItem(
            file,
            convertedFile,
            fileId,
            originalDimensions,
            newDimensions
          );
          updateUI();

          const fileItem = document.getElementById(fileId);
          if (fileItem) {
            const convertBtn = fileItem.querySelector(".convert-btn");
            if (convertBtn) {
              convertBtn.textContent = "Converted";
              convertBtn.classList.remove(
                "bg-indigo-600",
                "hover:bg-indigo-700"
              );
              convertBtn.classList.add("blue-gradient", "cursor-default");
              convertBtn.disabled = true;
            }
          }

          if (conversionInProgress) {
            elements.conversionCounter.textContent =
              parseInt(elements.conversionCounter.textContent) + 1;
            if (
              parseInt(elements.conversionCounter.textContent) ===
              parseInt(elements.totalFiles.textContent)
            ) {
              finishConversion();
            }
          }
        },
        "image/webp",
        settings.quality
      );
    };
    img.onerror = (error) => {
      console.error("Image load error:", error);
    };
    img.src = URL.createObjectURL(file);
  }

  // 5.2. convertAllFiles
  function convertAllFiles() {
    const unconverted = uploadedFiles.filter((f) => !f.converted);
    if (unconverted.length === 0) return;

    elements.conversionArea.classList.add("hidden");
    elements.conversionProgress.classList.remove("hidden");
    elements.conversionCounter.textContent = "0";
    elements.totalFiles.textContent = unconverted.length;
    conversionInProgress = true;

    unconverted.forEach((file) => convertFile(file.id));
  }

  // 5.3. finishConversion
  function finishConversion() {
    setTimeout(() => {
      elements.conversionProgress.classList.add("hidden");
      elements.convertedArea.classList.remove("hidden");
      conversionInProgress = false;
      updateUI();
    }, 800);
  }

  // 5.4. createConvertedItem
  function createConvertedItem(
    originalFile,
    convertedFile,
    fileId,
    originalDimensions,
    newDimensions
  ) {
    elements.convertedArea.classList.remove("hidden");

    const originalSize = formatFileSize(originalFile.size);
    const convertedSize = formatFileSize(convertedFile.size);
    const reduction = Math.round(
      (1 - convertedFile.size / originalFile.size) * 100
    );

    const dimensionsChanged =
      originalDimensions.width !== newDimensions.width ||
      originalDimensions.height !== newDimensions.height;
    const dimensionInfo = dimensionsChanged
      ? `${originalDimensions.width}×${originalDimensions.height} → ${newDimensions.width}×${newDimensions.height}`
      : `${newDimensions.width}×${newDimensions.height}`;

    const convertedItem = document.createElement("div");
    convertedItem.className =
      "flex items-center justify-between bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition";

    const reader = new FileReader();
    reader.onload = (e) => {
      convertedItem.innerHTML = `
              <div class="flex items-center space-x-3">
                  <div class="h-12 w-12 overflow-hidden rounded-md bg-zinc-700 flex-shrink-0">
                      <img src="${e.target.result}" alt="${convertedFile.name}" class="h-full w-full object-cover">
                  </div>
                  <div>
                      <h3 class="text-zinc-200 font-medium truncate max-w-xs">${convertedFile.name}</h3>
                      <div class="flex space-x-2 text-sm">
                          <span class="text-zinc-400">${convertedSize}</span>
                          <span class="text-green-500">-${reduction}%</span>
                      </div>
                      <div class="text-zinc-500 text-xs">${dimensionInfo}</div>
                  </div>
              </div>
              <button class="download-btn px-3 py-1 blue-gradient text-white text-sm rounded hover:bg-green-700 transition" data-id="${fileId}">
                  Download
              </button>
          `;

      convertedItem
        .querySelector(".download-btn")
        .addEventListener("click", () => downloadFile(fileId));
    };
    reader.readAsDataURL(convertedFile);

    elements.convertedList.appendChild(convertedItem);
  }

  // 6. Download

  // 6.1. downloadFile
  function downloadFile(fileId) {
    const fileData = convertedFiles.find((f) => f.id === fileId);
    if (!fileData) return;

    const url = URL.createObjectURL(fileData.convertedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileData.convertedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 6.2. downloadAllFiles
  async function downloadAllFiles() {
    if (convertedFiles.length === 0) return;

    elements.bulkDownloadButton.innerHTML = `
        <span class="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
        Preparing ZIP...
    `;
    elements.bulkDownloadButton.disabled = true;

    const zip = new JSZip();

    await Promise.all(
      convertedFiles.map(async (fileData) => {
        const response = await fetch(
          URL.createObjectURL(fileData.convertedFile)
        );
        const blob = await response.blob();
        zip.file(fileData.convertedFile.name, blob);
      })
    );

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted-images.zip";
      a.click();
      URL.revokeObjectURL(url);

      elements.bulkDownloadButton.innerHTML = "Download All";
    } catch (error) {
      console.error("Error generating ZIP:", error);
    } finally {
      elements.bulkDownloadButton.disabled = false;
    }
  }

  // 7. Reset

  // 7.1. resetForMoreConversion
  function resetForMoreConversion() {
    elements.convertedList.innerHTML = "";
    uploadedFiles = uploadedFiles.filter((file) => !file.converted);
    convertedFiles = [];

    elements.dropzone.classList.remove("hidden");
    elements.conversionArea.classList.toggle(
      "hidden",
      uploadedFiles.length === 0
    );
    elements.convertedArea.classList.add("hidden");
    elements.fileInput.value = "";
  }

  // 8. UI Update

  // 8.1. updateUI
  function updateUI() {
    updateBulkDownloadButton();
  }
});
