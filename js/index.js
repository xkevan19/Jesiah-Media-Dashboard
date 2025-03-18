/*
 --- Table of Contents ---
 1. Constants and Initializations
 2. Helper Functions
   2.1. UI Feedback
   2.2. Activity Logging
   2.3. Supabase Configuration
   2.4. Category Management
   2.5. Authentication
   2.6. UI Updates
 3. Image Handling
   3.1. Preview Rendering
   3.2. File Removal
   3.3. Lightbox
   3.4. Image Upload
   3.5. File Handling
 4. Event Listeners
   4.1. Drag and Drop
   4.2. File Input
   4.3. Button Actions
   4.4. Sidebar
   4.5. Lightbox
   4.6  Back to Top Button
 5. Initialization
 --- END --- */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Constants and Initializations
  const { createClient } = window.supabase;
  let supabaseClient;

  const imagePreviews = document.getElementById("imagePreviews");
  const statusEl = document.getElementById("status");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const noImagesMessage = document.getElementById("noImagesMessage");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImage = document.getElementById("lightboxImage");
  const selectedCategoryEl = document.getElementById("selectedCategory");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const dropzone = document.getElementById("dropzone");

  let selectedFiles = [];
  let selectedForDeletion = new Set();

  // 2. Helper Functions

  // 2.1. UI Feedback
  const showError = (message) => {
    statusEl.innerText = message;
    statusEl.className = "mt-4 text-center text-red-500 min-h-[24px]";
  };

  const showSuccess = (message) => {
    statusEl.innerText = message;
    statusEl.className = "mt-4 text-center text-green-500 min-h-[24px]";
  };

  const showInfo = (message) => {
    statusEl.innerText = message;
    statusEl.className = "mt-4 text-center text-blue-400 min-h-[24px]";
  };

  // 2.2. Activity Logging
  const logActivity = async (action, itemName = null, category = null) => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const { error } = await supabaseClient.from("activity_logs").insert({
        user_id: session.user.id,
        user_name: session.user.email.split("@")[0],
        action,
        item_name: itemName,
        category,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error("Activity logging failed:", error.message);
    }
  };

  // 2.3. Supabase Configuration
  const fetchSupabaseConfig = async () => {
    try {
      const response = await fetch("/.netlify/functions/getsupabaseconfig");
      if (!response.ok)
        throw new Error(`Failed to fetch config: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching config:", error);
      showError("Configuration error. Please contact support.");
      return null;
    }
  };

  // 2.4. Category Management
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      showError("Failed to load categories. Please try again.");
      return [];
    }
  };

  const initializeCategories = async () => {
    const categoryContainer = document.getElementById("categoryContainer");
    const categories = await fetchCategories();

    if (categories.length === 0) {
      showError("No categories found. Please add categories first.");
      return;
    }

    categoryContainer.innerHTML = "";

    categories.forEach((category, index) => {
      const option = document.createElement("div");
      option.id = `category${category.name}`;
      option.className =
        "category-option flex items-center p-2 md:p-3 rounded-lg cursor-pointer hover:bg-zinc-800 w-full sm:w-auto flex-1 justify-between";

      let iconClass = "fas fa-tag";
      if (category.name.toLowerCase().includes("client")) {
        iconClass = "fas fa-user-tie";
      } else if (category.name.toLowerCase().includes("restaurant")) {
        iconClass = "fas fa-utensils";
      } else if (category.name.toLowerCase().includes("event")) {
        iconClass = "fas fa-calendar-alt";
      } else if (category.name.toLowerCase().includes("food")) {
        iconClass = "fas fa-hamburger";
      } else if (category.name.toLowerCase().includes("travel")) {
        iconClass = "fas fa-plane";
      } else if (category.name.toLowerCase().includes("nature")) {
        iconClass = "fas fa-tree";
      } else if (category.name.toLowerCase().includes("portrait")) {
        iconClass = "fas fa-portrait";
      } else if (category.name.toLowerCase().includes("wedding")) {
        iconClass = "fas fa-rings-wedding";
      }

      option.innerHTML = `
      <div class="flex items-center">
        <i class="${iconClass} text-zinc-400 mr-2 md:mr-3"></i>
        <span class="text-sm md:text-base">${category.name}</span>
      </div>
      <i class="fas fa-check hidden text-green-500"></i>
    `;

      option.addEventListener("click", () => {
        document.querySelectorAll(".category-option").forEach((opt) => {
          opt.classList.remove("selected");
          opt.querySelector(".fa-check").classList.add("hidden");
        });

        option.classList.add("selected");
        option.querySelector(".fa-check").classList.remove("hidden");
        document.getElementById("selectedCategory").value = category.name;
      });

      categoryContainer.appendChild(option);

      if (index === 0) {
        option.classList.add("selected");
        option.querySelector(".fa-check").classList.remove("hidden");
        document.getElementById("selectedCategory").value = category.name;
      }
    });
  };

  // 2.5. Authentication
  const initSupabaseAndAuth = async () => {
    try {
      const config = await fetchSupabaseConfig();
      if (!config) return null;

      supabaseClient = createClient(config.url, config.key);
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      if (error || !session) {
        console.error("Authentication error or no session");
        window.location.href = "login.html";
        return null;
      }

      document.getElementById("userEmail").textContent = session.user.email;
      return session;
    } catch (error) {
      console.error("Session verification failed:", error.message);
      window.location.href = "login.html";
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      await logActivity("Logout");
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout failed:", error.message);
      showError("Logout failed. Please try again.");
    }
  };

  // 2.6. UI Updates
  const updateUI = () => {
    const hasFiles = selectedFiles.length > 0;
    const hasSelected = selectedForDeletion.size > 0;

    noImagesMessage.classList.toggle("hidden", hasFiles);
    imagePreviews.classList.toggle("hidden", !hasFiles);
    uploadBtn.disabled = !hasFiles;
    uploadBtn.innerText = `Upload ${selectedFiles.length} Image${
      hasFiles && selectedFiles.length !== 1 ? "s" : ""
    }`;
    deleteSelectedBtn.disabled = !hasSelected;
    deleteSelectedBtn.classList.toggle("opacity-50", !hasSelected);
  };

  const toggleImageSelection = (index, checkboxEl) => {
    if (selectedForDeletion.has(index)) {
      selectedForDeletion.delete(index);
    } else {
      selectedForDeletion.add(index);
    }
    checkboxEl.checked = selectedForDeletion.has(index);
    updateUI();
  };

  // 3. Image Handling

  // 3.1. Preview Rendering
  const renderPreviews = () => {
    imagePreviews.replaceChildren();

    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const previewContainer = document.createElement("div");
        previewContainer.className =
          "relative group border border-gray-700 rounded-lg overflow-hidden";

        const preview = document.createElement("img");
        preview.src = e.target.result;
        preview.className =
          "preview-image w-full h-32 object-cover cursor-pointer";
        preview.alt = file.name;
        preview.onclick = () => showLightbox(e.target.result, file.name);

        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "absolute top-2 left-2";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "w-4 h-4 accent-orange-500 cursor-pointer";
        checkbox.checked = selectedForDeletion.has(index);
        checkbox.onclick = (event) => {
          event.stopPropagation();
          toggleImageSelection(index, checkbox);
        };
        checkboxContainer.appendChild(checkbox);

        const controls = document.createElement("div");
        controls.className =
          "absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 flex justify-between items-center transition-transform group-hover:translate-y-0";

        const fileInfo = document.createElement("div");
        fileInfo.className = "text-xs truncate max-w-[80%]";
        fileInfo.textContent = file.name;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "text-red-400 hover:text-red-300";
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = (event) => {
          event.stopPropagation();
          removeFile(index);
        };

        controls.append(fileInfo, deleteBtn);
        previewContainer.append(preview, checkboxContainer, controls);
        imagePreviews.appendChild(previewContainer);
      };

      reader.readAsDataURL(file);
    });
  };

  // 3.2. File Removal
  const removeFile = async (index) => {
    const file = selectedFiles[index];
    selectedFiles.splice(index, 1);
    if (selectedForDeletion.has(index)) {
      selectedForDeletion.delete(index);
    }

    const newSelectedForDeletion = new Set();
    for (let selectedIndex of selectedForDeletion) {
      if (selectedIndex > index) {
        newSelectedForDeletion.add(selectedIndex - 1);
      } else {
        newSelectedForDeletion.add(selectedIndex);
      }
    }
    selectedForDeletion = newSelectedForDeletion;

    renderPreviews();
    updateUI();
    await logActivity("Delete", file.name, "image");
  };

  const removeSelectedFiles = async () => {
    const indicesToRemove = Array.from(selectedForDeletion).sort(
      (a, b) => b - a
    );

    for (const index of indicesToRemove) {
      selectedFiles.splice(index, 1);
    }

    selectedForDeletion.clear();

    renderPreviews();
    updateUI();

    await logActivity("Delete", `${indicesToRemove.length} images`, "image");
  };

  // 3.3. Lightbox
  const showLightbox = (src, alt) => {
    lightboxImage.src = src;
    lightboxImage.alt = alt || "Enlarged image";
    lightboxModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightboxModal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  // 3.4. Image Upload
  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    const category = selectedCategoryEl.value;
    showInfo("Preparing upload...");
    progressContainer.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressBar.className =
      "bg-gradient-to-r from-[#7077FF] to-[#0037FF] h-4 rounded-full";
    progressText.innerText = "0%";

    try {
      let completedUploads = 0;
      const totalFiles = selectedFiles.length;

      for (const file of selectedFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const fileSize = file.size;

        const { data, error: uploadError } = await supabaseClient.storage
          .from("portfolio-images")
          .upload(`uploads/${fileName}`, file);

        if (uploadError) throw uploadError;

        await logActivity("Upload", file.name, category);

        const config = await fetchSupabaseConfig();
        if (!config) return;
        const imageUrl = `${config.url}/storage/v1/object/public/portfolio-images/uploads/${fileName}`;

        const { error: insertError } = await supabaseClient
          .from("uploads")
          .insert([{ image_url: imageUrl, category, file_size: fileSize }]);

        if (insertError) throw insertError;

        completedUploads++;
        const percentage = Math.round((completedUploads / totalFiles) * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.innerText = `${percentage}% (${completedUploads}/${totalFiles})`;
      }

      showSuccess("All uploads successful!");
      selectedFiles = [];
      selectedForDeletion.clear();
      renderPreviews();
      updateUI();

      setTimeout(() => {
        progressContainer.classList.add("hidden");
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      showError(`Upload failed: ${error.message}`);
      progressBar.style.width = "100%";
      progressBar.className = "bg-red-500 h-4 rounded-full";
      progressText.innerText = "Upload failed";
    }
  };

  // 3.5. File Handling
  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (imageFiles.length === 0) return;

    for (const file of imageFiles) {
      selectedFiles.push(file);
      await logActivity("Select", file.name, "image");
    }
    renderPreviews();
    updateUI();
  };

  // 4. Event Listeners

  // 4.1. Drag and Drop
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("active");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("active");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("active");
    handleFiles(e.dataTransfer.files);
  });

  // 4.2. File Input
  fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

  // 4.3. Button Actions
  uploadBtn.addEventListener("click", uploadImages);
  deleteSelectedBtn.addEventListener("click", removeSelectedFiles);

  selectAllBtn.addEventListener("click", () => {
    const checkboxes = imagePreviews.querySelectorAll('input[type="checkbox"]');
    const allSelected = selectedForDeletion.size === selectedFiles.length;

    if (allSelected) {
      selectedForDeletion.clear();
    } else {
      selectedForDeletion = new Set(selectedFiles.map((_, index) => index));
    }

    checkboxes.forEach((cb, index) => {
      cb.checked = selectedForDeletion.has(index);
    });
    updateUI();
  });

  // 4.4. Sidebar
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const openSidebarBtn = document.getElementById("openSidebar");
  const closeSidebarBtn = document.getElementById("closeSidebar");

  const openSidebar = () => {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  openSidebarBtn?.addEventListener("click", openSidebar);
  closeSidebarBtn?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click", closeSidebar);

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) closeSidebar();
  });

  // 4.5. Lightbox
  document
    .getElementById("closeLightboxBtn")
    ?.addEventListener("click", closeLightbox);
  lightboxModal?.addEventListener("click", (event) => {
    if (event.target === lightboxModal) {
      closeLightbox();
    }
  });

  // 4.6  Back to Top Button
  const backToTopBtn = document.getElementById("backToTopBtn");
  const mainContent = document.querySelector("main");

  mainContent?.addEventListener("scroll", () => {
    backToTopBtn.classList.toggle("opacity-100", mainContent.scrollTop > 300);
    backToTopBtn.classList.toggle("visible", mainContent.scrollTop > 300);
    backToTopBtn.classList.toggle("opacity-0", mainContent.scrollTop <= 300);
    backToTopBtn.classList.toggle("invisible", mainContent.scrollTop <= 300);
  });

  backToTopBtn?.addEventListener("click", () => {
    mainContent.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 5. Initialization
  const session = await initSupabaseAndAuth();
  if (!session) return;

  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  await initializeCategories();
  updateUI();
});
