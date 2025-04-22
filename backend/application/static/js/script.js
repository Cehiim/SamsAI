document.addEventListener("DOMContentLoaded", function() {
  
/* ====================================================
   LÓGICA DA PÁGINA DO CHAT (chat.html)
   ==================================================== */

  // --------------------------------------------------------
  // Variáveis para armazenamento de conversas e mensagens
  // --------------------------------------------------------

  const URL = window.location.href;
  let conversa_id = URL.split('/')[URL.split('/').length - 1]; //ID da conversa atual

  let conversations = null; // Lista de conversas
  var currentConversation = false; // Conversa atual

  async function loadConversations() {
    try{
    const response = await fetch('/api/conversas');
    const data = await response.json();
    conversations = JSON.parse(data);

    // Renderiza a lista de conversas ao carregar a página
    renderConversationsSidebar();

    if(conversa_id != "new")
      currentConversation = conversations.find(conv => String(conv.pk) === String(conversa_id));
    }
    catch(error) {
      console.error("Erro ao buscar conversas:", error);
    }
  }
  loadConversations();
  

  let mensagens = JSON.parse('[]'); //Lista de mensagens da conversa
  if(conversa_id != "new") //Se a conversa não for nova, obtém as mensagens
  {
    async function loadMessages() {
      const response = await fetch(`/api/mensagens/${conversa_id}`);
      const data = await response.json();
      mensagens = JSON.parse(data);

      // Renderiza as mensagens ao carregar a página
      renderMessages();
    }
    loadMessages();
  }
  
  
  // ---------------------------
  // Seleção dos elementos do DOM
  // ---------------------------
  const historyList   = document.getElementById("historyList");
  const chatWindow    = document.getElementById("chatWindow");
  const warning       = document.getElementById("warning");
  const messageInput  = document.getElementById("messageInput");
  const sendBtn       = document.getElementById("sendBtn");
  const fileBtn       = document.getElementById("fileBtn");
  const fileInput     = document.getElementById("fileInput");
  const audioBtn      = document.getElementById("audioBtn");

  const profileIcon   = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");
  const configBtn     = document.getElementById("configBtn");
  const configModal   = document.getElementById("configModal");
  const closeModal    = document.getElementById("closeModal");
  const configForm    = document.getElementById("configForm");
  const PromptInput   = document.getElementById("prompt-input");

  // Constante que define número máximo de caracteres na mensagem
  const MAX_CHARACTERS = 7500; 

  // ---------------------------
  // Funções auxiliares
  // ---------------------------

  // Obtém CSRF_TOKEN
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  const CSRF_TOKEN = getCookie('csrftoken')

  // Renderiza a lista de conversas na barra lateral
  function renderConversationsSidebar() {
    if(conversa_id != "new")
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
      const titleP = document.createElement("p");
      titleP.classList.add("conversation-title");
      titleP.textContent = conv.fields.nome;
      
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
          li.replaceChild(input, titleP);
          input.focus();
          
          const finishEdit = () => {
            if (input.value.trim() !== "") {
              conv.fields.nome = input.value.trim();
          
              // Enviar atualização para o back-end via Fetch API (AJAX)
              fetch(`/rename/${conv.pk}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": CSRF_TOKEN, // Capturar o CSRF Token do Django
                },
                body: JSON.stringify({ nome: conv.fields.nome }),
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  console.log("Nome atualizado com sucesso!");
                } else {
                  console.error("Erro ao atualizar nome:", data.error);
                  ShowErrorMessage("Houve algum erro na conexão. Não foi possível trocar o nome da conversa");
                }
              })
              .catch(error => console.error("Erro na requisição:", error));
              ShowErrorMessage("Houve algum erro na conexão. Não foi possível trocar o nome da conversa");
            }
          
            titleP.textContent = conv.fields.nome;
            li.replaceChild(titleP, input);
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
      
      li.appendChild(titleP);
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
      conversations = conversations.filter(c => c.pk !== conv.pk);
      deleteModal.style.display = "none";
      const currentConversaId = window.location.pathname.split('/').pop(); //Obtém ID da URL
      // Enviar atualização para o back-end via Fetch API (AJAX)
    fetch(`/delete/${conv.pk}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": CSRF_TOKEN, // Capturar o CSRF Token do Django
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
    let new_prompt = PromptInput.value

    // Atualiza prompt com instrução para IA no back-end via Fetch API (AJAX)
    fetch("/change-prompt", {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify({ message: new_prompt })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log(data.message);
      } else {
        console.error("Erro ao atualizar prompt :", data.error);
        ShowErrorMessage("Houve algum erro na conexão. Não foi possível deletar a mensagem");
      }
    })
    .catch(error => console.error("Erro na requisição:", error));
    ShowErrorMessage("Houve algum erro na conexão. Não foi possível deletar a mensagem");

  });

  // ---------------------------
  // Obtenção dos parâmetros da URL e seleção da conversa atual
  // ---------------------------
  
  
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
        dot = document.createElement("span");
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
  animationInterval = setInterval(() => {
    dots.forEach((dot, i) => {
      if(i === index)
      {
        dot.style.animation = "bounce .6s cubic-bezier(0.6, 0.1, 1, 1.4) infinite";
        dot.style.animationDirection = "alternate";
      }
      
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

function ShowWarningMessage(waringMessage)
{
  warning.innerHTML = "";
  const warningIcon = document.createElement("img");
  warningIcon.src = "/static/img/triangle-exclamation.svg"
  warningIcon.style.height = "20px"
  warningIcon.style.width = "20px"
  warning.appendChild(warningIcon)

  warning.style.backgroundColor = "#d5a300";
  warning.style.position = "absolute";
  warning.style.padding = "10px";
  warning.style.top = "10vh"
  warning.style.left = "25%"
  warning.style.borderRadius = "10px"
  warning.style.display = "flex"
  warning.style.gap = "1vw"

  console.warn(waringMessage);
  const warningText = document.createTextNode(waringMessage);
  warning.appendChild(warningText);
}

function ShowErrorMessage(errorMessage)
{
  ShowWarningMessage(errorMessage);
  warning.style.backgroundColor = "#fa1e1e";
}

  // ---------------------------
  // Configuração dos eventos de envio de mensagem
  // ---------------------------
  sendBtn.addEventListener("click", () => {
    const messageText = messageInput.value.trim();
    if (messageText == "")
      { return; }
    else if (messageText.length > MAX_CHARACTERS)
    {
      const waringMessage = `Sua mensagem excedeu o limite de ${MAX_CHARACTERS} caracteres. Escreva uma mensagem mais curta!`;
      ShowWarningMessage(waringMessage);
      messageInput.value = "";
      return;
    }
    else
        { messageInput.value = ""; }

    // Enviar atualização para o back-end via Fetch API (AJAX)
    let conv_id;
    if (conversa_id == "new")
    {
        conv_id = "new";
        chatWindow.innerHTML = "";
    }
    else
    {
        conv_id = conversa_id;
    }
      mensagens.push({fields:{texto: messageText, eh_do_usuario: true}});

      // Adiciona mensagem do usuário e salva
      renderMessages(); // Exibe nova mensagem do usuário
      startLoadingAnimation(); //Exibe animação de espera

      // Enviar atualização para o back-end via Fetch API (AJAX)
      async function enviarMensagem(messageText, conv_id) {
        try {
          const response = await fetch(`/chat/${conv_id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": CSRF_TOKEN,
            },
            body: JSON.stringify({ message: messageText }),
          });
      
          const data = await response.json();
      
          if (data.success) {
            console.log("Mensagem salva com sucesso!");
      
            // IA respondeu — você pode adicionar a mensagem

            if (conversa_id === "new") {
              window.history.pushState({}, '', data.redirect);
              //window.location.href = data.redirect;
              // TODO: Pensar num mecanismo para obter somente a última conversa e última mensagem
              
              conversations.unshift({fields: {nome: data.nome_da_nova_conversa}, pk: data.nova_conversa_id});
              conversa_id = data.nova_conversa_id;

              renderConversationsSidebar();
            }
            mensagens.push({fields: { texto: data.message, eh_do_usuario: false }});
            stopLoadingAnimation(); //Encerra animação
            renderMessages(); // Mostra resposta da IA

          } else {
            console.error("Erro ao salvar mensagem:", data.error);
            ShowErrorMessage("Houve algum erro na conexão. Não foi possível enviar a mensagem");
          }
        } catch (error) {
          console.error("Erro na requisição:", error);
          ShowErrorMessage("Houve algum erro na conexão. Não foi possível enviar a mensagem");
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
            console.error("Erro ao salvar arquivo:", data.error);
            ShowErrorMessage("Houve algum erro na conexão. Não foi possível realizar o upload do PDF");
          }
        })
        .catch(error => console.error("Erro na requisição:", error));
        ShowErrorMessage("Houve algum erro na conexão. Não foi possível realizar o upload do PDF");

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
});