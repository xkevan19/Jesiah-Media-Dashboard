/* --- Table of Contents ---
 1. Initialization and Configuration
 2. UI and Layout Adjustments
   2.1. Scrollbar Fix
   2.2. Image Grid Layout
   2.3. Dropdown Position
   2.4. Sidebar
 3. Authentication and User Session
   3.1. Fetch Supabase Config
   3.2. Log Activity
   3.3. Check Auth Status
 4. Category Management
   4.1. Fetch Categories
   4.2. Initialize Categories
   4.3. Update Selected Categories Display
   4.4. Filter By Categories
 5. Image Fetching and Display
   5.1. Handle Logout
   5.2. Fetch Images
   5.3. Render Images
   5.4. Loading State
   5.5. Empty State
   5.6. Filter By Category (Deprecated)
 6. Image Selection and Bulk Actions
   6.1. Handle Search
   6.2. Toggle Image Selection
   6.3. Toggle Select All
   6.4. Update Image Checkboxes
   6.5. Update Select All Checkbox
   6.6. Update Bulk Action Visibility
 7. Pagination
   7.1. Update Pagination
 8. Deletion and Confirmation
   8.1. Delete Selected Images
 9. Lightbox Functionality
   9.1. Open Lightbox
   9.2. Close Lightbox
   9.3. Delete Current Image
   9.4. Show Confirmation Modal
   9.5. Close Confirmation Modal
 10. Utility Functions (Icon, Date)
   10.1. Get Category Icon
   10.2. Format Date
 11. Event Listeners
 12. Search and Suggestions
   12.1. Initialize Search Suggestions
 13. Keyboard Navigation
   13.1. Setup Keyboard Navigation
 14. Copy and Download
   14.1. Copy Image URL
   14.2. Download Image
   14.3. Truncate String
 15. Initialization
   15.1. Init
 --- END --- */

document.addEventListener("DOMContentLoaded", async function () {
  // 1. Initialization and Configuration
  const { createClient } = window.supabase;
  let supabaseClient;
  let currentPage = 1;
  let totalPages = 1;
  let pageSize = 12;
  let currentCategory = "all";
  let selectedCategories = ["all"];
  let currentSearchQuery = "";
  let currentImages = [];
  let selectedImages = new Set();
  let currentLightboxImageId = null;

  const imageGrid = document.getElementById("imageGrid");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const suggestionsBox = document.getElementById("suggestions");
  let debounceTimer;
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const bulkActionButtons = document.getElementById("bulkActionButtons");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageIndicator = document.getElementById("pageIndicator");
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImage = document.getElementById("lightboxImage");
  const imageCategory = document.getElementById("imageCategory");
  const imageDate = document.getElementById("imageDate");
  const deleteImageBtn = document.getElementById("deleteImageBtn");
  const confirmationModal = document.getElementById("confirmationModal");
  const confirmationTitle = document.getElementById("confirmationTitle");
  const confirmationMessage = document.getElementById("confirmationMessage");
  const confirmActionBtn = document.getElementById("confirmActionBtn");
  const categoryDropdownModal = document.getElementById(
    "categoryDropdownModal"
  );
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const openSidebarBtn = document.getElementById("openSidebar");
  const closeSidebarBtn = document.getElementById("closeSidebar");

  // 2. UI and Layout Adjustments

  // 2.1. Scrollbar Fix
  const fixScrollbarIssue = () => {
    const mainContent = document.querySelector("main");
    const body = document.body;

    if (window.innerWidth < 768) {
      body.style.overflow = "hidden";
      mainContent.style.overflow = "auto";
      mainContent.style.height = "100vh";
      mainContent.style.paddingBottom = "70px";
    } else {
      body.style.overflow = "";
      mainContent.style.height = "";
      mainContent.style.paddingBottom = "";
    }
  };

  // 2.2. Image Grid Layout
  const improveImageGridLayout = () => {
    if (!imageGrid) return;

    if (window.innerWidth < 768) {
      imageGrid.className = "grid grid-cols-2 gap-3";
    } else if (window.innerWidth < 1024) {
      imageGrid.className = "grid grid-cols-3 gap-4";
    } else {
      imageGrid.className = "grid grid-cols-4 gap-5";
    }
  };

  // 2.3. Dropdown Position
  const adjustDropdownPosition = () => {
    if (!categoryDropdownModal) return;

    if (window.innerWidth < 768) {
      categoryDropdownModal.classList.add(
        "fixed",
        "left-0",
        "right-0",
        "top-1/4",
        "mx-4"
      );
      categoryDropdownModal.classList.remove("absolute");
      categoryDropdownModal.style.maxWidth = "90%";
      categoryDropdownModal.style.margin = "0 auto";
    } else {
      categoryDropdownModal.classList.remove(
        "fixed",
        "left-0",
        "right-0",
        "top-1/4",
        "mx-4"
      );
      categoryDropdownModal.classList.add("absolute");
      categoryDropdownModal.style.maxWidth = "";
      categoryDropdownModal.style.margin = "";
    }
  };

  window.addEventListener("resize", () => {
    fixScrollbarIssue();
    improveImageGridLayout();
    adjustDropdownPosition();
  });
  fixScrollbarIssue();
  improveImageGridLayout();
  adjustDropdownPosition();

  // 2.4. Sidebar
  const openSidebar = () => {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    fixScrollbarIssue();
  };

  if (openSidebarBtn) openSidebarBtn.addEventListener("click", openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) closeSidebar();
  });

  // 3. Authentication and User Session

  // 3.1. Fetch Supabase Config
  const fetchSupabaseConfig = async () => {
    try {
      const response = await fetch("/.netlify/functions/getsupabaseconfig");
      if (!response.ok) throw new Error("Failed to fetch configuration");
      return await response.json();
    } catch (error) {
      console.error("Error fetching config:", error);
      return null;
    }
  };

  // 3.2. Log Activity
  const logActivity = async (action, itemName = null, category = null) => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const { error } = await supabaseClient.from("activity_logs").insert({
        user_id: session.user.id,
        user_name: session.user.email.split("@")[0],
        action: action,
        item_name: itemName,
        category: category,
        created_at: new Date().toISOString(),
      });

      if (error) console.error("Error logging activity:", error.message);
    } catch (error) {
      console.error("Activity logging failed:", error.message);
    }
  };

  // 3.3. Check Auth Status
  const checkAuthStatus = async () => {
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

  // 4. Category Management

  // 4.1. Fetch Categories
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
      return [];
    }
  };

  // 4.2. Initialize Categories
  const initializeCategories = async () => {
    const categoryDropdownButton = document.getElementById(
      "categoryDropdownButton"
    );
    const categoryCheckboxContainer = document.getElementById(
      "categoryCheckboxContainer"
    );
    const selectedCategoriesContainer = document.getElementById(
      "selectedCategoriesContainer"
    );
    const selectAllBtn = document.getElementById("selectAllCategories");
    const deselectAllBtn = document.getElementById("deselectAllCategories");
    const applyBtn = document.getElementById("applyCategoryFilter");
    const cancelBtn = document.getElementById("cancelCategoryFilter");

    if (!categoryCheckboxContainer || !selectedCategoriesContainer) {
      console.error("Category containers not found");
      return;
    }

    categoryCheckboxContainer.innerHTML = "";

    const categories = await fetchCategories();
    if (categories.length === 0) {
      console.warn("No categories found in database");
      return;
    }

    const allCheckboxDiv = document.createElement("div");
    allCheckboxDiv.className = "flex items-center mb-2";

    const allCheckbox = document.createElement("input");
    allCheckbox.type = "checkbox";
    allCheckbox.id = "category-all";
    allCheckbox.className = "mr-2 w-5 h-5 accent-orange-500";
    allCheckbox.checked = selectedCategories.includes("all");
    allCheckbox.value = "all";

    const allLabel = document.createElement("label");
    allLabel.htmlFor = "category-all";
    allLabel.textContent = "All Images";
    allLabel.className = "cursor-pointer text-base";

    allCheckboxDiv.appendChild(allCheckbox);
    allCheckboxDiv.appendChild(allLabel);
    categoryCheckboxContainer.appendChild(allCheckboxDiv);

    categories.forEach((category) => {
      const checkboxDiv = document.createElement("div");
      checkboxDiv.className = "flex items-center mb-2";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `category-${category.name}`;
      checkbox.className = "mr-2 w-5 h-5 accent-orange-500";
      checkbox.checked = selectedCategories.includes(category.name);
      checkbox.value = category.name;

      const label = document.createElement("label");
      label.htmlFor = `category-${category.name}`;
      const iconClass = getCategoryIcon(category.name);
      label.innerHTML = `<i class="${iconClass} mr-1"></i> ${category.name}`;
      label.className = "cursor-pointer text-base";

      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(label);
      categoryCheckboxContainer.appendChild(checkboxDiv);
    });

    categoryDropdownButton.addEventListener("click", (e) => {
      e.stopPropagation();
      categoryDropdownModal.classList.toggle("hidden");
    });

    categoryDropdownModal.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", () => {
      categoryDropdownModal.classList.add("hidden");
    });

    selectAllBtn.addEventListener("click", () => {
      const checkboxes = categoryCheckboxContainer.querySelectorAll(
        "input[type='checkbox']"
      );
      checkboxes.forEach((checkbox) => (checkbox.checked = true));
    });

    deselectAllBtn.addEventListener("click", () => {
      const checkboxes = categoryCheckboxContainer.querySelectorAll(
        "input[type='checkbox']"
      );
      checkboxes.forEach((checkbox) => (checkbox.checked = false));
    });

    applyBtn.addEventListener("click", () => {
      const checkboxes = categoryCheckboxContainer.querySelectorAll(
        "input[type='checkbox']:checked"
      );
      selectedCategories = Array.from(checkboxes).map(
        (checkbox) => checkbox.value
      );

      if (selectedCategories.length === 0) {
        selectedCategories = ["all"];
        document.getElementById("category-all").checked = true;
      }

      updateSelectedCategoriesDisplay();
      filterByCategories(selectedCategories);
      categoryDropdownModal.classList.add("hidden");
    });

    cancelBtn.addEventListener("click", () => {
      const checkboxes = categoryCheckboxContainer.querySelectorAll(
        "input[type='checkbox']"
      );
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectedCategories.includes(checkbox.value);
      });

      categoryDropdownModal.classList.add("hidden");
    });

    updateSelectedCategoriesDisplay();
  };

  // 4.3. Update Selected Categories Display
  const updateSelectedCategoriesDisplay = () => {
    const selectedCategoriesContainer = document.getElementById(
      "selectedCategoriesContainer"
    );
    selectedCategoriesContainer.innerHTML = "";

    if (selectedCategories.includes("all") && selectedCategories.length === 1) {
      const allPill = document.createElement("div");
      allPill.className =
        "px-3 py-1 rounded-full bg-blue-600 text-white flex items-center text-sm";
      allPill.textContent = "All Images";
      selectedCategoriesContainer.appendChild(allPill);
      return;
    }

    selectedCategories.forEach((category) => {
      if (category === "all") return;

      const pill = document.createElement("div");
      pill.className =
        "px-3 py-1 rounded-full bg-blue-600 text-white flex items-center text-sm mb-2 mr-2";

      const iconClass = getCategoryIcon(category);
      pill.innerHTML = `<i class="${iconClass} mr-1"></i> ${category}`;

      const removeBtn = document.createElement("button");
      removeBtn.className = "ml-2 text-white hover:text-gray-200";
      removeBtn.innerHTML = "×";
      removeBtn.addEventListener("click", () => {
        selectedCategories = selectedCategories.filter((c) => c !== category);

        if (selectedCategories.length === 0) {
          selectedCategories = ["all"];
        }

        updateSelectedCategoriesDisplay();
        filterByCategories(selectedCategories);
      });

      pill.appendChild(removeBtn);
      selectedCategoriesContainer.appendChild(pill);
    });
  };

  // 4.4. Filter By Categories
  const filterByCategories = async (categories) => {
    currentPage = 1;

    if (categories.includes("all")) {
      currentCategory = "all";
    } else {
      currentCategory = categories.join(",");
    }

    await fetchImages();
  };

  // 5. Image Fetching and Display

  // 5.1. Handle Logout
  const handleLogout = async () => {
    try {
      await logActivity("Logout");
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout failed:", error.message);
      statusEl.innerText = "Logout failed. Please try again.";
      statusEl.classList.add("text-red-500");
    }
  };

  // 5.2. Fetch Images
  const fetchImages = async () => {
    showLoading();
    try {
      let query = supabaseClient
        .from("uploads")
        .select("*", { count: "exact" });

      if (currentCategory !== "all") {
        const categories = currentCategory.split(",");

        if (categories.length === 1) {
          query = query.ilike("category", `%${categories[0].trim()}%`);
        } else {
          const orConditions = categories.map(
            (cat) => `category.ilike.%${cat.trim()}%`
          );
          query = query.or(orConditions.join(","));
        }
      }

      if (currentSearchQuery) {
        query = query.ilike("image_url", `%${currentSearchQuery}%`);
      }

      const { count, error: countError } = await query;
      if (countError) throw countError;
      totalPages = Math.max(1, Math.ceil(count / pageSize));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      currentImages = data;
      renderImages(data);
      updatePagination();
      updateSelectAllCheckbox();

      logActivity(
        "Fetched images",
        `Category: ${currentCategory}, Search: ${currentSearchQuery}`,
        "Media"
      );
    } catch (error) {
      console.error("Error fetching images:", error);
      showEmptyState();
    }
  };

  // 5.3. Render Images
  const renderImages = (images) => {
    imageGrid.innerHTML = "";

    if (images.length === 0) {
      showEmptyState();
      return;
    }

    hideLoading();
    hideEmptyState();

    images.forEach((imageData) => {
      const card = document.createElement("div");
      card.className =
        "image-card relative group rounded-xl overflow-hidden shadow-lg";
      card.dataset.id = imageData.id;

      const img = document.createElement("img");
      img.src = imageData.image_url;
      img.alt = "Media image";
      img.className =
        "w-full h-48 object-cover transition-transform group-hover:scale-105";
      img.loading = "lazy";
      img.addEventListener("click", () => openLightbox(imageData));

      img.onerror = () => {
        img.src = "https://placehold.co/300x200?text=Image+Not+Found";
      };

      const checkboxWrapper = document.createElement("div");
      checkboxWrapper.className = "absolute top-2 left-2 z-10";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "w-5 h-5 accent-orange-500 shadow-md";
      checkbox.checked = selectedImages.has(imageData.id);
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();
        toggleImageSelection(imageData.id);
      });

      checkboxWrapper.appendChild(checkbox);

      const overlay = document.createElement("div");
      overlay.className =
        "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent";

      const category = document.createElement("span");
      category.className =
        "text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full inline-block mb-1";
      category.innerHTML = `<i class="${getCategoryIcon(
        imageData.category
      )}"></i> ${imageData.category}`;

      const date = document.createElement("div");
      date.className = "text-xs text-zinc-300 mt-1";
      date.textContent = formatDate(imageData.created_at);

      overlay.appendChild(category);
      overlay.appendChild(date);

      card.appendChild(img);
      card.appendChild(checkboxWrapper);
      card.appendChild(overlay);
      imageGrid.appendChild(card);
    });

    updateBulkActionVisibility();
  };

  // 5.4. Loading State
  const showLoading = () => {
    loadingState.classList.remove("hidden");
    imageGrid.classList.add("hidden");
    emptyState.classList.add("hidden");
  };

  const hideLoading = () => {
    loadingState.classList.add("hidden");
    imageGrid.classList.remove("hidden");
  };

  // 5.5. Empty State
  const showEmptyState = () => {
    loadingState.classList.add("hidden");
    imageGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
  };

  const hideEmptyState = () => {
    emptyState.classList.add("hidden");
  };

  // 5.6. Filter By Category (Deprecated)
  const filterByCategory = (category) => {
    currentCategory = category;
    currentPage = 1;

    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === category);
    });

    fetchImages();
  };

  // 6. Image Selection and Bulk Actions

  // 6.1. Handle Search
  const handleSearch = () => {
    currentSearchQuery = searchInput.value.trim();
    currentPage = 1;
    fetchImages();
  };

  // 6.2. Toggle Image Selection
  const toggleImageSelection = (imageId) => {
    if (selectedImages.has(imageId)) {
      selectedImages.delete(imageId);
    } else {
      selectedImages.add(imageId);
    }

    updateImageCheckboxes();
    updateSelectAllCheckbox();
    updateBulkActionVisibility();
  };

  // 6.3. Toggle Select All
  const toggleSelectAll = () => {
    if (selectedImages.size === currentImages.length) {
      selectedImages.clear();
    } else {
      currentImages.forEach((img) => selectedImages.add(img.id));
    }

    updateImageCheckboxes();
    updateBulkActionVisibility();
  };

  // 6.4. Update Image Checkboxes
  const updateImageCheckboxes = () => {
    const checkboxes = imageGrid.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      const imageId = parseInt(checkbox.closest(".image-card").dataset.id);
      checkbox.checked = selectedImages.has(imageId);
    });
  };

  // 6.5. Update Select All Checkbox
  const updateSelectAllCheckbox = () => {
    if (currentImages.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.disabled = true;
    } else {
      selectAllCheckbox.disabled = false;
      selectAllCheckbox.checked =
        selectedImages.size === currentImages.length &&
        currentImages.length > 0;
    }
  };

  // 6.6. Update Bulk Action Visibility
  const updateBulkActionVisibility = () => {
    if (selectedImages.size > 0) {
      bulkActionButtons.classList.remove("hidden");

      if (window.innerWidth < 768) {
        bulkActionButtons.classList.add(
          "fixed",
          "bottom-0",
          "left-0",
          "right-0",
          "p-3",
          "bg-zinc-900",
          "border-t",
          "border-zinc-800",
          "z-50"
        );
      } else {
        bulkActionButtons.classList.remove(
          "fixed",
          "bottom-0",
          "left-0",
          "right-0",
          "p-3",
          "bg-zinc-900",
          "border-t",
          "border-zinc-800",
          "z-50"
        );
      }
    } else {
      bulkActionButtons.classList.add("hidden");
    }
  };

  // 7. Pagination

  // 7.1. Update Pagination
  const updatePagination = () => {
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    if (window.innerWidth < 768) {
      const paginationControls = pageIndicator.closest(".flex");
      if (paginationControls) {
        paginationControls.classList.add("flex-col", "items-center", "gap-2");
      }

      prevPageBtn.classList.add("w-full");
      nextPageBtn.classList.add("w-full");
    }
  };

  // 8. Deletion and Confirmation

  // 8.1. Delete Selected Images
  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;

    showConfirmationModal(
      "Delete Selected Images",
      `Are you sure you want to delete ${selectedImages.size} selected image(s)? This action cannot be undone.`,
      async () => {
        try {
          showLoading();

          for (const id of selectedImages) {
            const { data: imageData } = await supabaseClient
              .from("uploads")
              .select("image_url")
              .eq("id", id)
              .single();

            if (imageData) {
              await supabaseClient.from("uploads").delete().eq("id", id);

              const urlParts = imageData.image_url.split("/");
              const fileName = urlParts[urlParts.length - 1];

              await supabaseClient.storage
                .from("portfolio-images")
                .remove([`uploads/${fileName}`]);

              logActivity(
                "Deleted image",
                `Image URL: ${imageData.image_url}`,
                "Media"
              );
            }
          }

          selectedImages.clear();
          await fetchImages();
          updateBulkActionVisibility();
        } catch (error) {
          console.error("Error deleting images:", error);
          alert("An error occurred while deleting images. Please try again.");
          hideLoading();
        }
      }
    );
  };

  // 9. Lightbox Functionality

  // 9.1. Open Lightbox
  const openLightbox = (imageData) => {
    lightboxImage.src = imageData.image_url;
    imageCategory.innerHTML = `<i class="${getCategoryIcon(
      imageData.category
    )}"></i> ${imageData.category}`;
    imageDate.textContent = formatDate(imageData.created_at);
    currentLightboxImageId = imageData.id;
    lightboxModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    lightboxImage.onerror = () => {
      lightboxImage.src = "https://placehold.co/600x400?text=Image+Not+Found";
    };
  };

  // 9.2. Close Lightbox
  window.closeLightbox = () => {
    lightboxModal.classList.add("hidden");
    fixScrollbarIssue();
    currentLightboxImageId = null;
  };

  // 9.3. Delete Current Image
  const deleteCurrentImage = () => {
    if (!currentLightboxImageId) return;

    showConfirmationModal(
      "Delete Image",
      "Are you sure you want to delete this image? This action cannot be undone.",
      async () => {
        try {
          const { data: imageData } = await supabaseClient
            .from("uploads")
            .select("image_url")
            .eq("id", currentLightboxImageId)
            .single();

          if (imageData) {
            await supabaseClient
              .from("uploads")
              .delete()
              .eq("id", currentLightboxImageId);

            const urlParts = imageData.image_url.split("/");
            const fileName = urlParts[urlParts.length - 1];

            await supabaseClient.storage
              .from("portfolio-images")
              .remove([`uploads/${fileName}`]);

            logActivity(
              "Deleted image",
              `Image URL: ${imageData.image_url}`,
              "Media"
            );

            closeLightbox();
            await fetchImages();
          }
        } catch (error) {
          console.error("Error deleting image:", error);
          alert(
            "An error occurred while deleting the image. Please try again."
          );
        }
      }
    );
  };

  // 9.4. Show Confirmation Modal
  const showConfirmationModal = (title, message, onConfirm) => {
    confirmationTitle.textContent = title;
    confirmationMessage.textContent = message;

    const actionBtns = confirmationModal.querySelectorAll("button");
    actionBtns.forEach((btn) => {
      btn.classList.add("px-4", "py-2", "rounded", "font-medium");
      if (btn.id === "confirmActionBtn") {
        btn.classList.add("bg-red-600", "hover:bg-red-700", "text-white");
      } else {
        btn.classList.add("bg-zinc-700", "hover:bg-zinc-600", "text-white");
      }
    });

    confirmActionBtn.onclick = () => {
      onConfirm();
      closeConfirmationModal();
    };

    confirmationModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  // 9.5. Close Confirmation Modal
  window.closeConfirmationModal = () => {
    confirmationModal.classList.add("hidden");
    fixScrollbarIssue();
  };

  // 10. Utility Functions (Icon, Date)

  // 10.1. Get Category Icon
  const getCategoryIcon = (category) => {
    const categoryLower = category ? category.toLowerCase() : "";

    if (categoryLower.includes("client")) {
      return "fas fa-user-tie";
    } else if (categoryLower.includes("restaurant")) {
      return "fas fa-utensils";
    } else if (categoryLower.includes("event")) {
      return "fas fa-calendar-alt";
    } else if (categoryLower.includes("food")) {
      return "fas fa-hamburger";
    } else if (categoryLower.includes("travel")) {
      return "fas fa-plane";
    } else if (categoryLower.includes("nature")) {
      return "fas fa-tree";
    } else if (categoryLower.includes("portrait")) {
      return "fas fa-portrait";
    } else if (categoryLower.includes("wedding")) {
      return "fas fa-rings-wedding";
    } else {
      return "fas fa-image";
    }
  };

  // 10.2. Format Date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 11. Event Listeners
  searchBtn.addEventListener("click", handleSearch);

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  selectAllCheckbox.addEventListener("change", toggleSelectAll);
  deleteSelectedBtn.addEventListener("click", deleteSelectedImages);
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchImages();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchImages();
    }
  });

  deleteImageBtn.addEventListener("click", deleteCurrentImage);

  // 12. Search and Suggestions

  // 12.1. Initialize Search Suggestions
  const initializeSearchSuggestions = () => {
    searchInput.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      const query = this.value.trim();

      if (query.length === 0) {
        suggestionsBox.innerHTML = "";
        suggestionsBox.classList.add("hidden");
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const { data, error } = await supabaseClient
            .from("uploads")
            .select("image_url")
            .ilike("image_url", `%${query}%`)
            .limit(5);

          if (error) throw error;

          suggestionsBox.innerHTML = "";

          if (data.length === 0) {
            suggestionsBox.classList.add("hidden");
            return;
          }

          suggestionsBox.classList.remove("hidden");

          data.forEach((item) => {
            const fileName = item.image_url.split("/").pop();
            const suggestion = document.createElement("div");
            suggestion.className = "p-2 hover:bg-zinc-700 cursor-pointer";
            suggestion.textContent = fileName;
            suggestion.addEventListener("click", () => {
              searchInput.value = fileName;
              suggestionsBox.classList.add("hidden");
              handleSearch();
            });
            suggestionsBox.appendChild(suggestion);
          });
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      }, 300);
    });

    document.addEventListener("click", function (e) {
      if (e.target !== searchInput && e.target !== suggestionsBox) {
        suggestionsBox.classList.add("hidden");
      }
    });
  };

  // 13. Keyboard Navigation

  // 13.1. Setup Keyboard Navigation
  const setupKeyboardNavigation = () => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!lightboxModal.classList.contains("hidden")) {
          closeLightbox();
        }
        if (!confirmationModal.classList.contains("hidden")) {
          closeConfirmationModal();
        }
        if (!categoryDropdownModal.classList.contains("hidden")) {
          categoryDropdownModal.classList.add("hidden");
        }
      }

      if (
        lightboxModal.classList.contains("hidden") &&
        confirmationModal.classList.contains("hidden") &&
        categoryDropdownModal.classList.contains("hidden")
      ) {
        if (e.key === "ArrowLeft" && !prevPageBtn.disabled) {
          currentPage--;
          fetchImages();
        } else if (e.key === "ArrowRight" && !nextPageBtn.disabled) {
          currentPage++;
          fetchImages();
        }
      }
    });
  };

  // 14. Copy and Download

  // 14.1. Copy Image URL
  window.copyImageUrl = async () => {
    if (!currentLightboxImageId) return;

    try {
      const { data, error } = await supabaseClient
        .from("uploads")
        .select("image_url")
        .eq("id", currentLightboxImageId)
        .single();

      if (error) throw error;

      if (data && data.image_url) {
        await navigator.clipboard.writeText(data.image_url);

        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-md shadow-lg z-50";
        notification.textContent = "Image URL copied to clipboard!";
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 2000);

        const truncatedImageUrl = truncateString(data.image_url, 50);
        logActivity("Copied image URL", truncatedImageUrl, "Media");
      } else {
        throw new Error("No image URL found");
      }
    } catch (error) {
      console.error("Error copying URL:", error);
      logActivity("Failed to copy image URL", error.message, "Media");
    }
  };

  //14.2. Download Image
  window.downloadImage = async () => {
    if (!currentLightboxImageId) return;
    try {
      const { data, error } = await supabaseClient
        .from("uploads")
        .select("image_url")
        .eq("id", currentLightboxImageId)
        .single();

      if (error) throw error;

      if (data && data.image_url) {
        const fileName = data.image_url.split("/").pop();
        const bucketName = "portfolio-images";
        const path = data.image_url.replace(
          `${supabaseClient.supabaseUrl}/storage/v1/object/public/${bucketName}/`,
          ""
        );

        const { data: fileData, error: downloadError } =
          await supabaseClient.storage.from(bucketName).download(path);

        if (downloadError) {
          console.error("Download error:", downloadError);
          throw downloadError;
        }

        const blobUrl = URL.createObjectURL(fileData);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        const truncatedImageUrl = truncateString(data.image_url, 50);
        logActivity("Downloaded image", truncatedImageUrl, "Media");
      } else {
        throw new Error("No image URL found");
      }
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  // 14.3. Truncate String
  function truncateString(str, maxLength) {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - 3) + "...";
  }

  // 15. Initialization

  // 15.1. Init
  const init = async () => {
    const session = await checkAuthStatus();
    if (!session) return;

    await initializeCategories();
    initializeSearchSuggestions();
    setupKeyboardNavigation();

    document
      .getElementById("logoutBtn")
      .addEventListener("click", handleLogout);

    await fetchImages();

    logActivity("Visited media library");
  };

  init();
});
