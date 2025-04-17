document.addEventListener("DOMContentLoaded", function() {
  
/* ====================================================
   LÓGICA DA PÁGINA DO CHAT (chat.html)
   ==================================================== */
//function initChatPage() {
  // ---------------------------
  // Variáveis e armazenamento
  // ---------------------------
  let conversations       = todas_as_conversas;
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

  function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
  }
  // Renderiza a lista de conversas na barra lateral
  function renderConversationsSidebar() {
    if(conversa_id != "None")
    {
      historyList.innerHTML = `
      <li class="conversation-item" data-id="new-chat" onclick="window.location.href='/chat/new'">
        <a class="conversation-title">Nova Conversa</a>
        <img style="height: 20px; width: 20px; margin-right: 5px;" src="/static/img/pen-to-square.svg" alt="Inicie uma nova conversa">
      </li>
      `;
    }
    else
    {
      historyList.innerHTML = `
      <li style="background-color: rgb(148, 63, 73);" class="conversation-item" data-id="new-chat" onclick="window.location.href='/chat/new'">
        <a class="conversation-title">Nova Conversa</a>
        <img style="height: 20px; width: 20px; margin-right: 5px;" src="/static/img/pen-to-square.svg" alt="Inicie uma nova conversa">
      </li>
      `;
    }
    conversations.forEach(conv => {
      // Cria o item da conversa
      const li = document.createElement("li");
      li.classList.add("conversation-item");
      li.setAttribute("data-id", conv.pk);
      li.setAttribute("onclick", `window.location.href='/chat/${conv.pk}'`);

      if (conversa_id == conv.pk)
      {
        li.setAttribute("style", "background-color:rgb(148, 63, 73)");
      }
      // Título da conversa (com limite de caracteres)
      const titleA = document.createElement("a");
      titleA.classList.add("conversation-title");
      titleA.textContent = conv.fields.nome;
      
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
          input.value = conv.fields.nome;
          input.classList.add("conversation-title-edit");
          li.replaceChild(input, titleA);
          input.focus();
          
          const finishEdit = () => {
            if (input.value.trim() !== "") {
              conv.fields.nome = input.value.trim();
          
              // Enviar atualização para o back-end via Fetch API (AJAX)
              fetch(`/rename/${conv.pk}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": getCSRFToken(), // Capturar o CSRF Token do Django
                },
                body: JSON.stringify({ nome: conv.fields.nome }),
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  console.log("Nome atualizado com sucesso!");
                } else {
                  console.error("Erro ao atualizar nome:", data.error);
                }
              })
              .catch(error => console.error("Erro na requisição:", error));
            }
          
            titleA.textContent = conv.fields.nome;
            li.replaceChild(titleA, input);
          };
          input.addEventListener("blur", finishEdit);
          input.addEventListener("keydown", (keyEv) => {
            if (keyEv.key === "Enter") {
              input.blur();
            } else if (keyEv.key === "Escape") {
              input.value = conv.fields.nome;
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
      
      li.appendChild(titleA);
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
    deleteModalBody.textContent  = `Deseja mesmo apagar a conversa "${conv.fields.nome}"?`;
    deleteModal.style.display = "flex";
    
    deleteCancelBtn.onclick = function() {
      deleteModal.style.display = "none";
    };
    
    deleteConfirmBtn.onclick = function() {
      console.log(conversations)
      conversations = conversations.filter(c => c.pk !== conv.pk);
      console.log(conversations)
      deleteModal.style.display = "none";
      const currentConversaId = window.location.pathname.split('/').pop(); //Obtém ID da URL
      // Enviar atualização para o back-end via Fetch API (AJAX)
    fetch(`/delete/${conv.pk}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(), // Capturar o CSRF Token do Django
      },
      body: JSON.stringify({ key: currentConversaId }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Conversa deletada com sucesso!");
        if (currentConversaId == conv.pk) {
          window.location.href = "/chat/new";  // Redireciona para a página de novo chat
        }
        renderConversationsSidebar();
      }
    })
    .catch(error => console.error("Erro na requisição:", error));
    };
  }

  // ---------------------------
  // Eventos dos botões e inputs
  // ---------------------------
  // Envio de mensagem: cria nova conversa e redireciona para ela
  
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

  // ---------------------------
  // Obtenção dos parâmetros da URL e seleção da conversa atual
  // ---------------------------
  var currentConversation = false;
  if(conversa_id != "None")
  {
    currentConversation = conversations.find(conv => String(conv.pk) === String(conversa_id));
  }
  
  // ---------------------------
  // Seleção dos elementos do DOM
  // ---------------------------

  // ---------------------------
  // Função para renderizar as mensagens da conversa
  // ---------------------------
  function renderMessages() {
    chatWindow.innerHTML = "";
    mensagens.forEach(msg => {
      const msgDiv = document.createElement("div");

      let content = msg.fields.texto;
      if(msg.fields.eh_do_usuario)
      {
        msgDiv.classList.add("message", "user");
      }
      else
      {
        msgDiv.classList.add("message", "bot");
        content = marked.parse(msg.fields.texto);
      }

      msgDiv.innerHTML = content;
      msgDiv.style.whiteSpace = "pre-line";
      chatWindow.appendChild(msgDiv);
    });

    ultimaMensagem = mensagens[mensagens.length - 1];

    if(ultimaMensagem.fields.eh_do_usuario)
    {
      const waitMessageDiv = document.createElement("div");
      waitMessageDiv.id = "wait-message";

      let dot = null;
      for (let i = 0; i < 3; i++) {
        dot = document.createElement("div");
        dot.classList.add("dots");
        waitMessageDiv.appendChild(dot);
      }
      chatWindow.appendChild(waitMessageDiv);
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function startLoadingAnimation() {
  const dots = document.querySelectorAll("#wait-message .dots");
  let index = 0;
  console.log(dots);
  animationInterval = setInterval(() => {
    dots.forEach((dot, i) => {
      dot.style.marginBottom = (i === index) ? "8px" : "0px";
    });
    index = (index + 1) % dots.length;
  }, 300);
}

function stopLoadingAnimation() {
  clearInterval(animationInterval);
  animationInterval = null;

  // Resetar os pontos
  const dots = document.querySelectorAll("#wait-message .dots");
  dots.forEach(dot => dot.style.marginBottom = "0px");
}

  // ---------------------------
  // Configuração dos eventos de envio de mensagem
  // ---------------------------
  sendBtn.addEventListener("click", () => {
    const messageText = messageInput.value.trim();
    if (messageText == "")
      return;
    else
        messageInput.value = "";

    // Enviar atualização para o back-end via Fetch API (AJAX)
    let conv_id;
    if (conversa_id == "None")
      {
        conv_id = "new";
      }
    else
      {
        conv_id = conversa_id;
        mensagens.push({fields:{texto: messageText, eh_do_usuario: true}});
        // Adiciona mensagem do usuário e salva
        renderMessages(); // Exibe nova mensagem do usuário
        startLoadingAnimation(); //Exibe animação de espera
      }

      async function enviarMensagem(messageText, conv_id) {
        try {
          const response = await fetch(`/chat/${conv_id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCSRFToken(),
            },
            body: JSON.stringify({ message: messageText }),
          });
      
          const data = await response.json();
      
          if (data.success) {
            console.log("Mensagem salva com sucesso!");
      
            // IA respondeu — você pode adicionar a mensagem

            if (conversa_id === "None") {
              window.location.href = data.redirect;
            }
            else{
              mensagens.push({fields: { texto: data.message, eh_do_usuario: false }});
              stopLoadingAnimation(); //Encerra animação
            }
      
            renderMessages(); // Mostra resposta da IA

          } else {
            console.error("Erro ao salvar mensagem:", data.error);
          }
        } catch (error) {
          console.error("Erro na requisição:", error);
        }
        
      }
    
    enviarMensagem(messageText, conv_id);
  });

  //Desabilita envio se o input estiver vazio
  messageInput.addEventListener("input", function() {
    sendBtn.disabled = messageInput.value.trim() === "";
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
      const formData = new FormData();

      formData.append("arquivo", file);
      formData.append("titulo", file.name);

      // Enviar PDF para o back-end via Fetch API (AJAX)
        fetch(`/upload/${conversa_id}`, {
          method: 'POST',
          headers: {
            'X-CSRFToken': getCSRFToken()
          },
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log(data.message);
          } else {
            console.error("Erro ao salvar mensagem:", data.error);
          }
        })
        .catch(error => console.error("Erro na requisição:", error));

      renderMessages();
      fileInput.value = "";
    }
  });
  
  // Simulação de envio de áudio
  audioBtn.addEventListener("click", () => {
    currentConversation.messages.push({ text: "Áudio enviado (simulação).", sender: "user" });
    renderMessages();
    setTimeout(() => {
      currentConversation.messages.push({ text: "Áudio recebido. Vou processar a informação!", sender: "bot" });
      renderMessages();
    }, 500);
  });
  
  // Renderiza as mensagens ao carregar a página
  if(conversa_id != "None")
  {
    renderMessages();
  }
  
});