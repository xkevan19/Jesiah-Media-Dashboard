/* --- Table of Contents ---
 1. DOMContentLoaded Event Listener
 2. DOM Element Caching
 3. Global Variables
 4. Initialization Functions
    - initSupabase
    - fetchSupabaseConfig
 5. UI & Helper Functions
    - toggleSidebar
    - showErrorAlert
    - logActivity
    - renderCategoryList
 6. Data Fetching & Manipulation
    - fetchCategories
    - addCategory
    - updateCategory
    - deleteCategory
 7. Modal Control Functions
    - openEditModal
    - closeEditModal
    - openDeleteModal
    - closeDeleteModal
 8. Event Listeners
    - Sidebar Event Listeners
    - Form Submission
    - Button Clicks
   -  Back to Top Button
 9. Initialization
    - init
 10. Global Scope Functions
 --- END --- */

document.addEventListener("DOMContentLoaded", async () => {
  // --- 2. DOM Element Caching ---
  const elements = {
    categoryForm: document.getElementById("categoryForm"),
    categoryName: document.getElementById("categoryName"),
    statusEl: document.getElementById("status"),
    categoryList: document.getElementById("categoryList"),
    loadingMessage: document.getElementById("loadingMessage"),
    noCategories: document.getElementById("noCategories"),
    refreshBtn: document.getElementById("refreshBtn"),
    editModal: document.getElementById("editModal"),
    editForm: document.getElementById("editForm"),
    editCategoryId: document.getElementById("editCategoryId"),
    editCategoryName: document.getElementById("editCategoryName"),
    editStatus: document.getElementById("editStatus"),
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    openSidebarBtn: document.getElementById("openSidebar"),
    closeSidebarBtn: document.getElementById("closeSidebar"),
    deleteModal: document.getElementById("deleteModal"),
    deleteModalCategoryName: document.getElementById("deleteModalCategoryName"),
    confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
    backToTopBtn: document.getElementById("backToTopBtn"),
    mainContent: document.querySelector("main"),
  };

  // --- 3. Global Variables ---
  let supabaseClient;
  let categories = [];
  let categoryToDelete = null;

  // --- 4. Initialization Functions ---
  const initSupabase = async () => {
    try {
      const config = await fetchSupabaseConfig();
      if (!config) {
        throw new Error("Supabase configuration is missing.");
      }
      supabaseClient = window.supabase.createClient(config.url, config.key);
    } catch (error) {
      console.error("Supabase initialization failed:", error.message);
      showErrorAlert(
        "Failed to connect to the database. Please check your connection and try again."
      );
      throw error;
    }
  };

  // --- 5. UI & Helper Functions ---
  // toggleSidebar
  const toggleSidebar = (isOpen) => {
    elements.sidebar.classList.toggle("open", isOpen);
    elements.overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  // showErrorAlert
  const showErrorAlert = (message) => {
    const alert = document.createElement("div");
    alert.classList.add(
      "bg-red-500",
      "text-white",
      "p-4",
      "rounded-lg",
      "shadow-lg",
      "flex",
      "items-center",
      "space-x-3",
      "mb-4",
      "transition-all",
      "opacity-100"
    );
    alert.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>${message}</span>
    `;
    const alertContainer = document.getElementById("alertContainer");
    alertContainer.appendChild(alert);
    setTimeout(() => {
      alert.classList.add("opacity-0");
      setTimeout(() => {
        alert.remove();
      }, 500);
    }, 5000);
  };
  // --- 8. Event Listeners (Sidebar) ---
  elements.openSidebarBtn?.addEventListener("click", () => toggleSidebar(true));
  elements.closeSidebarBtn?.addEventListener("click", () =>
    toggleSidebar(false)
  );
  elements.overlay?.addEventListener("click", () => toggleSidebar(false));

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768) toggleSidebar(false);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) toggleSidebar(false);
  });

  // --- Helper Functions ---
  // fetchSupabaseConfig
  const fetchSupabaseConfig = async () => {
    try {
      const response = await fetch("/.netlify/functions/getsupabaseconfig");
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching config:", error);
      elements.statusEl.textContent =
        "Configuration error. Please contact support.";
      elements.statusEl.classList.add("text-red-500");
      return null;
    }
  };

  // logActivity
  const logActivity = async (action, itemName = null, category = null) => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      await supabaseClient.from("activity_logs").insert({
        user_id: session.user.id,
        user_name: session.user.email.split("@")[0],
        action,
        item_name: itemName,
        category,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Activity logging failed:", error.message);
      showErrorAlert("Activity logging failed.  See console for details.");
    }
  };

  // renderCategoryList
  const renderCategoryList = () => {
    elements.categoryList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    categories.forEach((category) => {
      const item = document.createElement("div");
      item.className =
        "category-item flex items-center justify-between p-4 bg-zinc-800 rounded-lg";

      const leftSide = document.createElement("div");
      leftSide.className = "flex items-center";
      leftSide.innerHTML = `<h3 class="font-medium">${category.name}</h3>`;

      const rightSide = document.createElement("div");
      rightSide.className = "flex space-x-2";

      const editBtn = document.createElement("button");
      editBtn.className =
        "bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1 rounded transition";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.onclick = () => openEditModal(category);

      const deleteBtn = document.createElement("button");
      deleteBtn.className =
        "bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = () => openDeleteModal(category);

      rightSide.append(editBtn, deleteBtn);
      item.append(leftSide, rightSide);
      fragment.appendChild(item);
    });

    elements.categoryList.appendChild(fragment);
  };

  // --- 6. Data Fetching & Manipulation ---
  const fetchCategories = async () => {
    try {
      elements.loadingMessage.classList.remove("hidden");
      elements.categoryList.classList.add("hidden");
      elements.noCategories.classList.add("hidden");

      const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;

      categories = data || [];
      elements.categoryList.classList.toggle("hidden", categories.length === 0);
      elements.noCategories.classList.toggle("hidden", categories.length > 0);

      renderCategoryList();
    } catch (error) {
      console.error("Error fetching categories:", error);
      elements.statusEl.textContent =
        "Failed to load categories. Please try again.";
      elements.statusEl.classList.add("text-red-500");
    } finally {
      elements.loadingMessage.classList.add("hidden");
    }
  };

  // addCategory
  const addCategory = async (e) => {
    e.preventDefault();
    elements.statusEl.className = "mt-2 text-center min-h-[24px]";
    try {
      const newCategoryName = elements.categoryName.value.trim();
      if (!newCategoryName) {
        elements.statusEl.innerText = "Category name cannot be empty.";
        elements.statusEl.className =
          "mt-2 text-center text-red-500 min-h-[24px]";
        return;
      }

      const { data, error } = await supabaseClient
        .from("categories")
        .insert([{ name: newCategoryName }])
        .select();
      if (error) throw error;

      elements.categoryForm.reset();
      elements.statusEl.innerText = "Category added successfully!";
      elements.statusEl.classList.add("text-green-500");
      await fetchCategories(); // Refresh the list
      logActivity("Add Category", `Added: ${newCategoryName}`);
    } catch (error) {
      elements.statusEl.innerText = `Error: ${error.message}`;
      elements.statusEl.classList.add("text-red-500");
    }
  };

  // --- 7. Modal Control Functions ---

  // openEditModal
  const openEditModal = (category) => {
    elements.editCategoryId.value = category.id;
    elements.editCategoryName.value = category.name;
    elements.editModal.classList.remove("hidden");
  };

  // closeEditModal
  const closeEditModal = () => {
    elements.editModal.classList.add("hidden");
    elements.editStatus.innerText = "";
  };

  // openDeleteModal
  const openDeleteModal = (category) => {
    categoryToDelete = category;
    elements.deleteModalCategoryName.textContent = category.name;
    elements.deleteModal.classList.remove("hidden");
  };

  // closeDeleteModal
  const closeDeleteModal = () => {
    elements.deleteModal.classList.add("hidden");
    categoryToDelete = null;
  };

  // updateCategory
  const updateCategory = async (e) => {
    e.preventDefault();
    elements.editStatus.className = "mt-2 text-center min-h-[24px]";
    try {
      const updatedCategoryName = elements.editCategoryName.value.trim();
      if (!updatedCategoryName) {
        elements.editStatus.innerText = "Category name cannot be empty.";
        elements.editStatus.className =
          "mt-2 text-center text-red-500 min-h-[24px]";
        return;
      }

      const { error } = await supabaseClient
        .from("categories")
        .update({ name: updatedCategoryName })
        .eq("id", elements.editCategoryId.value);
      if (error) throw error;

      elements.editStatus.innerText = "Category updated successfully!";
      elements.editStatus.classList.add("text-green-500");
      await fetchCategories();
      logActivity(
        "Update Category",
        `Updated ID: ${elements.editCategoryId.value}, Name: ${updatedCategoryName}`
      );
      setTimeout(closeEditModal, 1500);
    } catch (error) {
      elements.editStatus.innerText = `Error: ${error.message}`;
      elements.editStatus.classList.add("text-red-500");
    }
  };

  // deleteCategory
  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    elements.statusEl.className = "mt-2 text-center min-h-[24px]";
    try {
      const { error } = await supabaseClient
        .from("categories")
        .delete()
        .eq("id", categoryToDelete.id);
      if (error) throw error;

      elements.statusEl.innerText = "Category deleted successfully!";
      elements.statusEl.classList.add("text-green-500");

      logActivity("Delete Category", `Deleted: ${categoryToDelete.name}`);
      await fetchCategories();
    } catch (error) {
      elements.statusEl.innerText = `Error: ${error.message}`;
      elements.statusEl.classList.add("text-red-500");
    } finally {
      closeDeleteModal();
      setTimeout(() => {
        elements.statusEl.innerText = "";
      }, 3000);
    }
  };

  // --- 8. Event Listeners ---
  elements.categoryForm.addEventListener("submit", addCategory);
  elements.editForm.addEventListener("submit", updateCategory);
  elements.refreshBtn.addEventListener("click", fetchCategories);
  elements.confirmDeleteBtn.addEventListener("click", deleteCategory);

  // Scroll to top when button is clicked
  elements.backToTopBtn.addEventListener("click", function () {
    elements.mainContent.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  elements.mainContent.addEventListener("scroll", function () {
    if (elements.mainContent.scrollTop > 300) {
      elements.backToTopBtn.classList.remove("opacity-0", "invisible");
      elements.backToTopBtn.classList.add("opacity-100", "visible");
    } else {
      elements.backToTopBtn.classList.remove("opacity-100", "visible");
      elements.backToTopBtn.classList.add("opacity-0", "invisible");
    }
  });

  // --- 9. Initialization ---
  const init = async () => {
    try {
      await initSupabase();
      await fetchCategories();
    } catch (error) {}
  };

  init();
  // --- 10. Global Scope Functions ---
  window.closeEditModal = closeEditModal;
  window.closeDeleteModal = closeDeleteModal;
});
