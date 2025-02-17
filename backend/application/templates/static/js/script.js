document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------------------------
     Variável para armazenar os usuários registrados
     (inicia com o usuário padrão)
  ------------------------------------------------ */
  const registeredUsers = {
    "Usuário@gmail.com": "Senha123"
  };

  /* ------------------------------------------------
     Lógica de Login e Criação de Conta
  ------------------------------------------------ */
  const loginContainer = document.getElementById("loginContainer");
  const chatContainer = document.getElementById("chatContainer");
  
  // Elementos do formulário de login
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const showRegisterBtn = document.getElementById("showRegisterBtn");

  // Elementos do formulário de criação de conta
  const registerForm = document.getElementById("registerForm");
  const registerEmail = document.getElementById("registerEmail");
  const registerName = document.getElementById("registerName");
  const registerPassword = document.getElementById("registerPassword");
  const registerError = document.getElementById("registerError");
  const createAccountBtn = document.getElementById("createAccountBtn");
  const cancelRegisterBtn = document.getElementById("cancelRegisterBtn");

  // Validação e ação de login
  loginBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (registeredUsers[username] && registeredUsers[username] === password) {
      // Login bem-sucedido
      loginContainer.style.display = "none";
      chatContainer.style.display = "flex";
      loginError.textContent = "";
    } else {
      loginError.textContent = "Usuário ou senha incorretos!";
    }
  });

  // Alterna para o formulário de criação de conta
  showRegisterBtn.addEventListener("click", () => {
    loginForm.style.display = "none";
    registerForm.style.display = "flex";
  });

  // Cancela a criação e volta para o login
  cancelRegisterBtn.addEventListener("click", () => {
    registerForm.style.display = "none";
    loginForm.style.display = "flex";
    registerError.textContent = "";
    registerEmail.value = "";
    registerPassword.value = "";
  });

  // Validação simples para email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validação para senha: ao menos 10 caracteres, 1 dígito e 1 letra maiúscula
  function isValidPassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{10,}$/;
    return passwordRegex.test(password);
  }

  // Criação de nova conta
  createAccountBtn.addEventListener("click", () => {
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();

    if (!isValidEmail(email)) {
      registerError.textContent = "Por favor, insira um email válido.";
      return;
    }

    if (!isValidPassword(password)) {
      registerError.textContent = "A senha deve ter pelo menos 10 caracteres, incluir números e uma letra maiúscula.";
      return;
    }

    // Simula a criação de conta armazenando em registeredUsers
    registeredUsers[email] = password;
    alert("Conta criada com sucesso!");

    // Após criar a conta, volta para o formulário de login e preenche o campo com o email criado
    registerForm.style.display = "none";
    loginForm.style.display = "flex";
    usernameInput.value = email;
    registerError.textContent = "";
    registerEmail.value = "";
    registerPassword.value = "";
  });

  /* ------------------------------------------------
     Lógica do Chat (mesmo da versão anterior)
  ------------------------------------------------ */
  const toggleArrow = document.getElementById("toggleArrow");
  const sidebar = document.getElementById("sidebar");
  const chatWindow = document.getElementById("chatWindow");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const historyList = document.getElementById("historyList");
  const fileBtn = document.getElementById("fileBtn");
  const fileInput = document.getElementById("fileInput");
  const audioBtn = document.getElementById("audioBtn");

  let conversations = [
    {
      id: "1",
      messages: [
        { text: "Olá, eu sou a SamsAI. Como posso te ajudar?", sender: "bot" }
      ]
    },
    {
      id: "2",
      messages: [
        { text: "Esta é a segunda conversa. Como posso te ajudar?", sender: "bot" }
      ]
    },
    {
      id: "3",
      messages: [
        { text: "Bem-vindo à conversa 3. Alguma dúvida?", sender: "bot" }
      ]
    }
  ];

  let currentConversationId = "1";
  renderConversation(currentConversationId);

  toggleArrow.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    toggleArrow.innerHTML = sidebar.classList.contains("collapsed") ? "&#9654;" : "&#9664;";
  });

  sendBtn.addEventListener("click", sendUserMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendUserMessage();
  });

  historyList.addEventListener("click", (e) => {
    if (e.target && e.target.nodeName === "LI") {
      const conversationId = e.target.getAttribute("data-id");
      if (conversationId) {
        currentConversationId = conversationId;
        renderConversation(currentConversationId);
      }
    }
  });

  fileBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      addMessageToConversation(`Arquivo selecionado: ${file.name}`, "user");
      fileInput.value = "";
      botAutoResponse();
    }
  });

  audioBtn.addEventListener("click", () => {
    addMessageToConversation("Áudio enviado (simulação).", "user");
    botAutoResponse();
  });

  function sendUserMessage() {
    const message = messageInput.value.trim();
    if (message !== "") {
      addMessageToConversation(message, "user");
      messageInput.value = "";
      botAutoResponse();
    }
  }

  function addMessageToConversation(text, sender) {
    const conversation = conversations.find(conv => conv.id === currentConversationId);
    if (conversation) {
      conversation.messages.push({ text, sender });
      renderConversation(currentConversationId);
    }
  }

  function renderConversation(conversationId) {
    chatWindow.innerHTML = "";
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.messages.forEach(msg => {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", msg.sender);
        messageElement.textContent = msg.text;
        chatWindow.appendChild(messageElement);
      });
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }

  function botAutoResponse() {
    setTimeout(() => {
      addMessageToConversation("Estou aqui para ajudar!", "bot");
    }, 500);
  }

  /* ------------------------------------------------
     Perfil e Configurações (mesma lógica da versão anterior)
  ------------------------------------------------ */
  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");
  const configBtn = document.getElementById("configBtn");

  profileIcon.addEventListener("click", (e) => {
    profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
    e.stopPropagation();
  });

  window.addEventListener("click", (e) => {
    if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.style.display = "none";
    }
  });

  logoutBtn.addEventListener("click", () => {
    chatContainer.style.display = "none";
    loginContainer.style.display = "flex";
    profileDropdown.style.display = "none";
  });

  const configModal = document.getElementById("configModal");
  const closeModal = document.getElementById("closeModal");
  const configForm = document.getElementById("configForm");

  configBtn.addEventListener("click", () => {
    configModal.style.display = "block";
    profileDropdown.style.display = "none";
  });

  closeModal.addEventListener("click", () => {
    configModal.style.display = "none";
  });

  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const theme = document.querySelector('input[name="theme"]:checked').value;
    const fontSize = document.getElementById("fontSizeSelect").value;
    const fontFamily = document.getElementById("fontFamilySelect").value;
    
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    
    document.body.style.fontSize = fontSize;
    document.body.style.fontFamily = fontFamily;
    
    configModal.style.display = "none";
  });
});
