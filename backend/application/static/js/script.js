document.addEventListener("DOMContentLoaded", function() {
  // Verifica qual página foi carregada com base na existência de elementos específicos
  if (document.getElementById("loginContainer")) {
    initLoginPage();
  } else if (document.querySelector(".conversation-container")) {
    initConversationPage();
  } else if (document.getElementById("chatContainer")) {
    initChatPage();
  }
});

/* ====================================================
   LÓGICA DA PÁGINA DE LOGIN / CADASTRO (login.html)
   ==================================================== */
function initLoginPage() {
  // ---------------------------
  // Seleção dos elementos do DOM
  // ---------------------------
  const loginContainer   = document.getElementById("loginContainer");
  const loginForm        = document.getElementById("loginForm");
  const registerForm     = document.getElementById("registerForm");
  const usernameInput    = document.getElementById("usernameInput");
  const passwordInput    = document.getElementById("passwordInput");
  const loginBtn         = document.getElementById("loginBtn");
  const loginError       = document.getElementById("loginError");
  const showRegisterBtn  = document.getElementById("showRegisterBtn");
  const registerName     = document.getElementById("registerName");
  const registerEmail    = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");
  const registerError    = document.getElementById("registerError");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const cancelRegisterBtn= document.getElementById("cancelRegisterBtn");

  // ---------------------------
  // Variáveis e inicializações
  // ---------------------------
  let registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
  // Se não houver usuários registrados, cria um usuário padrão
  if (Object.keys(registeredUsers).length === 0) {
    registeredUsers["usuario@exemplo.com"] = "Senha123";
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
  }

  // ---------------------------
  // Funções utilitárias
  // ---------------------------
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  function isValidPassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{10,}$/;
    return passwordRegex.test(password);
  }

  // ---------------------------
  // Configuração dos event listeners
  // ---------------------------
  // Exibe o formulário de cadastro
  showRegisterBtn.addEventListener("click", () => {
    loginForm.style.display = "none";
    registerForm.style.display = "flex";
  });

  // Cancela o cadastro e volta para o formulário de login
  cancelRegisterBtn.addEventListener("click", () => {
    registerForm.style.display = "none";
    loginForm.style.display = "flex";
    registerError.textContent = "";
    registerEmail.value = "";
    registerPassword.value = "";
    registerName.value = "";
  });

  // Cria a conta do usuário, após validações
  createAccountBtn.addEventListener("click", () => {
    const name     = registerName.value.trim();
    const email    = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    
    if (!isValidEmail(email)) {
      registerError.textContent = "Por favor, insira um email válido.";
      return;
    }
    if (!isValidPassword(password)) {
      registerError.textContent = "A senha deve ter pelo menos 10 caracteres, incluir números e uma letra maiúscula.";
      return;
    }
    
    registeredUsers[email] = password;
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
    alert("Conta criada com sucesso!");
    
    // Após cadastro, preenche o campo de login e volta para o formulário de login
    usernameInput.value = email;
    registerForm.style.display = "none";
    loginForm.style.display = "flex";
    registerError.textContent = "";
    registerEmail.value = "";
    registerPassword.value = "";
    registerName.value = "";
  });

  // Efetua o login do usuário
  loginBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!(registeredUsers[username] && registeredUsers[username] === password)) {
      loginError.textContent = "Usuário ou senha incorretos!";
    }
  });
}

/* ====================================================
   LÓGICA DA PÁGINA DO CHAT (chat.html)
   ==================================================== */
function initChatPage() {
  // ---------------------------
  // Variáveis e armazenamento
  // ---------------------------
  let conversations       = JSON.parse(localStorage.getItem("conversations") || "[]");
  let conversationCounter = conversations.length;
  
  // ---------------------------
  // Seleção dos elementos do DOM
  // ---------------------------
  const toggleArrow   = document.getElementById("toggleArrow");
  const sidebar       = document.getElementById("sidebar");
  const historyList   = document.getElementById("historyList");
  const chatWindow    = document.getElementById("chatWindow");
  const messageInput  = document.getElementById("messageInput");
  const sendBtn       = document.getElementById("sendBtn");
  const fileBtn       = document.getElementById("fileBtn");
  const fileInput     = document.getElementById("fileInput");
  const audioBtn      = document.getElementById("audioBtn");

  const customModal   = document.getElementById("customModal");
  const modalTitle    = document.getElementById("modalTitle");
  const modalBody     = document.getElementById("modalBody");
  const modalCancelBtn= document.getElementById("modalCancelBtn");
  const modalConfirmBtn= document.getElementById("modalConfirmBtn");

  const profileIcon   = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn     = document.getElementById("logoutBtn");
  const configBtn     = document.getElementById("configBtn");
  const configModal   = document.getElementById("configModal");
  const closeModal    = document.getElementById("closeModal");
  const configForm    = document.getElementById("configForm");

  // Variáveis auxiliares para ações modais
  let currentAction = null;
  let currentConvId = null;

  // ---------------------------
  // Funções auxiliares
  // ---------------------------
  // Salva as conversas no localStorage
  function saveConversations() {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }

  // Renderiza a lista de conversas na barra lateral
  function renderConversationsSidebar() {
    historyList.innerHTML = "";
    conversations.forEach(conv => {
      // Cria o item da conversa
      const li = document.createElement("li");
      li.classList.add("conversation-item");
      li.setAttribute("data-id", conv.id);
      
      // Título da conversa (com limite de caracteres)
      const titleSpan = document.createElement("span");
      titleSpan.classList.add("conversation-title");
      titleSpan.textContent = conv.title || "Nova Conversa";
      
      // Ícone de opções (representado por "...")
      const optionsIcon = document.createElement("span");
      optionsIcon.classList.add("options-icon");
      optionsIcon.textContent = "...";
      
      // Evento de clique para exibir menu inline de opções
      optionsIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        // Fecha quaisquer pop-ups abertos
        document.querySelectorAll(".inline-popup").forEach(el => el.remove());
        
        // Cria o menu inline
        const popup = document.createElement("div");
        popup.classList.add("inline-popup");
        
        const renameBtn = document.createElement("button");
        renameBtn.textContent = "Renomear";
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Apagar";
        
        popup.appendChild(renameBtn);
        popup.appendChild(deleteBtn);
        optionsIcon.appendChild(popup);
        
        // Evita que cliques dentro do pop-up fechem o menu
        popup.addEventListener("click", (ev) => ev.stopPropagation());
        
        // Ação de renomear: substitui o título por um input para edição
        renameBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          popup.remove();
          const input = document.createElement("input");
          input.type = "text";
          input.value = conv.title;
          input.classList.add("conversation-title-edit");
          li.replaceChild(input, titleSpan);
          input.focus();
          
          const finishEdit = () => {
            if (input.value.trim() !== "") {
              conv.title = input.value.trim();
            }
            titleSpan.textContent = conv.title;
            li.replaceChild(titleSpan, input);
            saveConversations();
          };
          input.addEventListener("blur", finishEdit);
          input.addEventListener("keydown", (keyEv) => {
            if (keyEv.key === "Enter") {
              input.blur();
            } else if (keyEv.key === "Escape") {
              input.value = conv.title;
              input.blur();
            }
          });
        });
        
        // Ação de apagar: chama a modal de confirmação (versão inline)
        deleteBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          popup.remove();
          showDeleteModalInline(conv);
        });
      });
      
      // Fecha pop-ups se clicar fora
      document.addEventListener("click", () => {
        document.querySelectorAll(".inline-popup").forEach(el => el.remove());
      });
      
      li.appendChild(titleSpan);
      li.appendChild(optionsIcon);
      historyList.appendChild(li);
    });
  }

  // Modal inline para exclusão de conversa (usando elementos do deleteModal)
  function showDeleteModalInline(conv) {
    const deleteModal      = document.getElementById("deleteModal");
    const deleteModalTitle = document.getElementById("deleteModalTitle");
    const deleteModalBody  = document.getElementById("deleteModalBody");
    const deleteCancelBtn  = document.getElementById("deleteCancelBtn");
    const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

    deleteModalTitle.textContent = "Apagar Conversa";
    deleteModalBody.textContent  = `Deseja mesmo apagar a conversa "${conv.title}"?`;
    deleteModal.style.display = "flex";
    
    deleteCancelBtn.onclick = function() {
      deleteModal.style.display = "none";
    };
    
    deleteConfirmBtn.onclick = function() {
      conversations = conversations.filter(c => c.id !== conv.id);
      saveConversations();
      renderConversationsSidebar();
      deleteModal.style.display = "none";
    };
  }

  // Modal customizado para opções de conversa
  function showCustomModal(conv) {
    modalTitle.textContent = "Opções da Conversa";
    modalBody.innerHTML = `
      <button id="renameBtn" class="modal-option">Renomear</button>
      <button id="deleteBtn" class="modal-option">Apagar</button>
    `;
    customModal.style.display = "flex";
    
    document.getElementById("renameBtn").addEventListener("click", () => {
      customModal.style.display = "none";
      showRenameModal(conv);
    });
    document.getElementById("deleteBtn").addEventListener("click", () => {
      customModal.style.display = "none";
      showDeleteModalCustom(conv);
    });
  }

  // Modal para renomear conversa
  function showRenameModal(conv) {
    modalTitle.textContent = "Renomear Conversa";
    modalBody.innerHTML = `<input type="text" id="newNameInput" value="${conv.title}">`;
    customModal.style.display = "flex";
    currentAction = "rename";
    currentConvId = conv.id;
  }

  // Modal customizado para exclusão de conversa
  function showDeleteModalCustom(conv) {
    modalTitle.textContent = "Apagar Conversa";
    modalBody.innerHTML = `<p>Deseja realmente apagar a conversa "${conv.title}"?</p>`;
    customModal.style.display = "flex";
    currentAction = "delete";
    currentConvId = conv.id;
  }

  // ---------------------------
  // Eventos dos botões e inputs
  // ---------------------------
  // Envio de mensagem: cria nova conversa e redireciona para ela
  sendBtn.addEventListener("click", () => {
    const messageText = messageInput.value.trim();
    if (messageText === "") return;
    
    conversationCounter++;
    // Limita o título a 20 caracteres (acrescenta "..." se maior)
    const title = messageText.length > 20 ? messageText.substring(0,20) + "..." : (messageText || "Nova Conversa");
    const newConv = {
      id: conversationCounter.toString(),
      title: title,
      messages: [{ text: messageText, sender: "user" }]
    };
    conversations.push(newConv);
    // Simula resposta do bot
    newConv.messages.push({ text: "Olá! Como posso ajudar?", sender: "bot" });
    saveConversations();
    renderConversationsSidebar();
    
  });
  
  // Permite envio com a tecla Enter
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });
  
  // Simulação de envio de arquivo
  fileBtn.addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      alert("Simulação: arquivo selecionado (" + fileInput.files[0].name + ").");
      fileInput.value = "";
    }
  });
  
  // Simulação de envio de áudio
  audioBtn.addEventListener("click", () => {
    alert("Simulação: áudio enviado.");
  });
  
  // Menu de perfil
  profileIcon.addEventListener("click", (e) => {
    profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
    e.stopPropagation();
  });
  window.addEventListener("click", (e) => {
    if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.style.display = "none";
    }
  });
  
  
  // Configurações
  configBtn.addEventListener("click", () => {
    configModal.style.display = "flex";
    profileDropdown.style.display = "none";
  });
  closeModal.addEventListener("click", () => {
    configModal.style.display = "none";
  });
  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const theme      = document.querySelector('input[name="theme"]:checked').value;
    const fontSize   = document.getElementById("fontSizeSelect").value;
    const fontFamily = document.getElementById("fontFamilySelect").value;
    
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    document.body.style.fontSize   = fontSize;
    document.body.style.fontFamily = fontFamily;
    configModal.style.display = "none";
  });

  // Renderiza a lista de conversas ao carregar a página
  renderConversationsSidebar();
}

/* ====================================================
   LÓGICA DA PÁGINA DE CONVERSA (conversation.html)
   ==================================================== */
function initConversationPage() {
  // ---------------------------
  // Funções de carregamento e salvamento das conversas
  // ---------------------------
  function loadConversations() {
    return JSON.parse(localStorage.getItem("conversations") || "[]");
  }
  function saveConversations(conversations) {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }

  // ---------------------------
  // Obtenção dos parâmetros da URL e seleção da conversa atual
  // ---------------------------
  const urlParams      = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get("conversationId");
  let conversations    = loadConversations();
  const currentConversation = conversations.find(conv => conv.id === conversationId);

  // ---------------------------
  // Seleção dos elementos do DOM
  // ---------------------------
  const chatWindow       = document.getElementById("chatWindow");
  const messageInput     = document.getElementById("messageInput");
  const sendBtn          = document.getElementById("sendBtn");
  const fileBtn          = document.getElementById("fileBtn");
  const fileInput        = document.getElementById("fileInput");
  const audioBtn         = document.getElementById("audioBtn");
  const conversationTitle= document.getElementById("conversationTitle");

  // Se a conversa não for encontrada, exibe mensagem de erro
  if (!currentConversation) {
    chatWindow.innerHTML = "<p class='error'>Conversa não encontrada.</p>";
    return;
  }
  conversationTitle.textContent = currentConversation.title;

  // ---------------------------
  // Função para renderizar as mensagens da conversa
  // ---------------------------
  function renderMessages() {
    chatWindow.innerHTML = "";
    currentConversation.messages.forEach(msg => {
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message", msg.sender);
      msgDiv.textContent = msg.text;
      chatWindow.appendChild(msgDiv);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // ---------------------------
  // Configuração dos eventos de envio de mensagem
  // ---------------------------
  sendBtn.addEventListener("click", () => {
    const messageText = messageInput.value.trim();
    if (messageText === "") return;
    
    // Adiciona mensagem do usuário e salva
    currentConversation.messages.push({ text: messageText, sender: "user" });
    saveConversations(conversations);
    renderMessages();
    messageInput.value = "";
    messageInput.style.height = "auto";
    
    // Simula resposta do bot após 500ms
    setTimeout(() => {
      currentConversation.messages.push({ text: "Estou aqui para ajudar!", sender: "bot" });
      saveConversations(conversations);
      renderMessages();
    }, 500);
  });
  
  // Envio com Enter (sem Shift)
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });
  
  // Simulação de envio de arquivo
  fileBtn.addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      currentConversation.messages.push({ text: "Arquivo enviado: " + file.name, sender: "user" });
      saveConversations(conversations);
      renderMessages();
      fileInput.value = "";
      // Resposta simulada do bot
      setTimeout(() => {
        currentConversation.messages.push({ text: "Arquivo recebido. Em breve responderei!", sender: "bot" });
        saveConversations(conversations);
        renderMessages();
      }, 500);
    }
  });
  
  // Simulação de envio de áudio
  audioBtn.addEventListener("click", () => {
    currentConversation.messages.push({ text: "Áudio enviado (simulação).", sender: "user" });
    saveConversations(conversations);
    renderMessages();
    setTimeout(() => {
      currentConversation.messages.push({ text: "Áudio recebido. Vou processar a informação!", sender: "bot" });
      saveConversations(conversations);
      renderMessages();
    }, 500);
  });
  
  // Renderiza as mensagens ao carregar a página
  renderMessages();
}
