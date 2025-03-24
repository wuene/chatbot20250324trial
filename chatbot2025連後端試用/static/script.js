document.addEventListener("DOMContentLoaded", () => {
    /* ------------------------------
       1. 聊天功能 (原本程式)
    ------------------------------ */
    async function sendMessage() {
        let inputField = document.getElementById("message");
        let chatHistory = document.getElementById("chat-history");
        let welcomeSection = document.querySelector(".chat-welcome"); // 選到整個歡迎區塊

        
        if (inputField.value.trim() !== "") {
            
            // 第一次送出訊息時，就隱藏歡迎區塊
            if (welcomeSection) {
            welcomeSection.style.display = "none";
            }

           // 顯示使用者訊息（右側黑框）
           let userMessageEl = document.createElement("section");
           userMessageEl.classList.add("chat-container");
           userMessageEl.innerHTML = `
             <div class="user-message-container">
                 <p class="user-message">${inputField.value}</p>
             </div>
           `;
           inputField.value = "";
           chatHistory.appendChild(userMessageEl);

           chatHistory.scrollTop = chatHistory.scrollHeight;


            // 呼叫後端 /chat API
            try {
                let response = await fetch("/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: inputField.value })
                });
                let result = await response.json();



                // 顯示 AI 回應
                let botMessageEl = document.createElement("section");
                botMessageEl.classList.add("chat-container");
                botMessageEl.innerHTML = `
                    <div class="assistant-message-container">
                        <p class="assistant-message">${result.reply}</p>
                    </div>
                `;
                chatHistory.appendChild(botMessageEl);
            } catch (error) {
                // 顯示錯誤訊息
                let errorEl = document.createElement("section");
                errorEl.classList.add("chat-container");
                errorEl.innerHTML = `
                    <div class="assistant-message-container">
                        <p class="assistant-message">⚠️ 錯誤：${error}</p>
                    </div>
                `;
                chatHistory.appendChild(errorEl);
            }

            inputField.value = "";
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }

    // 監聽 Enter 鍵 (聊天功能)
    let messageInput = document.getElementById("message");
    if (messageInput) {
        messageInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();  // 防止預設行為
                sendMessage();
            }
        });
    }
    

    /* ------------------------------
       2. Modal 彈窗功能
    ------------------------------ */
    const signupBtn = document.getElementById("signup-btn");
    const modal = document.getElementById("modal");
    const confirmBtn = document.getElementById("confirm-btn");

    // 若該頁面存在相關元素，則加入事件監聽
    if (signupBtn && modal && confirmBtn) {
        // 按下 "Sign up with email" 顯示 Modal
        signupBtn.addEventListener("click", () => {
            modal.style.display = "block";
        });

        // 3. 按下 "Confirm" => 切換到 Success 畫面
        confirmBtn.addEventListener("click", () => {
            // 隱藏 modal
            modal.style.display = "none";

            // 隱藏 Sign up 主要區塊
            const signupContainer = document.getElementById("signup-container");
            if (signupContainer) {
                signupContainer.style.display = "none";
            }

            // 顯示 Success 區塊
            const successContainer = document.getElementById("success-container");
            if (successContainer) {
                successContainer.style.display = "block";
            }
 
         
        });

    // Continue 按鈕點擊處理
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
        // 跳轉到聊天頁面
            window.location.href = '/chat';  // 假設你的聊天頁面路由是 /chat
        });
    }


        // 點擊 Modal 外部區域關閉 Modal
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    }

    // 加入以下程式碼來處理三個點按鈕
    const dotsButton = document.getElementById("dotsButton");
    const dotsMenu = document.getElementById("dotsMenu");

    if (dotsButton && dotsMenu) {
        dotsButton.addEventListener("click", (event) => {
        // 切換選單顯示或隱藏
        if (dotsMenu.style.display === "none" || dotsMenu.style.display === "") {
            dotsMenu.style.display = "block";
        } else {
            dotsMenu.style.display = "none";
        }
        // 阻止點擊事件冒泡，避免影響其他點擊處理
        event.stopPropagation();
        });

        // 當使用者點擊頁面其他地方時，自動隱藏選單
        document.addEventListener("click", (event) => {
        if (!dotsButton.contains(event.target) && !dotsMenu.contains(event.target)) {
            dotsMenu.style.display = "none";
        }
        });
    }    
});
