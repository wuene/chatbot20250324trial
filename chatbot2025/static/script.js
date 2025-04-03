document.addEventListener("DOMContentLoaded", () => {
  let historyList = JSON.parse(localStorage.getItem("chatHistoryList")) || [];
  let currentChatIndex = null;

  const inputField = document.getElementById("message");
  const chatHistory = document.getElementById("chat-history");
  const historyListContainer = document.getElementById("history-list");
  const newButton = document.querySelector(".new-button");
  const welcomeSection = document.querySelector(".chat-welcome");
  

  function saveToLocalStorage() {
    localStorage.setItem("chatHistoryList", JSON.stringify(historyList));
  }

  function createHistoryButton(title, index) {
    const button = document.createElement("button");
    button.textContent = title;
    button.classList.add("nav-item", "history-button");
    button.style.justifyContent = "flex-start";
    button.style.fontSize = "14px";
    button.style.padding = "8px 12px";
    button.addEventListener("click", () => {
      currentChatIndex = index;
      renderChat();
      renderSidebarButtons();
    });
    return button;
  }

    // ⭐ 搜尋聊天紀錄 + 滾動到關鍵字訊息
  document.getElementById("searchInput").addEventListener("input", function (e) {
    const keyword = e.target.value.trim();
    const allChats = JSON.parse(localStorage.getItem("chatHistoryList")) || [];

    if (!keyword) {
      renderSidebarButtons(); // 沒有輸入關鍵字就顯示所有紀錄
      return;
    }

    const filtered = allChats
      .map((chat, idx) => ({ chat, idx }))
      .filter(({ chat }) =>
        chat.some(msg => msg.text.includes(keyword))
      );

    historyListContainer.innerHTML = "";

    if (filtered.length === 0) {
      const noResult = document.createElement("div");
      noResult.textContent = "沒有符合的對話紀錄";
      noResult.style.color = "#888";
      noResult.style.margin = "8px";
      historyListContainer.prepend(noResult);
      return;
    }

    filtered.forEach(({ chat, idx }) => {
      const title = chat[0]?.text?.slice(0, 10) || "Untitled";
      const button = createHistoryButton(title, idx);
      button.addEventListener("click", () => {
        currentChatIndex = idx;
        renderChat();
        setTimeout(() => {
          scrollToKeyword(keyword);
        }, 100); // 等聊天內容載入後再捲動
      });
      historyListContainer.prepend(button);
    });
  });

  function scrollToKeyword(keyword) {
    const messages = document.querySelectorAll("#chat-history .user-message, #chat-history .assistant-message");

    messages.forEach(msg => msg.classList.remove("highlight-message"));

    for (const msg of messages) {
      if (msg.textContent.includes(keyword)) {
        msg.classList.add("highlight-message");
        msg.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }
  }


  function renderSidebarButtons() {
    historyListContainer.innerHTML = "";
    historyList.forEach((chat, idx) => {
      const title = chat[0]?.text?.slice(0, 10) || "Untitled";
      const btn = createHistoryButton(title, idx);
      if (idx === currentChatIndex) btn.classList.add("active");
      historyListContainer.prepend(btn);
    });
  }

  function renderChat() {
    chatHistory.innerHTML = "";
    if (welcomeSection) welcomeSection.style.display = "none";

    const chat = historyList[currentChatIndex];
    chat.forEach((msg) => {
      const section = document.createElement("section");
      section.classList.add("chat-container");
      section.innerHTML = `
        <div class="${msg.sender === 'user' ? 'user-message-container' : 'assistant-message-container'}">
          <p class="${msg.sender === 'user' ? 'user-message' : 'assistant-message'}">${msg.text}</p>
        </div>
      `;
      chatHistory.appendChild(section);
    });

    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;

    // 建立新對話
    if (currentChatIndex === null) {
      currentChatIndex = historyList.length;
      historyList.push([]);
    }

    // 隱藏歡迎畫面
    if (welcomeSection) welcomeSection.style.display = "none";

    // 儲存並顯示使用者訊息
    historyList[currentChatIndex].push({ sender: "user", text: message });
    inputField.value = "";
    renderChat();
    saveToLocalStorage();

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const result = await response.json();

      historyList[currentChatIndex].push({ sender: "bot", text: result.reply });
      renderChat();
      saveToLocalStorage();
    } catch (error) {
      historyList[currentChatIndex].push({ sender: "bot", text: "⚠️ 錯誤：" + error });
      renderChat();
      saveToLocalStorage();
    }

    // 更新標題
    renderSidebarButtons();
  }

  inputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

  newButton.addEventListener("click", () => {
    currentChatIndex = null;
    inputField.value = "";
    chatHistory.innerHTML = "";
    if (welcomeSection) welcomeSection.style.display = "flex";
  });

    const dotsButton = document.getElementById("dotsButton");
    const dotsMenu = document.getElementById("dotsMenu");
  
    if (dotsButton && dotsMenu) {
      dotsButton.addEventListener("click", () => {
        const isVisible = dotsMenu.style.display === "block";
        dotsMenu.style.display = isVisible ? "none" : "block";
      });
  
      // 點擊其他地方就關掉 menu
      document.addEventListener("click", (event) => {
        if (!dotsMenu.contains(event.target) && !dotsButton.contains(event.target)) {
          dotsMenu.style.display = "none";
        }
      });
    }

    
    document.querySelector('.nav-item[href="/history"]').addEventListener("click", function (e) {
      e.preventDefault(); // 防止預設跳頁
      document.getElementById("history-panel").style.display = "flex";
    });
    
    document.addEventListener("DOMContentLoaded", function () {
      const historyButton = document.querySelector(".nav-item:nth-child(3)");
      const historyPanel = document.getElementById("history-panel");
    
      historyButton.addEventListener("click", function (e) {
        e.preventDefault(); // 不跳轉
        const isVisible = historyPanel.style.display === "flex";
        historyPanel.style.display = isVisible ? "none" : "flex";
      });
    });
    
    // 點 Home 或 Explore 時自動關掉搜尋欄
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const href = item.getAttribute("href");
      if (href !== "/history") {
        const panel = document.getElementById("history-panel");
        if (panel) panel.style.display = "none";
      }
    });
  });


  // 初始化
  renderSidebarButtons();
});
