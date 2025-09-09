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
      mensagens = data;
      // Renderiza as mensagens ao carregar a página
      renderMessages();
    }
    loadMessages();
  }

  let documents = null;

  // Obtém a lista de documentos do usuário
  async function loadFiles() {
    try{
      const response = await fetch('/api/documentos');
      const data = await response.json();
      documents = JSON.parse(data);
    }
    catch(error) {
      console.error("Erro ao buscar conversas:", error);
    }
  }
  loadFiles();
  
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
  const DesattachFile = document.getElementById('desattach-file');
  const ShowAttachedFile = document.getElementById('show-attached-file');
  const AttachedFileName = document.getElementById('attached-file-name');

  const ShowPDFButton = document.getElementById('show-pdfBtn');
  const FilesListModal   = document.getElementById('filesListModal');
  const CloseFilesListModal = document.getElementById('closeFilesListModal');

  const FilesListBody = document.getElementById('FilesListBody');

  const configForm    = document.getElementById("configForm");
  const PromptInput   = document.getElementById("prompt-input");

  // Constante que define número máximo de caracteres na mensagem
  const MAX_CHARACTERS = 7500; 

  // Variável global para obter URL do arquivo na pré-visualização (antes de enviar pro back)
  let fileURL = ""; 

  //Variável global para conferir se há um arquivo anexado à mensagem
  let has_file = false;

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
        <i class="fa fa-pen-to-square" style="font-size: 20px; margin-right: 5px;"></i>
      </li>
      `;
    }
    else //Se a conversa for nova, exibe item de nova conversa com background color de destaque
    {
      historyList.innerHTML = `
      <li style="background-color: rgb(148, 63, 73);" class="conversation-item" data-id="new-chat" onclick="window.location.href='/chat/new'">
        <a class="conversation-title">Nova Conversa</a>
        <i class="fa fa-pen-to-square" style="font-size: 20px; margin-right: 5px;"></i>
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
      const optionsIcon = document.createElement("i");
      optionsIcon.classList.add("options-icon", "fa", "fa-ellipsis");
      
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

  // ---------------------------------
  // Modal com lista de PDFs salvos
  // ---------------------------------

  function renderFilesList()
  {
    FilesListBody.innerHTML =  "";

    if (documents.length === 0)
    {
      FilesListBody.innerHTML = `<h4>Ainda não foi salvo nenhum arquivo</h4>`
    }
    else
    {
      const List = document.createElement("ul");
      FilesListBody.appendChild(List)

      documents.forEach(doc => {
        const Item = document.createElement("li");
        Item.innerHTML = `
        <iframe src="/show-pdf/${ doc.pk }?is_modal=true"></iframe>
        <a href="/show-pdf/${ doc.pk }?is_modal=false" target="_blank">
          <h3>${ doc.fields.titulo }</h3>
          <i class="fa fa-arrow-up-right-from-square fa-2x"></i>
        </a>
        `;
        const DeleteFileButton = document.createElement("button");
        DeleteFileButton.id = `doc-${ doc.pk }`;
        DeleteFileButton.className = "document-delete-buttons";
        DeleteFileButton.name = `${ doc.fields.titulo }`;
        DeleteFileButton.innerHTML = `<i class="fa fa-trash-can fa-2x"></i>`;
        
        Item.appendChild(DeleteFileButton);
        List.appendChild(Item);

        DeleteFileButton.addEventListener("click", (ev) => {
          ev.stopPropagation();
          showDeleteFileModal(doc.pk, doc.fields.titulo);
        });

      });
    }
  }

  ShowPDFButton.addEventListener("click", (e) => {
    FilesListModal.style.display = "flex";
    profileDropdown.style.display = "none";
    renderFilesList();
  });

  CloseFilesListModal.addEventListener("click", (e) => {
    FilesListModal.style.display = "none";
  });

  //Modal para exclusão de arquivos PDF do 
  function showDeleteFileModal(doc_id, doc_name)
  {
    const DeleteFileModal = document.getElementById("deleteFileModal");
    const DeleteFileModalBody = document.getElementById("deleteFileModalBody");
    const DeleteFileCancelBtn = document.getElementById("deleteFileCancelBtn");
    const DeleteFileConfirmBtn = document.getElementById("deleteFileConfirmBtn");

    DeleteFileModal.style.display = "flex";
    DeleteFileModalBody.textContent = `Deseja mesmo apagar o arquivo "${doc_name}"?`

    DeleteFileCancelBtn.addEventListener("click", () => {
      DeleteFileModal.style.display = "none"
    });

    DeleteFileConfirmBtn.addEventListener("click", () => {
      DeleteFileModal.style.display = "none";
      documents = documents.filter(doc => doc.pk !== doc_id);

    // -------------------------------------------------------------------------
    // Enviar atualização para deletar conversa no back-end via Fetch API (AJAX)
    // -------------------------------------------------------------------------
    fetch(`/delete-pdf/${doc_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": CSRF_TOKEN, // Capturar o CSRF Token do Django
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log(data.message);
        renderFilesList();
      }
    })
    .catch(error => console.error("Erro na requisição:", error));
    });
  }

  // ------------------------------------------------
  // Função para renderizar as mensagens da conversa
  // ------------------------------------------------
  function slugify(text) {
    return text
      .normalize('NFD')                     // Separa acentos das letras
      .replace(/[\u0300-\u036f]/g, '')     // Remove os acentos
      .replace(/\s+/g, '_')                // Substitui espaços por "_"
      .replace(/[^\w\-\.]+/g, '')          // Remove caracteres especiais (exceto "_", "-", ".")
      .replace(/\_\_+/g, '_')              // Remove underscores duplicados
      .replace(/^_+|_+$/g, '')             // Remove underscores no começo/fim
  }

  function createUserMessage(msgDiv, msg) 
  {
    msgDiv.classList.add("message", "user");
        
    if(msg.fields.documento !== null)
    {
      const AttachFileDiv = document.createElement("div");
      const UserMsg = document.createElement("p");
      AttachFileDiv.classList.add('message-file-attached')

      let link;
      if (msg.fields.documento.arquivo_url !== undefined)
        link = msg.fields.documento.arquivo_url;
      else
        link = `/media/upload/${slugify(msg.fields.documento.titulo)}`;

      AttachFileDiv.innerHTML = `
      <a href="${link}" target="_blank" alt="Documento PDF anexado">
        <i class="fa fa-file-pdf fa-3x"></i>
        <p class="attached-file-name">${msg.fields.documento.titulo}</p>
      </a>
      
      `;
      UserMsg.textContent = msg.fields.texto;
      msgDiv.appendChild(AttachFileDiv);
      msgDiv.appendChild(UserMsg)
    }
    else
    {
      const content = msg.fields.texto;
      msgDiv.textContent = content; //Adiciona conteúdo da mensagem do usuário
    }  
  }

  function createBotMessage(msgDiv, msg)
  {
    msgDiv.classList.add("message", "bot"); //Se a mensagem é da IA, marca como do usuário (CSS aplica os estilos diferentes)
    const content = marked.parse(msg.fields.texto); // Passa a mensagem de Markdown para HTML
    msgDiv.innerHTML = content; //Coloca a mensagem na div
  }

  function renderMessages() {
    //console.log(mensagens)
    chatWindow.innerHTML = "";
    mensagens.forEach(msg => {
      const msgDiv = document.createElement("div"); //Cria uma nova div para guardar a mensagem
      
      if (msg.pk !== null)
        msgDiv.setAttribute("message-id", msg.pk)

      if(msg.fields.eh_do_usuario) //Se a mensagem é do usuário, marca como do usuário (CSS aplica os estilos diferentes)
      {
        createUserMessage(msgDiv, msg);
      }
      else
      {
        createBotMessage(msgDiv, msg);
      }
      msgDiv.style.whiteSpace = "pre-line";
      chatWindow.appendChild(msgDiv);
    });
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // ---------------------------------------------
  // Função para renderizar as mensagens recentes
  // ---------------------------------------------

  function renderLastMessage() {

      const msgDiv = document.createElement("div"); //Cria uma nova div para guardar a mensagem
      chatWindow.appendChild(msgDiv);

      const ultimaMensagem = mensagens[mensagens.length - 1]

      if(ultimaMensagem.fields.eh_do_usuario) //Se a mensagem é do usuário, marca como do usuário (CSS aplica os estilos diferentes)
      {
        createUserMessage(msgDiv, ultimaMensagem);
        
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
      else
      {
        createBotMessage(msgDiv, ultimaMensagem);
      }
      msgDiv.style.whiteSpace = "pre-line";
      

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
  // Apaga a div com os pontos
  const waitMessageDiv = document.getElementById('wait-message');
  waitMessageDiv.remove();
}

// -----------------------------------------------------------
// Funções para exibição de avisos e erros no topo da conversa
// -----------------------------------------------------------

function ShowWarningMessage(waringMessage)
{
  warning.innerHTML = "";
  const warningIcon = document.createElement("i");
  warningIcon.classList.add("fa");
  warningIcon.classList.add("fa-triangle-exclamation");
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

    if (GetConversaID() == "new")
    {
        chatWindow.innerHTML = ""; //Se a conversa for nova, apaga mensagem de boas vindas
    }

    const formData = new FormData();

    //Obtém arquivo PDF anexado
    if(has_file)
    {
      const file = fileInput.files[0]; // Arquivo PDF selecionado para envio
      formData.append("arquivo", file);
      formData.append("titulo", file.name);
      mensagens.push({fields: { texto: messageText, eh_do_usuario: true, documento: {titulo: file.name} }}); // Guarda mensagem do usuário com PDF
    }
    else
    {
      mensagens.push({fields: { texto: messageText, eh_do_usuario: true, documento: null }}); // Guarda mensagem do usuário se não houver PDF
    }
    formData.append("message", messageText)
    
    DesattachFile.click(); // Desanexa o arquivo

    sendBtn.disabled = true; //Desabilita botão de envio

      // Adiciona mensagem do usuário e salva
      renderLastMessage(); // Exibe nova mensagem do usuário
      startLoadingAnimation(); //Exibe animação de espera

      // ---------------------------------------------------------------
      // Enviar mensagem do usuário para o back-end via Fetch API (AJAX)
      // ---------------------------------------------------------------
      async function enviarMensagem(conv_id) {
        try {
          const response = await fetch(`/chat/${conv_id}`, {
            method: "POST",
            headers: {
              "X-CSRFToken": CSRF_TOKEN,
            },
            body: formData
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

            if (has_file) { // Se há um arquivo PDF anexado, recarrega todas as mensagens da conversa para exibir o caminho do PDF correto
              mensagens[mensagens.length - 2].fields.documento.arquivo_url = `/show-pdf/${data.documento.pk}`;
              documents.push({fields: {titulo: data.documento.titulo}, pk: data.documento.pk});
              renderMessages();
            } else {
              renderLastMessage(); // Mostra resposta da IA
            }

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
          has_file = false;
        }
      }
    enviarMensagem(GetConversaID());
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

  //Cancela anexamento do PDF
  CloseFile.addEventListener("click", () => {
    FileModal.style.display = "none"
    FileName.innerText = "";
    ViewFile.innerHTML = "";
    URL.revokeObjectURL(fileURL);
    fileInput.value = "";
  });

  // Fecha modal em caso de arquivo não ser PDF
  CloseFileError.addEventListener("click", () => {
    CloseFile.click();
  });

  //Desanexa PDF na mensagem
  DesattachFile.addEventListener("click", () => {
    CloseFile.click();
    ShowAttachedFile.style.display = "";
    AttachedFileName.textContent = "";
    has_file = false
  })

  // Coloca o PDF como anexado à mensagem
  ConfirmSendFile.addEventListener("click", () => {
    FileModal.style.display = "none"
    FileName.innerText = "";
    ViewFile.innerHTML = "";
    ShowAttachedFile.style.display = "flex";

    has_file = true;
    const file = fileInput.files[0];
    AttachedFileName.textContent = file.name;
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