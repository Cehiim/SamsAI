document.addEventListener("DOMContentLoaded", function() {
  
/* ====================================================
   LÓGICA DA PÁGINA DO CHAT (chat.html)
   ==================================================== */

  // --------------------------------------------------------
  // Variáveis para armazenamento de conversas e mensagens
  // --------------------------------------------------------

  function GetConversaID() {
    const URL = window.location.href;
    let conversa_id = URL.split('/').pop(); //ID da conversa atual
    return conversa_id;
  }

  let conversations = null; // Lista de conversas
  var currentConversation = false; // Conversa atual

  // Obtém a lista de conversas da sidebar
  async function loadConversations() {
    try{
    const response = await fetch('/api/conversas');
    const data = await response.json();
    conversations = JSON.parse(data);

    // Renderiza a lista de conversas ao carregar a página
    renderConversationsSidebar();

    if(GetConversaID() != "new") //Atualiza currentConversation com o valor da conversa atual
      currentConversation = conversations.find(conv => String(conv.pk) === String(GetConversaID()));
    }
    catch(error) {
      console.error("Erro ao buscar conversas:", error);
    }
  }
  loadConversations();
  

  let mensagens = JSON.parse('[]'); //Lista de mensagens da conversa
  if(GetConversaID() != "new") //Se a conversa não for nova, obtém as mensagens
  {
    async function loadMessages() {
      const response = await fetch(`/api/mensagens/${GetConversaID()}`);
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
  
  const FileModal     = document.getElementById('file-modal');
  const FileName      = document.getElementById('file-name');
  const FileModalContent = document.getElementById('file-modal-content');
  const ViewFile      = document.getElementById('view-file');
  const CloseFile     = document.getElementById('close-file');
  const CloseFileError = document.getElementById('close-file-error');
  const ViewFileButtons = document.getElementById('ViewFileButtons');
  const ViewFileButtonsError = document.getElementById('ViewFileButtonsError');
  const ConfirmSendFile = document.getElementById('confirm-send-file');

  const configForm    = document.getElementById("configForm");
  const PromptInput   = document.getElementById("prompt-input");

  // Constante que define número máximo de caracteres na mensagem
  const MAX_CHARACTERS = 7500; 

  // Variável global para obter URL do arquivo na pré-visualização (antes de enviar pro back)
  let fileURL = ""; 

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
    if(GetConversaID() != "new")  //Se a conversa não for nova, exibe item de nova conversa sem background color de destaque
    {
      historyList.innerHTML = `
      <li class="conversation-item" data-id="new-chat" onclick="window.location.href='/chat/new'">
        <a class="conversation-title">Nova Conversa</a>
        <img style="height: 20px; width: 20px; margin-right: 5px;" src="/static/img/pen-to-square.svg" alt="Inicie uma nova conversa">
      </li>
      `;
    }
    else //Se a conversa for nova, exibe item de nova conversa com background color de destaque
    {
      historyList.innerHTML = `
      <li style="background-color: rgb(148, 63, 73);" class="conversation-item" data-id="new-chat" onclick="window.location.href='/chat/new'">
        <a class="conversation-title">Nova Conversa</a>
        <img style="height: 20px; width: 20px; margin-right: 5px;" src="/static/img/pen-to-square.svg" alt="Inicie uma nova conversa">
      </li>
      `;
    }
    conversations.forEach(conv => { //Renderiza as conversas
      // Cria o item da conversa
      const li = document.createElement("li");
      li.classList.add("conversation-item");
      li.setAttribute("data-id", conv.pk);
      li.setAttribute("onclick", `window.location.href='/chat/${conv.pk}'`); //Cria link que redireciona o usuário para a conversa ao clicá-la na sidebar

      if (GetConversaID() == conv.pk) //Coloca a conversa atual com um background color de destaque
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
        
        //Botões de Renomear e apagar conversa
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

              // ----------------------------------------------------------------------------
              // Enviar atualização do nome da conversa para o back-end via Fetch API (AJAX)
              // ----------------------------------------------------------------------------
              async function renameButton() {
                try{
                  const response = await fetch(`/rename/${conv.pk}`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-CSRFToken": CSRF_TOKEN, // Captura o CSRF Token do Django
                    },
                    body: JSON.stringify({ nome: conv.fields.nome }),
                });
                  const data = await response.json();
                  if (data.success) {
                    console.log(data.message)
                  }
                  else {
                    console.error("Erro ao atualizar nome:", data.error); //Exibe Error Message acima das mensagens
                    ShowErrorMessage("Houve algum erro na conexão. Não foi possível trocar o nome da conversa");
                  }
                }
                catch (error) {
                  console.error("Erro na requisição:", error); //Exibe Error Message acima das mensagens
                  ShowErrorMessage("Houve algum erro na conexão. Não foi possível trocar o nome da conversa");
                }
              }
              renameButton();     
            }
          
            titleP.textContent = conv.fields.nome; //Atualiza título da conversa na sidebar
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

    // -------------------------------------------------------------------------
    // Enviar atualização para deletar conversa no back-end via Fetch API (AJAX)
    // -------------------------------------------------------------------------
    fetch(`/delete/${conv.pk}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": CSRF_TOKEN, // Capturar o CSRF Token do Django
      },
      body: JSON.stringify({ key: GetConversaID() }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Conversa deletada com sucesso!");
        if (GetConversaID() == conv.pk) {
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
  
  
  // --------------
  // Configurações
  // --------------
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
    
    if (theme === "light") { // Define tema claro ou escuro
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    document.body.style.fontSize   = fontSize; //Define tamanho da fonte
    document.body.style.fontFamily = fontFamily; //Define tipo da fonte
    configModal.style.display = "none";
    let new_prompt = PromptInput.value // Obtém novo prompt de instrução

    // ----------------------------------------------------------------------
    // Atualiza prompt com instrução para IA no back-end via Fetch API (AJAX)
    // ----------------------------------------------------------------------
    async function changePrompt() {
      try{
        const response = await fetch("/change-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": CSRF_TOKEN,
          },
          body: JSON.stringify({ message: new_prompt }),
        });
        const data = await response.json();
        if (data.success) {
          console.log(data.message);
        } else {
          console.error("Erro ao atualizar prompt :", data.error); //Exibe mensagem de erro no topo da conversa
          ShowErrorMessage("Houve algum erro na conexão. Não foi possível alterar o prompt de instrução");
        }
      }
      catch (error) {
        console.error("Erro na requisição:", error); //Exibe mensagem de erro no topo da conversa
        ShowErrorMessage("Houve algum erro na conexão. Não foi possível alterar o prompt de instrução");
      }
    }
    changePrompt();
  });

  // ------------------------------------------------
  // Função para renderizar as mensagens da conversa
  // ------------------------------------------------
  function renderMessages() {
    chatWindow.innerHTML = "";
    mensagens.forEach(msg => {
      const msgDiv = document.createElement("div"); //Cria uma nova div para guardar a mensagem

      let content = msg.fields.texto;
      if(msg.fields.eh_do_usuario) //Se a mensagem é do usuário, marca como do usuário (CSS aplica os estilos diferentes)
      {
        msgDiv.classList.add("message", "user");
      }
      else
      {
        msgDiv.classList.add("message", "bot"); //Se a mensagem é da IA, marca como do usuário (CSS aplica os estilos diferentes)
        content = marked.parse(msg.fields.texto); // Passa a mensagem de Markdown para HTML
      }

      msgDiv.innerHTML = content; //Coloca a mensagem na div
      msgDiv.style.whiteSpace = "pre-line";
      chatWindow.appendChild(msgDiv);
    });

    ultimaMensagem = mensagens[mensagens.length - 1];

    if(ultimaMensagem.fields.eh_do_usuario) //Se a última mensagem é do usuário
    {
      const waitMessageDiv = document.createElement("div");
      waitMessageDiv.id = "wait-message"; //Cria div com animação de espera (animação feita no CSS)

      let dot = null; // Cria os três pontos
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

// -----------------------------------------------------------
// Funções para exibição de avisos e erros no topo da conversa
// -----------------------------------------------------------

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

  // ----------------------------------------------
  // Configuração dos eventos de envio de mensagem
  // ----------------------------------------------

  let isSending = false; // Variável que indica se há uma mensagem sendo enviada no momento

  sendBtn.addEventListener("click", () => {
    const messageText = messageInput.value.trim();
    if (isSending == true) return; // Se outra mensagem estiver sendo enviada, não faz nada

    else if (messageText == "") return; // Se a mensagem for vazia, não faz nada
      
    else if (messageText.length > MAX_CHARACTERS) //Se a mensagem exceder o limite de caracteres, exibe mensagem de aviso no topo da tela
    {
      const waringMessage = `Sua mensagem excedeu o limite de ${MAX_CHARACTERS} caracteres. Escreva uma mensagem mais curta!`;
      ShowWarningMessage(waringMessage);
      return;
    }
    else
        { messageInput.value = ""; } // Se a mensagem conter um número de caracteres dentro dos limites, esvazia o Input
    
    isSending = true; 
    sendBtn.disabled = true; //Desabilita botão de envio


    if (GetConversaID() == "new")
    {
        chatWindow.innerHTML = ""; //Se a conversa for nova, apaga mensagem de boas vindas
    }
      mensagens.push({fields:{texto: messageText, eh_do_usuario: true}}); //Guarda mensagem do usuário
      sendBtn.disabled = true; //Desabilita botão de envio

      // Adiciona mensagem do usuário e salva
      renderMessages(); // Exibe nova mensagem do usuário
      startLoadingAnimation(); //Exibe animação de espera

      // ---------------------------------------------------------------
      // Enviar mensagem do usuário para o back-end via Fetch API (AJAX)
      // ---------------------------------------------------------------
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
      
            // IA respondeu, salva a mensagem da IA

            if (GetConversaID() === "new") { // Se a conversa for nova, redireciona para outra URL
              window.history.pushState({}, '', data.redirect);
              conversations.unshift({fields: {nome: data.nome_da_nova_conversa}, pk: data.nova_conversa_id}); //Adiciona conversa na lista de conversas
              renderConversationsSidebar();
            }
            mensagens.push({fields: { texto: data.message, eh_do_usuario: false }}); // Adiciona mensagem da IA
            renderMessages(); // Mostra resposta da IA

          } else {
            console.error("Erro ao salvar mensagem:", data.error);
            ShowErrorMessage("Houve algum erro na conexão. Não foi possível enviar a mensagem");
          }
        } catch (error) {
          console.error("Erro na requisição:", error);
          ShowErrorMessage("Houve algum erro na conexão. Não foi possível enviar a mensagem");
        }
        finally {
          stopLoadingAnimation(); //Encerra animação
          isSending = false; 
          sendBtn.disabled = false; // Só reabilita aqui, no final do processo
        }
      }
    
    enviarMensagem(messageText, GetConversaID());
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
  
    // -----------------------------------------------
    // Pré visualização do arquivo PDF
    // -----------------------------------------------
  fileBtn.addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    FileModal.style.display = "flex";
    
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0]; // Arquivo PDF selecionado para envio
      console.log(fileInput.files);
      if (file && file.type === "application/pdf") {
        fileURL = URL.createObjectURL(file);
        FileName.innerText = file.name;

        ViewFile.innerHTML = `
        <embed src="${fileURL}" type="application/pdf" width="100%" height="600px" />
        `;
        ViewFileButtons.style.display = "flex";
        ViewFileButtonsError.style.display = "none";
        FileModalContent.style.maxWidth = "none";

      } else {
        ViewFile.innerHTML = "<h1>Por favor, selecione um arquivo PDF válido.</h1>";
        ViewFileButtons.style.display = "none";
        ViewFileButtonsError.style.display = "flex";
        FileModalContent.style.maxWidth = "";
        
      }   
    }
  });

  CloseFile.addEventListener("click", () => {
    FileModal.style.display = "none"
    FileName.innerText = "";
    ViewFile.innerHTML = "";
    FileModalContent.innerHTML = "";
    URL.revokeObjectURL(fileURL);
    fileInput.value = "";
  });

  // Fecha modal em caso de arquivo não ser PDF
  CloseFileError.addEventListener("click", () => {
    CloseFile.click();
  });

  // Envia PDF pro back-end
  ConfirmSendFile.addEventListener("click", () => {
    FileModal.style.display = "none"
    FileName.innerText = "";
    ViewFile.innerHTML = "";
    FileModalContent.innerHTML = "";
    URL.revokeObjectURL(fileURL);

    const file = fileInput.files[0]; // Arquivo PDF selecionado para envio
    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("titulo", file.name);

    // -----------------------------------------------
    // Enviar PDF para o back-end via Fetch API (AJAX)
    // -----------------------------------------------
      async function uploadFile() {
        try{
          const response = await fetch(`/upload/${GetConversaID()}`, {
            method: 'POST',
            headers: {
              'X-CSRFToken': CSRF_TOKEN
            },
            body: formData
          });
          const data = await response.json();
          if (data.success) {
            console.log(data.message);

            //TODO: Adicionar imagem do PDF na mensagem enviada pelo usuário
            
          } else {
            console.error("Erro ao salvar arquivo:", data.error);
            ShowErrorMessage("Houve algum erro na conexão. Não foi possível realizar o upload do PDF");
          }
        }
        catch (error) {
          console.error("Erro na requisição:", error);
          ShowErrorMessage("Houve algum erro na conexão. Não foi possível realizar o upload do PDF");
        }
      }

    uploadFile();
    console.log(fileInput);
    renderMessages();
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