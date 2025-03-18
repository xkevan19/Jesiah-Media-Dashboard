/* --- Table of Contents ---
 1. Initialization
    1.1. DOM Element Caching
    1.2. Supabase Client Initialization
        1.2.1 initSupabase
 2. Helper Functions
    2.1. toggleSidebar
    2.2. formatFileSize
    2.3. showErrorAlert
    2.4. logActivity
 3. Event Listeners
    3.1. Sidebar
 4. Data Fetching and Update
    4.1. updateTotalMediaCount
    4.2. updateTotalCategoryCount
    4.3. updateStorageUsed
    4.4. updateMediaTypeInfo
 5. Real-time Subscriptions
    5.1. subscribeToTable
 6. Activity Log
    6.1. fetchActivityData
    6.2. loadRecentActivity
    6.3  resetActiveStates
    6.4  renderActivityChart (and chart toggling)
 7. Initialization
    7.1. loadDashboardStats
    7.2. initializeApp
--- END --- */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialization

  // 1.1. DOM Element Caching
  const elements = {
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("overlay"),
    openSidebarBtn: document.getElementById("openSidebar"),
    closeSidebarBtn: document.getElementById("closeSidebar"),
    totalMedia: document.getElementById("totalMedia"),
    totalCategories: document.getElementById("totalCategories"),
    storageUsed: document.getElementById("storageUsed"),
    storagePercentage: document.getElementById("storagePercentage"),
    storageProgressBar: document.getElementById("storageProgressBar"),
    primaryMediaType: document.getElementById("primaryMediaType"),
    mediaTypeBreakdown: document.getElementById("mediaTypeBreakdown"),
    activityTable: document.getElementById("activityTable"),
    toggleBarChart: document.getElementById("toggleBarChart"),
    toggleLineChart: document.getElementById("toggleLineChart"),
    recentActivityChart: document.getElementById("recentActivityChart"),
    storageBar: document.getElementById("storageBar"),
  };

  // 1.2. Supabase Client Initialization
  let supabaseClient;

  // 1.2.1 initSupabase
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

  // 2. Helper Functions

  // 2.1. toggleSidebar
  const toggleSidebar = (isOpen) => {
    elements.sidebar.classList.toggle("open", isOpen);
    elements.overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  };

  // 2.2. formatFileSize
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 2.3. showErrorAlert
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

  // 2.4. logActivity
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
      showErrorAlert("Activity logging failed.  See console for details.");
    }
  };

  // 3. Event Listeners

  // 3.1. Sidebar
  elements.openSidebarBtn?.addEventListener("click", () => {
    toggleSidebar(true);
  });

  elements.closeSidebarBtn?.addEventListener("click", () => {
    toggleSidebar(false);
  });

  elements.overlay?.addEventListener("click", () => {
    toggleSidebar(false);
  });

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        toggleSidebar(false);
        logActivity("Navigate", item.innerText);
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) toggleSidebar(false);
  });

  // 4. Data Fetching and Update

  // 4.1. updateTotalMediaCount
  const updateTotalMediaCount = async () => {
    try {
      const { count, error } = await supabaseClient
        .from("uploads")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      elements.totalMedia.textContent = count || 0;
    } catch (error) {
      console.error("Error updating media count:", error.message);
      showErrorAlert("Failed to update total media count. Please refresh.");
    }
  };

  // 4.2. updateTotalCategoryCount
  const updateTotalCategoryCount = async () => {
    try {
      const { count, error } = await supabaseClient
        .from("categories")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      elements.totalCategories.textContent = count || 0;
    } catch (error) {
      console.error("Error updating category count:", error.message);
      showErrorAlert("Failed to update total category count. Please refresh.");
    }
  };

  // 4.3. updateStorageUsed
  const updateStorageUsed = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("uploads")
        .select("file_size");
      if (error) throw error;

      const totalSizeBytes = data.reduce(
        (acc, file) => acc + (file.file_size || 0),
        0
      );
      const displaySize = formatFileSize(totalSizeBytes);
      const totalCapacityBytes = 1024 * 1024 * 1024; // 1 GB
      const percentageUsed = (totalSizeBytes / totalCapacityBytes) * 100;
      const roundedPercentage = percentageUsed.toFixed(1);

      elements.storageUsed.textContent = `${displaySize} / 1 GB`;
      elements.storagePercentage.textContent = `${roundedPercentage}% of total capacity`;
      elements.storageProgressBar.style.width = `${percentageUsed}%`;

      if (elements.storageBar) {
        elements.storageBar.style.width = `${percentageUsed}%`;
        elements.storageBar.classList.toggle("bg-red-500", percentageUsed > 90);
        elements.storageBar.classList.toggle(
          "bg-orange-500",
          percentageUsed > 70 && percentageUsed <= 90
        );
        elements.storageBar.classList.toggle(
          "bg-blue-500",
          percentageUsed <= 70
        );
      }
    } catch (error) {
      console.error("Error updating storage used:", error.message);
      showErrorAlert("Failed to update storage usage. Please refresh.");
    }
  };

  // 4.4. updateMediaTypeInfo
  const updateMediaTypeInfo = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("uploads")
        .select("file_type");
      if (error) throw error;

      const typeCounts = data.reduce((acc, item) => {
        const type = item.file_type || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const [primaryType = "None", maxCount = 0] = Object.entries(
        typeCounts
      ).reduce(
        ([pType, pMax], [type, count]) =>
          count > pMax ? [type, count] : [pType, pMax],
        ["None", 0]
      );

      const formattedType =
        primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
      elements.primaryMediaType.textContent = formattedType;

      const totalFiles = Object.values(typeCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      let breakdownText =
        totalFiles > 0
          ? `${Math.round((maxCount / totalFiles) * 100)}% of your media`
          : "No media files";

      const typeEntries = Object.entries(typeCounts).sort(
        ([, a], [, b]) => b - a
      );
      if (typeEntries.length > 1) {
        const [, secondPercentage] = typeEntries[1];
        breakdownText += `, ${typeEntries[1][0]}: ${Math.round(
          (secondPercentage / totalFiles) * 100
        )}%`;
      }
      elements.mediaTypeBreakdown.textContent = breakdownText;
    } catch (error) {
      console.error("Error updating media types:", error.message);
      showErrorAlert(
        "Failed to update media type information. Please refresh."
      );
    }
  };

  // 5. Real-time Subscriptions

  // 5.1. subscribeToTable
  const subscribeToTable = (table, updateFunction) => {
    if (!supabaseClient) return;
    supabaseClient
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        updateFunction
      )
      .subscribe();
  };

  // 6. Activity Log

  // 6.1. fetchActivityData
  const fetchActivityData = async () => {
    const { data, error } = await supabaseClient
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  };

  // 6.2. loadRecentActivity
  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      elements.activityTable.innerHTML = "";

      if (data.length === 0) {
        elements.activityTable.innerHTML = `<tr class="text-zinc-300"><td colspan="5" class="py-3 text-center">No recent activity found</td></tr>`;
        return;
      }

      const rowsHtml = data
        .map((activity) => {
          const activityDate = new Date(activity.created_at);
          const today = new Date();
          let dateDisplay;

          if (activityDate.toDateString() === today.toDateString()) {
            dateDisplay = `Today, ${activityDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`;
          } else if (activityDate.getTime() > today.getTime() - 86400000) {
            dateDisplay = `Yesterday, ${activityDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`;
          } else {
            dateDisplay = activityDate.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            });
          }

          return `<tr class="border-b border-zinc-800 text-zinc-300">
              <td class="py-3">${activity.action || "-"}</td>
              <td class="py-3 hidden sm:table-cell">${
                activity.item_name || "-"
              }</td>
              <td class="py-3 hidden md:table-cell">${
                activity.category || "-"
              }</td>
              <td class="py-3">${dateDisplay}</td>
              <td class="py-3">${activity.user_name || "System"}</td>
            </tr>`;
        })
        .join("");

      elements.activityTable.innerHTML = rowsHtml;
    } catch (error) {
      console.error("Error loading activity:", error.message);
      showErrorAlert("Failed to load recent activity. Please refresh.");
    }
  };

  // 6.3. resetActiveStates
  const resetActiveStates = () => {
    elements.toggleBarChart.classList.remove("bg-zinc-600");
    elements.toggleBarChart.classList.add("bg-zinc-800");
    elements.toggleLineChart.classList.remove("bg-zinc-600");
    elements.toggleLineChart.classList.add("bg-zinc-800");
  };

  let currentChartType = "bar";

  elements.toggleBarChart.addEventListener("click", () => {
    resetActiveStates();
    elements.toggleBarChart.classList.add("bg-zinc-600");
    currentChartType = "bar";
    renderActivityChart();
    logActivity("Toggle Chart", "Bar Chart");
  });

  elements.toggleLineChart.addEventListener("click", () => {
    resetActiveStates();
    elements.toggleLineChart.classList.add("bg-zinc-600");
    currentChartType = "line";
    renderActivityChart();
    logActivity("Toggle Chart", "Line Chart");
  });

  // 6.4. renderActivityChart (and chart toggling)
  const renderActivityChart = async () => {
    try {
      const data = await fetchActivityData();

      const dailyCounts = data.reduce((acc, activity) => {
        const dateKey = new Date(activity.created_at)
          .toISOString()
          .split("T")[0];
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {});

      const labels = Object.keys(dailyCounts).sort();
      const counts = labels.map((label) => dailyCounts[label]);

      const ctx = elements.recentActivityChart.getContext("2d");

      if (window.activityChart) {
        window.activityChart.data.labels = labels;
        window.activityChart.data.datasets[0].data = counts;
        window.activityChart.config.type = currentChartType;
        window.activityChart.update();
      } else {
        window.activityChart = new Chart(ctx, {
          type: currentChartType,
          data: {
            labels: labels,
            datasets: [
              {
                label: "Recent Activities",
                data: counts,
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            animations: {
              tension: {
                duration: 1000,
                easing: "easeInOutCubic",
                from: 1,
                to: 0,
                loop: true,
              },
            },
            scales: {
              x: { title: { display: true, text: "Date" } },
              y: {
                title: { display: true, text: "Number of Activities" },
                beginAtZero: true,
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("Error loading activity chart:", error.message);
      showErrorAlert("Failed to load activity chart. Please refresh.");
    }
  };
  // 7. Initialization

  // 7.1. loadDashboardStats
  const loadDashboardStats = async () => {
    await Promise.all([
      loadRecentActivity(),
      updateTotalMediaCount(),
      updateTotalCategoryCount(),
      updateStorageUsed(),
      updateMediaTypeInfo(),
    ]);
  };

  // 7.2. initializeApp
  const initializeApp = async () => {
    try {
      await initSupabase();
      const session = await initializeSession();
      if (session) {
        await loadUserProfile(session);
        await loadDashboardStats();
        await renderActivityChart();
        subscribeToTable("uploads", () => {
          updateTotalMediaCount();
          updateStorageUsed();
          updateMediaTypeInfo();
        });
        subscribeToTable("categories", updateTotalCategoryCount);
        subscribeToTable("activity_logs", loadRecentActivity);
      }
    } catch (error) {
      console.error("initializeApp error:", error);
    }
  };

  initializeApp();
});
